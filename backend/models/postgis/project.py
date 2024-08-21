import json
import re
from typing import Optional
from cachetools import TTLCache, cached

import geojson
import datetime
from geoalchemy2 import Geometry
from geoalchemy2.shape import to_shape
import sqlalchemy as sa
from sqlalchemy.sql.expression import cast, or_
from sqlalchemy import desc, func, Time, orm, literal
from shapely.geometry import shape
from sqlalchemy.dialects.postgresql import ARRAY
import requests

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Boolean,
    Table,
    BigInteger,
    Index,
)
from sqlalchemy.orm import relationship, backref
from backend.exceptions import NotFound
from backend.models.dtos.campaign_dto import CampaignDTO, ListCampaignDTO
from backend.models.dtos.project_dto import (
    CustomEditorDTO,
    ProjectDTO,
    DraftProjectDTO,
    ProjectSummary,
    PMDashboardDTO,
    ProjectStatsDTO,
    ProjectUserStatsDTO,
    ProjectSearchDTO,
    ProjectTeamDTO,
    ProjectInfoDTO,
)
from backend.models.dtos.interests_dto import InterestDTO, ListInterestDTO
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from backend.models.dtos.tags_dto import TagsDTO
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.custom_editors import CustomEditor
from backend.models.postgis.priority_area import PriorityArea, project_priority_areas
from backend.models.postgis.project_info import ProjectInfo
from backend.models.postgis.project_chat import ProjectChat
from backend.models.postgis.statuses import (
    ProjectStatus,
    ProjectPriority,
    TaskStatus,
    MappingTypes,
    TaskCreationMode,
    Editors,
    TeamRoles,
    MappingPermission,
    ValidationPermission,
    ProjectDifficulty,
)
from backend.models.postgis.task import Task, TaskHistory
from backend.models.postgis.team import Team
from backend.models.postgis.user import User
from backend.models.postgis.campaign import Campaign, campaign_projects

from backend.models.postgis.utils import (
    ST_SetSRID,
    ST_GeomFromGeoJSON,
    timestamp,
    ST_Centroid,
)
from backend.services.grid.grid_service import GridService
from backend.models.postgis.interests import Interest, project_interests
import os
from backend.db import Base, get_session
from databases import Database


session = get_session()

# Secondary table defining many-to-many join for projects that were favorited by users.
project_favorites = Table(
    "project_favorites",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id")),
    Column("user_id", BigInteger, ForeignKey("users.id")),
)

# Secondary table defining many-to-many join for private projects that only defined users can map on
project_allowed_users = Table(
    "project_allowed_users",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id")),
    Column("user_id", BigInteger, ForeignKey("users.id")),
)


class ProjectTeams(Base):
    __tablename__ = "project_teams"
    team_id = Column(Integer, ForeignKey("teams.id"), primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), primary_key=True)
    role = Column(Integer, nullable=False)

    project = relationship(
        "Project", backref=backref("teams", cascade="all, delete-orphan")
    )
    team = relationship(Team, backref=backref("projects", cascade="all, delete-orphan"))

    def create(self):
        """Creates and saves the current model to the DB"""
        session.add(self)
        session.commit()

    def save(self):
        """Save changes to db"""
        session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()


# cache mapper counts for 30 seconds
active_mappers_cache = TTLCache(maxsize=1024, ttl=30)


class Project(Base):
    """Describes a HOT Mapping Project"""

    __tablename__ = "projects"

    # Columns
    id = Column(Integer, primary_key=True)
    status = Column(Integer, default=ProjectStatus.DRAFT.value, nullable=False)
    created = Column(DateTime, default=timestamp, nullable=False)
    priority = Column(Integer, default=ProjectPriority.MEDIUM.value)
    default_locale = Column(
        String(10), default="en"
    )  # The locale that is returned if requested locale not available
    author_id = Column(
        BigInteger, ForeignKey("users.id", name="fk_users"), nullable=False
    )
    difficulty = Column(
        Integer, default=2, nullable=False, index=True
    )  # Mapper level project is suitable for
    mapping_permission = Column(Integer, default=MappingPermission.ANY.value)
    validation_permission = Column(
        Integer, default=ValidationPermission.LEVEL.value
    )  # Means only users with validator role can validate
    enforce_random_task_selection = Column(
        Boolean, default=False
    )  # Force users to edit at random to avoid mapping "easy" tasks
    private = Column(Boolean, default=False)  # Only allowed users can validate
    featured = Column(Boolean, default=False)  # Only PMs can set a project as featured
    changeset_comment = Column(String)
    osmcha_filter_id = Column(
        String
    )  # Optional custom filter id for filtering on OSMCha
    due_date = Column(DateTime)
    imagery = Column(String)
    josm_preset = Column(String)
    id_presets = Column(ARRAY(String))
    extra_id_params = Column(String)
    rapid_power_user = Column(Boolean, default=False)
    last_updated = Column(DateTime, default=timestamp)
    progress_email_sent = Column(Boolean, default=False)
    license_id = Column(Integer, ForeignKey("licenses.id", name="fk_licenses"))
    geometry = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=False)
    centroid = Column(Geometry("POINT", srid=4326), nullable=False)
    country = Column(ARRAY(String), default=[])
    task_creation_mode = Column(
        Integer, default=TaskCreationMode.GRID.value, nullable=False
    )

    organisation_id = Column(
        Integer,
        ForeignKey("organisations.id", name="fk_organisations"),
        index=True,
    )

    # Tags
    mapping_types = Column(ARRAY(Integer), index=True)

    # Editors
    mapping_editors = Column(
        ARRAY(Integer),
        default=[
            Editors.ID.value,
            Editors.JOSM.value,
            Editors.CUSTOM.value,
        ],
        index=True,
        nullable=False,
    )
    validation_editors = Column(
        ARRAY(Integer),
        default=[
            Editors.ID.value,
            Editors.JOSM.value,
            Editors.CUSTOM.value,
        ],
        index=True,
        nullable=False,
    )

    # Stats
    total_tasks = Column(Integer, nullable=False)
    tasks_mapped = Column(Integer, default=0, nullable=False)
    tasks_validated = Column(Integer, default=0, nullable=False)
    tasks_bad_imagery = Column(Integer, default=0, nullable=False)

    # Mapped Objects
    tasks = orm.relationship(
        Task, backref="projects", cascade="all, delete, delete-orphan", lazy="dynamic"
    )
    project_info = orm.relationship(ProjectInfo, lazy="dynamic", cascade="all")
    project_chat = orm.relationship(ProjectChat, lazy="dynamic", cascade="all")
    author = orm.relationship(User)
    allowed_users = orm.relationship(User, secondary=project_allowed_users)
    priority_areas = orm.relationship(
        PriorityArea,
        secondary=project_priority_areas,
        cascade="all, delete-orphan",
        single_parent=True,
    )
    custom_editor = orm.relationship(
        CustomEditor, cascade="all, delete-orphan", uselist=False
    )
    favorited = orm.relationship(User, secondary=project_favorites, backref="favorites")
    # organisation = orm.relationship(Organisation, backref="projects", lazy="joined")
    organisation = orm.relationship(Organisation, backref="projects")
    campaign = orm.relationship(
        Campaign, secondary=campaign_projects, backref="projects"
    )
    interests = orm.relationship(
        Interest, secondary=project_interests, backref="projects"
    )

    def create_draft_project(self, draft_project_dto: DraftProjectDTO):
        """
        Creates a draft project
        :param draft_project_dto: DTO containing draft project details
        :param aoi: Area of Interest for the project (eg boundary of project)
        """
        self.project_info.append(
            ProjectInfo.create_from_name(draft_project_dto.project_name)
        )
        self.organisation = draft_project_dto.organisation
        self.status = ProjectStatus.DRAFT.value
        self.author_id = draft_project_dto.user_id
        self.last_updated = timestamp()

    def set_project_aoi(self, draft_project_dto: DraftProjectDTO):
        """Sets the AOI for the supplied project"""
        aoi_geojson = geojson.loads(json.dumps(draft_project_dto.area_of_interest))

        aoi_geometry = GridService.merge_to_multi_polygon(aoi_geojson, dissolve=True)

        valid_geojson = geojson.dumps(aoi_geometry)
        self.geometry = ST_SetSRID(ST_GeomFromGeoJSON(valid_geojson), 4326)
        self.centroid = ST_Centroid(self.geometry)

    def set_default_changeset_comment(self):
        """Sets the default changeset comment"""
        default_comment = current_app.config["DEFAULT_CHANGESET_COMMENT"]
        self.changeset_comment = (
            f"{default_comment}-{self.id} {self.changeset_comment}"
            if self.changeset_comment is not None
            else f"{default_comment}-{self.id}"
        )
        self.save()

    def set_country_info(self):
        """Sets the default country based on centroid"""

        centroid = to_shape(self.centroid)
        lat, lng = (centroid.y, centroid.x)
        url = "{0}/reverse?format=jsonv2&lat={1}&lon={2}&accept-language=en".format(
            current_app.config["OSM_NOMINATIM_SERVER_URL"], lat, lng
        )
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/58.0.3029.110 Safari/537.3"
            ),
            "Referer": os.environ.get("TM_APP_BASE_URL", "https://example.com"),
        }
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            country_info = response.json()  # returns a dict
            if country_info["address"].get("country") is not None:
                self.country = [country_info["address"]["country"]]
        except (
            KeyError,
            AttributeError,
            requests.exceptions.ConnectionError,
            requests.exceptions.HTTPError,
        ) as e:
            current_app.logger.debug(e, exc_info=True)

        self.save()

    def create(self):
        """Creates and saves the current model to the DB"""
        session.add(self)
        session.commit()

    def save(self):
        """Save changes to db"""
        session.commit()

    @staticmethod
    def clone(project_id: int, author_id: int):
        """Clone project"""

        orig = session.get(Project, project_id)
        if orig is None:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        # Transform into dictionary.
        orig_metadata = orig.__dict__.copy()

        # Remove unneeded data.
        items_to_remove = ["_sa_instance_state", "id", "allowed_users"]
        [orig_metadata.pop(i, None) for i in items_to_remove]

        # Remove clone from session so we can reinsert it as a new object
        orig_metadata.update(
            {
                "total_tasks": 0,
                "tasks_mapped": 0,
                "tasks_validated": 0,
                "tasks_bad_imagery": 0,
                "last_updated": timestamp(),
                "created": timestamp(),
                "author_id": author_id,
                "status": ProjectStatus.DRAFT.value,
            }
        )

        new_proj = Project(**orig_metadata)
        session.add(new_proj)

        proj_info = []
        for info in orig.project_info.all():
            info_data = info.__dict__.copy()
            info_data.pop("_sa_instance_state")
            info_data.update(
                {"project_id": new_proj.id, "project_id_str": str(new_proj.id)}
            )
            proj_info.append(ProjectInfo(**info_data))

        new_proj.project_info = proj_info

        # Replace changeset comment.
        default_comment = current_app.config["DEFAULT_CHANGESET_COMMENT"]

        if default_comment is not None:
            orig_changeset = f"{default_comment}-{orig.id}"  # Preserve space
            new_proj.changeset_comment = orig.changeset_comment.replace(
                orig_changeset, ""
            ).strip()

        # Populate teams, interests and campaigns
        teams = []
        for team in orig.teams:
            team_data = team.__dict__.copy()
            team_data.pop("_sa_instance_state")
            team_data.update({"project_id": new_proj.id})
            teams.append(ProjectTeams(**team_data))
        new_proj.teams = teams

        for field in ["interests", "campaign"]:
            value = getattr(orig, field)
            setattr(new_proj, field, value)
        if orig.custom_editor:
            new_proj.custom_editor = orig.custom_editor.clone_to_project(new_proj.id)

        return new_proj

    @staticmethod
    async def get(project_id: int, session) -> Optional["Project"]:
        """
        Gets specified project
        :param project_id: project ID in scope
        :return: Project if found otherwise None
        """
        result = await session.execute(
            sa.select(Project)
            .filter_by(id=project_id)
            .options(
                orm.noload(Project.tasks),
                orm.noload(Project.messages),
                orm.noload(Project.project_chat),
            )
        )
        project = result.scalars().first()
        return project

    async def update(self, project_dto: ProjectDTO, session):
        """Updates project from DTO"""
        self.status = ProjectStatus[project_dto.project_status].value
        self.priority = ProjectPriority[project_dto.project_priority].value
        locales = [i.locale for i in project_dto.project_info_locales]
        if project_dto.default_locale not in locales:
            new_locale_dto = ProjectInfoDTO()
            new_locale_dto.locale = project_dto.default_locale
            project_dto.project_info_locales.append(new_locale_dto)
        self.default_locale = project_dto.default_locale
        self.enforce_random_task_selection = project_dto.enforce_random_task_selection
        self.private = project_dto.private
        self.difficulty = ProjectDifficulty[project_dto.difficulty.upper()].value
        self.changeset_comment = project_dto.changeset_comment
        self.due_date = project_dto.due_date
        self.imagery = project_dto.imagery
        self.josm_preset = project_dto.josm_preset
        self.id_presets = project_dto.id_presets
        self.extra_id_params = project_dto.extra_id_params
        self.rapid_power_user = project_dto.rapid_power_user
        self.last_updated = timestamp()
        self.license_id = project_dto.license_id

        if project_dto.osmcha_filter_id:
            # Support simple extraction of OSMCha filter id from OSMCha URL
            match = re.search(r"aoi=([\w-]+)", project_dto.osmcha_filter_id)
            self.osmcha_filter_id = (
                match.group(1) if match else project_dto.osmcha_filter_id
            )
        else:
            self.osmcha_filter_id = None

        if project_dto.organisation:
            org = Organisation.get(project_dto.organisation)
            if org is None:
                raise NotFound(
                    sub_code="ORGANISATION_NOT_FOUND",
                    organisation_id=project_dto.organisation,
                )
            self.organisation = org

        # Cast MappingType strings to int array
        type_array = []
        for mapping_type in project_dto.mapping_types:
            type_array.append(MappingTypes[mapping_type].value)
        self.mapping_types = type_array

        # Cast Editor strings to int array
        mapping_editors_array = []
        for mapping_editor in project_dto.mapping_editors:
            mapping_editors_array.append(Editors[mapping_editor].value)
        self.mapping_editors = mapping_editors_array

        validation_editors_array = []
        for validation_editor in project_dto.validation_editors:
            validation_editors_array.append(Editors[validation_editor].value)
        self.validation_editors = validation_editors_array
        self.country = project_dto.country_tag

        # Add list of allowed users, meaning the project can only be mapped by users in this list
        if hasattr(project_dto, "allowed_users"):
            self.allowed_users = []  # Clear existing relationships then re-insert
            for user in project_dto.allowed_users:
                self.allowed_users.append(user)

        # Update teams and projects relationship.
        self.teams = []
        if hasattr(project_dto, "project_teams") and project_dto.project_teams:
            for team_dto in project_dto.project_teams:
                team = Team.get(team_dto.team_id)

                if team is None:
                    raise NotFound(sub_code="TEAM_NOT_FOUND", team_id=team_dto.team_id)

                role = TeamRoles[team_dto.role].value
                project_team = ProjectTeams(project=self, team=team, role=role)
                session.add(project_team)

        # Set Project Info for all returned locales
        for dto in project_dto.project_info_locales:
            project_info = self.project_info.filter_by(locale=dto.locale).one_or_none()
            if project_info is None:
                new_info = ProjectInfo.create_from_dto(
                    dto
                )  # Can't find info so must be new locale
                self.project_info.append(new_info)
            else:
                project_info.update_from_dto(dto)

        self.priority_areas = []  # Always clear Priority Area prior to updating
        if project_dto.priority_areas:
            for priority_area in project_dto.priority_areas:
                pa = PriorityArea.from_dict(priority_area)
                self.priority_areas.append(pa)

        if project_dto.custom_editor:
            if not self.custom_editor:
                new_editor = CustomEditor.create_from_dto(
                    self.id, project_dto.custom_editor
                )
                self.custom_editor = new_editor
            else:
                self.custom_editor.update_editor(project_dto.custom_editor)
        else:
            if self.custom_editor:
                self.custom_editor.delete()

        # handle campaign update
        try:
            new_ids = [c.id for c in project_dto.campaigns]
            new_ids.sort()
        except TypeError:
            new_ids = []
        current_ids = [c.id for c in self.campaign]
        current_ids.sort()
        if new_ids != current_ids:
            self.campaign = Campaign.query.filter(Campaign.id.in_(new_ids)).all()

        if project_dto.mapping_permission:
            self.mapping_permission = MappingPermission[
                project_dto.mapping_permission.upper()
            ].value

        if project_dto.validation_permission:
            self.validation_permission = ValidationPermission[
                project_dto.validation_permission.upper()
            ].value

        # handle interests update
        try:
            new_ids = [c.id for c in project_dto.interests]
            new_ids.sort()
        except TypeError:
            new_ids = []
        current_ids = [c.id for c in self.interests]
        current_ids.sort()
        if new_ids != current_ids:
            self.interests = Interest.query.filter(Interest.id.in_(new_ids)).all()

        # try to update country info if that information is not present
        if not self.country:
            self.set_country_info()

        session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()

    @staticmethod
    async def exists(project_id: int, session):
        query = select(literal(True)).where(
            select(Project.id).filter(Project.id == project_id).exists()
        )
        result = await session.execute(query)
        return result.scalar()
    
    def is_favorited(self, user_id: int) -> bool:
        user = session.get(User, user_id)
        if user not in self.favorited:
            return False

        return True

    def favorite(self, user_id: int):
        user = session.get(User, user_id)
        self.favorited.append(user)
        session.commit()

    def unfavorite(self, user_id: int):
        user = session.get(User, user_id)
        if user not in self.favorited:
            raise ValueError("NotFeatured- Project not been favorited by user")
        self.favorited.remove(user)
        session.commit()

    def set_as_featured(self):
        if self.featured is True:
            raise ValueError("AlreadyFeatured- Project is already featured")
        self.featured = True
        session.commit()

    def unset_as_featured(self):
        if self.featured is False:
            raise ValueError("NotFeatured- Project is not featured")
        self.featured = False
        session.commit()

    def can_be_deleted(self) -> bool:
        """Projects can be deleted if they have no mapped work"""
        task_count = self.tasks.filter(
            Task.task_status != TaskStatus.READY.value
        ).count()
        if task_count == 0:
            return True
        else:
            return False

    @staticmethod
    def get_projects_for_admin(
        admin_id: int, preferred_locale: str, search_dto: ProjectSearchDTO
    ) -> PMDashboardDTO:
        """Get projects for admin"""
        query = session.query(Project).filter(Project.author_id == admin_id)
        # Do Filtering Here

        if search_dto.order_by:
            if search_dto.order_by_type == "DESC":
                query = query.order_by(desc(search_dto.order_by))
            else:
                query = query.order_by(search_dto.order_by)

        admins_projects = query.all()

        if admins_projects is None:
            raise NotFound(sub_code="PROJECTS_NOT_FOUND")

        admin_projects_dto = PMDashboardDTO()
        for project in admins_projects:
            pm_project = project.get_project_summary(preferred_locale)
            project_status = ProjectStatus(project.status)

            if project_status == ProjectStatus.DRAFT:
                admin_projects_dto.draft_projects.append(pm_project)
            elif project_status == ProjectStatus.PUBLISHED:
                admin_projects_dto.active_projects.append(pm_project)
            elif project_status == ProjectStatus.ARCHIVED:
                admin_projects_dto.archived_projects.append(pm_project)
            else:
                current_app.logger.error(f"Unexpected state project {project.id}")

        return admin_projects_dto

    def get_project_user_stats(self, user_id: int) -> ProjectUserStatsDTO:
        """Compute project specific stats for a given user"""
        stats_dto = ProjectUserStatsDTO()
        stats_dto.time_spent_mapping = 0
        stats_dto.time_spent_validating = 0
        stats_dto.total_time_spent = 0

        total_mapping_time = (
            session.query(
                func.sum(
                    cast(func.to_timestamp(TaskHistory.action_text, "HH24:MI:SS"), Time)
                )
            )
            .filter(
                or_(
                    TaskHistory.action == "LOCKED_FOR_MAPPING",
                    TaskHistory.action == "AUTO_UNLOCKED_FOR_MAPPING",
                )
            )
            .filter(TaskHistory.user_id == user_id)
            .filter(TaskHistory.project_id == self.id)
        )
        for time in total_mapping_time:
            total_mapping_time = time[0]
            if total_mapping_time:
                stats_dto.time_spent_mapping = total_mapping_time.total_seconds()
                stats_dto.total_time_spent += stats_dto.time_spent_mapping

        query = (
            session.query(TaskHistory)
            .with_entities(
                func.date_trunc("minute", TaskHistory.action_date).label("trn"),
                func.max(TaskHistory.action_text).label("tm"),
            )
            .filter(TaskHistory.user_id == user_id)
            .filter(TaskHistory.project_id == self.id)
            .filter(TaskHistory.action == "LOCKED_FOR_VALIDATION")
            .group_by("trn")
            .subquery()
        )
        total_validation_time = session.query(
            func.sum(cast(func.to_timestamp(query.c.tm, "HH24:MI:SS"), Time))
        ).all()

        for time in total_validation_time:
            total_validation_time = time[0]
            if total_validation_time:
                stats_dto.time_spent_validating = total_validation_time.total_seconds()
                stats_dto.total_time_spent += stats_dto.time_spent_validating

        return stats_dto

    def get_project_stats(self) -> ProjectStatsDTO:
        """Create Project Stats model for postgis project object"""
        project_stats = ProjectStatsDTO()
        project_stats.project_id = self.id
        project_stats.area = (
            session.query(func.ST_Area(Project.geometry, True))
            .where(Project.id == self.id)
            .first()[0]
            / 1000000
        )

        project_stats.total_mappers = (
            session.query(User).filter(User.projects_mapped.any(self.id)).count()
        )
        project_stats.total_tasks = self.total_tasks
        project_stats.total_comments = (
            session.query(ProjectChat).filter(ProjectChat.project_id == self.id).count()
        )
        project_stats.percent_mapped = self.calculate_tasks_percent("mapped")
        project_stats.percent_validated = self.calculate_tasks_percent("validated")
        project_stats.percent_bad_imagery = self.calculate_tasks_percent("bad_imagery")
        centroid_geojson = session.scalar(self.centroid.ST_AsGeoJSON())
        project_stats.aoi_centroid = geojson.loads(centroid_geojson)
        project_stats.total_time_spent = 0
        project_stats.total_mapping_time = 0
        project_stats.total_validation_time = 0
        project_stats.average_mapping_time = 0
        project_stats.average_validation_time = 0

        total_mapping_time, total_mapping_tasks = (
            session.query(
                func.sum(
                    cast(func.to_timestamp(TaskHistory.action_text, "HH24:MI:SS"), Time)
                ),
                func.count(TaskHistory.action),
            )
            .filter(
                or_(
                    TaskHistory.action == "LOCKED_FOR_MAPPING",
                    TaskHistory.action == "AUTO_UNLOCKED_FOR_MAPPING",
                )
            )
            .filter(TaskHistory.project_id == self.id)
            .one()
        )

        if total_mapping_tasks > 0:
            total_mapping_time = total_mapping_time.total_seconds()
            project_stats.total_mapping_time = total_mapping_time
            project_stats.average_mapping_time = (
                total_mapping_time / total_mapping_tasks
            )
            project_stats.total_time_spent += total_mapping_time

        total_validation_time, total_validation_tasks = (
            session.query(
                func.sum(
                    cast(func.to_timestamp(TaskHistory.action_text, "HH24:MI:SS"), Time)
                ),
                func.count(TaskHistory.action),
            )
            .filter(
                or_(
                    TaskHistory.action == "LOCKED_FOR_VALIDATION",
                    TaskHistory.action == "AUTO_UNLOCKED_FOR_VALIDATION",
                )
            )
            .filter(TaskHistory.project_id == self.id)
            .one()
        )

        if total_validation_tasks > 0:
            total_validation_time = total_validation_time.total_seconds()
            project_stats.total_validation_time = total_validation_time
            project_stats.average_validation_time = (
                total_validation_time / total_validation_tasks
            )
            project_stats.total_time_spent += total_validation_time

        actions = []
        if project_stats.average_mapping_time <= 0:
            actions.append(TaskStatus.LOCKED_FOR_MAPPING.name)
        if project_stats.average_validation_time <= 0:
            actions.append(TaskStatus.LOCKED_FOR_VALIDATION.name)

        zoom_levels = []
        # Check that averages are non-zero.
        if len(actions) != 0:
            zoom_levels = (
                session.query(Task)
                .with_entities(Task.zoom.distinct())
                .filter(Task.project_id == self.id)
                .all()
            )
            zoom_levels = [z[0] for z in zoom_levels]

        # Validate project has arbitrary tasks.
        is_square = True
        if None in zoom_levels:
            is_square = False
        sq = (
            session.query(TaskHistory)
            .with_entities(
                Task.zoom,
                TaskHistory.action,
                (
                    cast(func.to_timestamp(TaskHistory.action_text, "HH24:MI:SS"), Time)
                ).label("ts"),
            )
            .filter(Task.is_square == is_square)
            .filter(TaskHistory.project_id == Task.project_id)
            .filter(TaskHistory.task_id == Task.id)
            .filter(TaskHistory.action.in_(actions))
        )
        if is_square is True:
            sq = sq.filter(Task.zoom.in_(zoom_levels))

        sq = sq.subquery()

        nz = (
            session.query(sq.c.zoom, sq.c.action, sq.c.ts)
            .filter(sq.c.ts > datetime.time(0))
            .limit(10000)
            .subquery()
        )

        if project_stats.average_mapping_time <= 0:
            mapped_avg = (
                session.query(nz.c.zoom, (func.avg(nz.c.ts)).label("avg"))
                .filter(nz.c.action == TaskStatus.LOCKED_FOR_MAPPING.name)
                .group_by(nz.c.zoom)
                .all()
            )
            if len(mapped_avg) != 0:
                mapping_time = sum([t.avg.total_seconds() for t in mapped_avg]) / len(
                    mapped_avg
                )
                project_stats.average_mapping_time = mapping_time

        if project_stats.average_validation_time <= 0:
            val_avg = (
                session.query(nz.c.zoom, (func.avg(nz.c.ts)).label("avg"))
                .filter(nz.c.action == TaskStatus.LOCKED_FOR_VALIDATION.name)
                .group_by(nz.c.zoom)
                .all()
            )
            if len(val_avg) != 0:
                validation_time = sum([t.avg.total_seconds() for t in val_avg]) / len(
                    val_avg
                )
                project_stats.average_validation_time = validation_time

        time_to_finish_mapping = (
            self.total_tasks
            - (self.tasks_mapped + self.tasks_bad_imagery + self.tasks_validated)
        ) * project_stats.average_mapping_time
        project_stats.time_to_finish_mapping = time_to_finish_mapping
        project_stats.time_to_finish_validating = (
            self.total_tasks - (self.tasks_validated + self.tasks_bad_imagery)
        ) * project_stats.average_validation_time

        return project_stats

    def get_project_summary(
        self, preferred_locale, calculate_completion=True
    ) -> ProjectSummary:
        """Create Project Summary model for postgis project object"""
        summary = ProjectSummary()
        summary.project_id = self.id
        priority = self.priority
        if priority == 0:
            summary.priority = "URGENT"
        elif priority == 1:
            summary.priority = "HIGH"
        elif priority == 2:
            summary.priority = "MEDIUM"
        else:
            summary.priority = "LOW"
        summary.author = User.get_by_id(self.author_id).username
        summary.default_locale = self.default_locale
        summary.country_tag = self.country
        summary.changeset_comment = self.changeset_comment
        summary.due_date = self.due_date
        summary.created = self.created
        summary.last_updated = self.last_updated
        summary.osmcha_filter_id = self.osmcha_filter_id
        summary.difficulty = ProjectDifficulty(self.difficulty).name
        summary.mapping_permission = MappingPermission(self.mapping_permission).name
        summary.validation_permission = ValidationPermission(
            self.validation_permission
        ).name
        summary.random_task_selection_enforced = self.enforce_random_task_selection
        summary.private = self.private
        summary.license_id = self.license_id
        summary.status = ProjectStatus(self.status).name
        summary.id_presets = self.id_presets
        summary.extra_id_params = self.extra_id_params
        summary.rapid_power_user = self.rapid_power_user
        summary.imagery = self.imagery
        if self.organisation_id:
            summary.organisation = self.organisation_id
            summary.organisation_name = self.organisation.name
            summary.organisation_slug = self.organisation.slug
            summary.organisation_logo = self.organisation.logo

        if self.campaign:
            summary.campaigns = [i.as_dto() for i in self.campaign]

        # Cast MappingType values to related string array
        mapping_types_array = []
        if self.mapping_types:
            for mapping_type in self.mapping_types:
                mapping_types_array.append(MappingTypes(mapping_type).name)
            summary.mapping_types = mapping_types_array

        if self.mapping_editors:
            mapping_editors = []
            for mapping_editor in self.mapping_editors:
                mapping_editors.append(Editors(mapping_editor).name)

            summary.mapping_editors = mapping_editors

        if self.validation_editors:
            validation_editors = []
            for validation_editor in self.validation_editors:
                validation_editors.append(Editors(validation_editor).name)

            summary.validation_editors = validation_editors

        if self.custom_editor:
            summary.custom_editor = self.custom_editor.as_dto()

        # If project is private, fetch list of allowed users
        if self.private:
            allowed_users = []
            for user in self.allowed_users:
                allowed_users.append(user.username)
            summary.allowed_users = allowed_users

        centroid_geojson = session.scalar(self.centroid.ST_AsGeoJSON())
        summary.aoi_centroid = geojson.loads(centroid_geojson)

        if calculate_completion:
            summary.percent_mapped = self.calculate_tasks_percent("mapped")
            summary.percent_validated = self.calculate_tasks_percent("validated")
            summary.percent_bad_imagery = self.calculate_tasks_percent("bad_imagery")

        summary.project_teams = [
            ProjectTeamDTO(
                dict(
                    team_id=t.team.id,
                    team_name=t.team.name,
                    role=TeamRoles(t.role).name,
                )
            )
            for t in self.teams
        ]

        project_info = ProjectInfo.get_dto_for_locale(
            self.id, preferred_locale, self.default_locale
        )
        summary.project_info = project_info

        return summary

    def get_project_title(self, preferred_locale):
        project_info = ProjectInfo.get_dto_for_locale(
            self.id, preferred_locale, self.default_locale
        )
        return project_info.name

    # @staticmethod
    # async def get_project_total_contributions(project_id: int, session) -> int:
    #     project_contributors_count = await session.scalar(
    #         sa.select(TaskHistory.user_id, sa.func.count())
    #         .select_from(TaskHistory)
    #         .filter(
    #             TaskHistory.project_id == project_id, TaskHistory.action != "COMMENT"
    #         )
    #         .distinct(TaskHistory.user_id)
    #         .group_by(TaskHistory.user_id)
    #     )

    #     return project_contributors_count
    

    @staticmethod
    async def get_project_total_contributions(project_id: int, db) -> int:
        query = """
            SELECT COUNT(DISTINCT user_id)
            FROM task_history
            WHERE project_id = :project_id AND action != 'COMMENT'
        """
        
        result = await db.fetch_one(query=query, values={"project_id": project_id})
        
        # fetch_one returns a single record, use index [0] to get the first column value
        return result[0] if result else 0

    # async def get_aoi_geometry_as_geojson(self, session):
    #     """Helper which returns the AOI geometry as a geojson object"""
    #     aoi_geojson = await session.execute(self.geometry.ST_AsGeoJSON())
    #     aoi_geojson = aoi_geojson.scalar()
    #     return geojson.loads(aoi_geojson)

    async def get_aoi_geometry_as_geojson(project_id: int, db: Database) -> dict:
        """Helper which returns the AOI geometry as a geojson object"""

        query = """
            SELECT ST_AsGeoJSON(geometry) AS aoi_geojson
            FROM projects
            WHERE id = :project_id
        """

        result = await db.fetch_one(query, {"project_id": project_id})
        if not result:
            raise ValueError("Project not found or geometry is missing")
        aoi_geojson = geojson.loads(result['aoi_geojson'])
        return aoi_geojson


    def get_project_teams(self):
        """Helper to return teams with members so we can handle permissions"""
        project_teams = []
        for t in self.teams:
            project_teams.append(
                {
                    "name": t.team.name,
                    "role": t.role,
                    "members": [m.member.username for m in t.team.members],
                }
            )

        return project_teams

    # @staticmethod
    # @cached(active_mappers_cache)
    # async def get_active_mappers(project_id, session) -> int:
    #     """Get count of Locked tasks as a proxy for users who are currently active on the project"""
    #     result = await session.execute(
    #         sa.select(func.count()).select_from(
    #             sa.select(Task.locked_by)
    #             .distinct(Task.locked_by)
    #             .filter(
    #                 Task.task_status.in_(
    #                     (
    #                         TaskStatus.LOCKED_FOR_MAPPING.value,
    #                         TaskStatus.LOCKED_FOR_VALIDATION.value,
    #                     )
    #                 )
    #             )
    #             .filter(Task.project_id == project_id)
    #         )
    #     )
    #     count = result.scalar()
    #     return count


    @staticmethod
    @cached(active_mappers_cache)
    async def get_active_mappers(project_id: int, database: Database) -> int:
        """Get count of Locked tasks as a proxy for users who are currently active on the project"""
        query = """
            SELECT COUNT(*)
            FROM (
                SELECT DISTINCT locked_by
                FROM tasks
                WHERE task_status IN (:locked_for_mapping, :locked_for_validation)
                AND project_id = :project_id
            ) AS active_mappers
        """

        values = {
            "project_id": project_id,
            "locked_for_mapping": TaskStatus.LOCKED_FOR_MAPPING.value,
            "locked_for_validation": TaskStatus.LOCKED_FOR_VALIDATION.value
        }

        count = await database.fetch_val(query, values)
        # Handle the case where count might be None
        return count or 0

    async def _get_project_and_base_dto(self, session):
        """Populates a project DTO with properties common to all roles"""

        project_query = (
            select(Project)
            .options(
                selectinload(Project.custom_editor),
                selectinload(Project.allowed_users),
                selectinload(Project.campaign),
                selectinload(Project.priority_areas),
            )
            .filter(Project.id == self.id)
        )
        
        result = await session.execute(project_query)
        project = result.scalar_one_or_none()
        
        if not project:
            raise ValueError("Project not found")
        
        base_dto = ProjectDTO()
        base_dto.project_id = self.id
        base_dto.project_status = ProjectStatus(self.status).name
        base_dto.default_locale = self.default_locale
        base_dto.project_priority = ProjectPriority(self.priority).name
        base_dto.area_of_interest = await self.get_aoi_geometry_as_geojson(session)
        base_dto.aoi_bbox = shape(base_dto.area_of_interest).bounds
        base_dto.mapping_permission = MappingPermission(self.mapping_permission).name
        base_dto.validation_permission = ValidationPermission(self.validation_permission).name
        base_dto.enforce_random_task_selection = self.enforce_random_task_selection
        base_dto.private = self.private
        base_dto.difficulty = ProjectDifficulty(self.difficulty).name
        base_dto.changeset_comment = self.changeset_comment
        base_dto.osmcha_filter_id = self.osmcha_filter_id
        base_dto.due_date = self.due_date
        base_dto.imagery = self.imagery
        base_dto.josm_preset = self.josm_preset
        base_dto.id_presets = self.id_presets
        base_dto.extra_id_params = self.extra_id_params
        base_dto.rapid_power_user = self.rapid_power_user
        base_dto.country_tag = self.country
        base_dto.organisation = self.organisation_id
        base_dto.license_id = self.license_id
        base_dto.created = self.created
        base_dto.last_updated = self.last_updated
        user = await User.get_by_id(self.author_id, session)
        base_dto.author = user.username
        base_dto.active_mappers = await Project.get_active_mappers(self.id, session)
        base_dto.task_creation_mode = TaskCreationMode(self.task_creation_mode).name

        base_dto.percent_mapped = self.calculate_tasks_percent("mapped")
        base_dto.percent_validated = self.calculate_tasks_percent("validated")
        base_dto.percent_bad_imagery = self.calculate_tasks_percent("bad_imagery")

        # base_dto.project_teams = [
        #     ProjectTeamDTO(
        #         dict(
        #             team_id=t.team.id,
        #             team_name=t.team.name,
        #             role=TeamRoles(t.role).name,
        #         )
        #     )
        #     for t in self.teams
        # ]

        if self.custom_editor:
            base_dto.custom_editor = self.custom_editor.as_dto()

        if self.private:
            # If project is private it should have a list of allowed users
            allowed_usernames = []
            for user in self.allowed_users:
                allowed_usernames.append(user.username)
            base_dto.allowed_usernames = allowed_usernames

        if self.mapping_types:
            mapping_types = []
            for mapping_type in self.mapping_types:
                mapping_types.append(MappingTypes(mapping_type).name)

            base_dto.mapping_types = mapping_types

        if self.campaign:
            base_dto.campaigns = [i.as_dto() for i in self.campaign]

        if self.mapping_editors:
            mapping_editors = []
            for mapping_editor in self.mapping_editors:
                mapping_editors.append(Editors(mapping_editor).name)

            base_dto.mapping_editors = mapping_editors

        if self.validation_editors:
            validation_editors = []
            for validation_editor in self.validation_editors:
                validation_editors.append(Editors(validation_editor).name)

            base_dto.validation_editors = validation_editors

        if self.priority_areas:
            geojson_areas = []
            for priority_area in self.priority_areas:
                geojson_areas.append(priority_area.get_as_geojson())

            base_dto.priority_areas = geojson_areas

        # base_dto.interests = [
        #     InterestDTO(dict(id=i.id, name=i.name)) for i in self.interests
        # ]
        base_dto.interests = []

        return self, base_dto

    @staticmethod
    async def get_project_and_base_dto(project_id: int, db: Database) -> ProjectDTO:
        """Populates a project DTO with properties common to all roles"""

        # Raw SQL query to fetch project data with date formatting
        query = """
            SELECT p.id as project_id, p.status as project_status, p.default_locale, p.priority as project_priority,
                p.mapping_permission, p.validation_permission, p.enforce_random_task_selection, p.private,
                p.difficulty, p.changeset_comment, p.osmcha_filter_id, 
                TO_CHAR(COALESCE(p.due_date, NULL), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as due_date,
                p.imagery, p.josm_preset, p.id_presets, p.extra_id_params, p.rapid_power_user, p.country,
                p.organisation_id, p.license_id,
                TO_CHAR(p.created, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created,
                TO_CHAR(p.last_updated, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as last_updated,
                u.username as author,
                p.total_tasks, p.tasks_mapped, p.tasks_validated, p.tasks_bad_imagery, p.task_creation_mode, p.mapping_types, p.mapping_editors, p.validation_editors, p.organisation_id
            FROM projects p
            LEFT JOIN users u ON p.author_id = u.id
            WHERE p.id = :project_id
        """
        # Execute query and fetch the result
        record = await db.fetch_one(query, {"project_id": project_id})
        
        if not record:
            raise ValueError("Project not found")

        area_of_interest = await Project.get_aoi_geometry_as_geojson(project_id, db)
        aoi_bbox = shape(area_of_interest).bounds
        active_mappers = await Project.get_active_mappers(project_id, db)

        # stats
        tasks_mapped = record.tasks_mapped
        tasks_validated = record.tasks_validated
        total_tasks = record.total_tasks
        tasks_bad_imagery = record.tasks_bad_imagery

        percent_mapped = Project.calculate_tasks_percent("mapped", tasks_mapped, tasks_validated, total_tasks, tasks_bad_imagery)
        percent_validated = Project.calculate_tasks_percent("validated", tasks_validated, tasks_validated, total_tasks, tasks_bad_imagery)
        percent_bad_imagery = Project.calculate_tasks_percent("bad_imagery", tasks_mapped, tasks_validated, total_tasks, tasks_bad_imagery)

        # Convert record to DTO
        project_dto = ProjectDTO(
            project_id=record.project_id,
            project_status=ProjectStatus(record.project_status).name,
            default_locale=record.default_locale,
            project_priority=ProjectPriority(record.project_priority).name,
            area_of_interest=area_of_interest,
            aoi_bbox=aoi_bbox,
            mapping_permission=MappingPermission(record.mapping_permission).name,
            validation_permission=ValidationPermission(record.validation_permission).name,
            enforce_random_task_selection=record.enforce_random_task_selection,
            private=record.private,
            difficulty=ProjectDifficulty(record.difficulty).name,
            changeset_comment=record.changeset_comment,
            osmcha_filter_id=record.osmcha_filter_id,
            due_date=record.due_date,
            imagery=record.imagery,
            josm_preset=record.josm_preset,
            id_presets=record.id_presets,
            extra_id_params=record.extra_id_params,
            rapid_power_user=record.rapid_power_user,
            country_tag=record.country,
            organisation=record.organisation_id,
            license_id=record.license_id,
            created=record.created,
            last_updated=record.last_updated,
            author=record.author,
            active_mappers=active_mappers,
            task_creation_mode=TaskCreationMode(record.task_creation_mode).name,
            mapping_types = [MappingTypes(mapping_type).name for mapping_type in record.mapping_types] if record.mapping_types is not None else [],
            mapping_editors=[Editors(editor).name for editor in record.mapping_editors] if record.mapping_editors else [],
            validation_editors=[Editors(editor).name for editor in record.validation_editors] if record.validation_editors else [],
            percent_mapped=percent_mapped,
            percent_validated=percent_validated,
            percent_bad_imagery=percent_bad_imagery,
        )
        # Fetch project teams
        teams_query = """
            SELECT 
                t.id AS team_id, 
                t.name AS team_name, 
                pt.role 
            FROM 
                project_teams pt
            JOIN 
                teams t ON t.id = pt.team_id
            WHERE 
                pt.project_id = :project_id
        """
        teams = await db.fetch_all(teams_query, {"project_id": project_id})
        project_dto.project_teams = [ProjectTeamDTO(**team) for team in teams] if teams else []

        custom_editor = await db.fetch_one("""
            SELECT project_id, name, description, url
            FROM project_custom_editors
            WHERE project_id = :project_id
        """, {"project_id": project_id})

        if custom_editor:
            project_dto.custom_editor = CustomEditorDTO(**custom_editor)

        if project_dto.private:
            allowed_users_query = """
                SELECT u.username
                FROM allowed_users au
                JOIN users u ON au.user_id = u.id
                WHERE au.project_id = :project_id
            """
            allowed_usernames = await db.fetch_all(allowed_users_query, {"project_id": project_id})
            project_dto.allowed_usernames = [user.username for user in allowed_usernames]

        campaigns_query = """
            SELECT c.id, c.name
            FROM campaigns c
            JOIN campaign_projects cp ON c.id = cp.campaign_id
            WHERE cp.project_id = :project_id
        """
        campaigns = await db.fetch_all(campaigns_query, {"project_id": project_id})
        project_dto.campaigns = [ListCampaignDTO(**c) for c in campaigns]

        priority_areas_query = """
            SELECT ST_AsGeoJSON(pa.geometry) as geojson
            FROM priority_areas pa
            JOIN project_priority_areas ppa ON pa.id = ppa.priority_area_id
            WHERE ppa.project_id = :project_id
        """
        priority_areas = await db.fetch_all(priority_areas_query, {"project_id": project_id})
        project_dto.priority_areas = [area['geojson'] for area in priority_areas] if priority_areas else None

        interests_query = """
            SELECT i.id, i.name
            FROM interests i
            JOIN project_interests pi ON i.id = pi.interest_id
            WHERE pi.project_id = :project_id
        """
        interests = await db.fetch_all(interests_query, {"project_id": project_id})
        project_dto.interests = [ListInterestDTO(**i) for i in interests]
        return project_dto
    
    @staticmethod
    async def as_dto_for_mapping(
        project_id: int,
        db: Database,
        authenticated_user_id: int = None,
        locale: str = "en",
        abbrev: bool = True,
    ) -> Optional[ProjectDTO]:
        
        """Creates a Project DTO suitable for transmitting to mapper users"""
        project_dto = await Project.get_project_and_base_dto(project_id, db)
    
        if abbrev is False:
            project_dto.tasks = await Task.get_tasks_as_geojson_feature_collection(
                db, project_id, None
            )
        else:
            project_dto.tasks = await Task.get_tasks_as_geojson_feature_collection_no_geom(
                db, project_id
            )

        project_dto.project_info = await ProjectInfo.get_dto_for_locale(
            db, project_id, locale, project_dto.default_locale
        )

        if project_dto.organisation:
            # Fetch organisation details
            org_query = """
                SELECT
                    id AS "organisation_id",
                    name,
                    slug,
                    logo
                FROM organisations
                WHERE id = :organisation_id
            """
            org_record = await db.fetch_one(org_query, values={"organisation_id": project_dto.organisation})
            if org_record:
                project_dto.organisation_name = org_record.name
                project_dto.organisation_logo = org_record.logo
                project_dto.organisation_slug = org_record.slug

        project_dto.project_info_locales = await ProjectInfo.get_dto_for_all_locales(db, project_id)

        return project_dto
    

    def tasks_as_geojson(
        self, task_ids_str: str, order_by=None, order_by_type="ASC", status=None
    ):
        """Creates a geojson of all areas"""
        project_tasks = Task.get_tasks_as_geojson_feature_collection(
            self.id, task_ids_str, order_by, order_by_type, status
        )

        return project_tasks
    
    
    @staticmethod
    async def get_all_countries(database: Database) -> TagsDTO:
        # Raw SQL query to unnest the country field, select distinct values, and order by country
        query = """
        SELECT DISTINCT UNNEST(country) AS country
        FROM projects
        ORDER BY country
        """
        rows = await database.fetch_all(query=query)
        countries = [row["country"] for row in rows]
        tags_dto = TagsDTO(tags=countries)
        return tags_dto
    

    # def calculate_tasks_percent(self, target):
    #     """Calculates percentages of contributions"""
    #     try:
    #         if target == "mapped":
    #             return int(
    #                 (self.tasks_mapped + self.tasks_validated)
    #                 / (self.total_tasks - self.tasks_bad_imagery)
    #                 * 100
    #             )
    #         elif target == "validated":
    #             return int(
    #                 self.tasks_validated
    #                 / (self.total_tasks - self.tasks_bad_imagery)
    #                 * 100
    #             )
    #         elif target == "bad_imagery":
    #             return int((self.tasks_bad_imagery / self.total_tasks) * 100)
    #         elif target == "project_completion":
    #             # To calculate project completion we assign 2 points to each task
    #             # one for mapping and one for validation
    #             return int(
    #                 (self.tasks_mapped + (self.tasks_validated * 2))
    #                 / ((self.total_tasks - self.tasks_bad_imagery) * 2)
    #                 * 100
    #             )
    #     except ZeroDivisionError:
    #         return 0

    @staticmethod
    def calculate_tasks_percent(
        target: str, 
        tasks_mapped: int, 
        tasks_validated: int, 
        total_tasks: int, 
        tasks_bad_imagery: int
    ) -> int:
        """Calculates percentages of contributions based on provided statistics."""
        try:
            if target == "mapped":
                return int(
                    (tasks_mapped + tasks_validated)
                    / (total_tasks - tasks_bad_imagery)
                    * 100
                )
            elif target == "validated":
                return int(
                    tasks_validated
                    / (total_tasks - tasks_bad_imagery)
                    * 100
                )
            elif target == "bad_imagery":
                return int((tasks_bad_imagery / total_tasks) * 100)
            elif target == "project_completion":
                # To calculate project completion we assign 2 points to each task
                # one for mapping and one for validation
                return int(
                    (tasks_mapped + (tasks_validated * 2))
                    / ((total_tasks - tasks_bad_imagery) * 2)
                    * 100
                )
        except ZeroDivisionError:
            return 0

    def as_dto_for_admin(self, project_id):
        """Creates a Project DTO suitable for transmitting to project admins"""
        project, project_dto = self._get_project_and_base_dto()

        if project is None:
            return None

        project_dto.project_info_locales = ProjectInfo.get_dto_for_all_locales(
            project_id
        )

        return project_dto

    def create_or_update_interests(self, interests_ids):
        self.interests = []
        objs = [Interest.get_by_id(i) for i in interests_ids]
        self.interests.extend(objs)
        session.commit()

    @staticmethod
    async def get_project_campaigns(project_id: int, db: Database):
        query = """
            SELECT c.id, c.name
            FROM campaign_projects cp
            JOIN campaigns c ON cp.campaign_id = c.id
            WHERE cp.project_id = :project_id
        """
        rows = await db.fetch_all(query=query, values={"project_id": project_id})
        
        campaign_list = [ListCampaignDTO(**row) for row in rows]
        return campaign_list


# Add index on project geometry
Index("idx_geometry", Project.geometry, postgresql_using="gist")
