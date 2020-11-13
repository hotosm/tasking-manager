import json
import re
from typing import Optional
from cachetools import TTLCache, cached

import geojson
import datetime
from flask import current_app
from geoalchemy2 import Geometry
from geoalchemy2.shape import to_shape
from sqlalchemy.sql.expression import cast, or_
from sqlalchemy import text, desc, func, Time, orm, literal
from shapely.geometry import shape
from sqlalchemy.dialects.postgresql import ARRAY
import requests

from backend import db
from backend.models.dtos.campaign_dto import CampaignDTO
from backend.models.dtos.project_dto import (
    ProjectDTO,
    DraftProjectDTO,
    ProjectSummary,
    PMDashboardDTO,
    ProjectStatsDTO,
    ProjectUserStatsDTO,
    ProjectSearchDTO,
    ProjectTeamDTO,
)
from backend.models.dtos.interests_dto import InterestDTO

from backend.models.dtos.tags_dto import TagsDTO
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.custom_editors import CustomEditor
from backend.models.postgis.priority_area import PriorityArea, project_priority_areas
from backend.models.postgis.project_info import ProjectInfo
from backend.models.postgis.project_chat import ProjectChat
from backend.models.postgis.statuses import (
    ProjectStatus,
    ProjectPriority,
    MappingLevel,
    TaskStatus,
    MappingTypes,
    TaskCreationMode,
    Editors,
    TeamRoles,
    MappingPermission,
    ValidationPermission,
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
    NotFound,
)
from backend.services.grid.grid_service import GridService
from backend.models.postgis.interests import Interest, project_interests

# Secondary table defining many-to-many join for projects that were favorited by users.
project_favorites = db.Table(
    "project_favorites",
    db.metadata,
    db.Column("project_id", db.Integer, db.ForeignKey("projects.id")),
    db.Column("user_id", db.BigInteger, db.ForeignKey("users.id")),
)

# Secondary table defining many-to-many join for private projects that only defined users can map on
project_allowed_users = db.Table(
    "project_allowed_users",
    db.metadata,
    db.Column("project_id", db.Integer, db.ForeignKey("projects.id")),
    db.Column("user_id", db.BigInteger, db.ForeignKey("users.id")),
)


class ProjectTeams(db.Model):
    __tablename__ = "project_teams"
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), primary_key=True)
    role = db.Column(db.Integer, nullable=False)

    project = db.relationship(
        "Project", backref=db.backref("teams", cascade="all, delete-orphan")
    )
    team = db.relationship(
        Team, backref=db.backref("projects", cascade="all, delete-orphan")
    )

    def create(self):
        """ Creates and saves the current model to the DB """
        db.session.add(self)
        db.session.commit()

    def save(self):
        """ Save changes to db"""
        db.session.commit()

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()


# cache mapper counts for 30 seconds
active_mappers_cache = TTLCache(maxsize=1024, ttl=30)


class Project(db.Model):
    """ Describes a HOT Mapping Project """

    __tablename__ = "projects"

    # Columns
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.Integer, default=ProjectStatus.DRAFT.value, nullable=False)
    created = db.Column(db.DateTime, default=timestamp, nullable=False)
    priority = db.Column(db.Integer, default=ProjectPriority.MEDIUM.value)
    default_locale = db.Column(
        db.String(10), default="en"
    )  # The locale that is returned if requested locale not available
    author_id = db.Column(
        db.BigInteger, db.ForeignKey("users.id", name="fk_users"), nullable=False
    )
    mapper_level = db.Column(
        db.Integer, default=2, nullable=False, index=True
    )  # Mapper level project is suitable for
    mapping_permission = db.Column(db.Integer, default=MappingPermission.ANY.value)
    validation_permission = db.Column(
        db.Integer, default=ValidationPermission.ANY.value
    )  # Means only users with validator role can validate
    enforce_random_task_selection = db.Column(
        db.Boolean, default=False
    )  # Force users to edit at random to avoid mapping "easy" tasks
    private = db.Column(db.Boolean, default=False)  # Only allowed users can validate
    featured = db.Column(
        db.Boolean, default=False
    )  # Only PMs can set a project as featured
    changeset_comment = db.Column(db.String)
    osmcha_filter_id = db.Column(
        db.String
    )  # Optional custom filter id for filtering on OSMCha
    due_date = db.Column(db.DateTime)
    imagery = db.Column(db.String)
    josm_preset = db.Column(db.String)
    id_presets = db.Column(ARRAY(db.String))
    last_updated = db.Column(db.DateTime, default=timestamp)
    license_id = db.Column(db.Integer, db.ForeignKey("licenses.id", name="fk_licenses"))
    geometry = db.Column(Geometry("MULTIPOLYGON", srid=4326), nullable=False)
    centroid = db.Column(Geometry("POINT", srid=4326), nullable=False)
    country = db.Column(ARRAY(db.String), default=[])
    task_creation_mode = db.Column(
        db.Integer, default=TaskCreationMode.GRID.value, nullable=False
    )

    organisation_id = db.Column(
        db.Integer,
        db.ForeignKey("organisations.id", name="fk_organisations"),
        index=True,
    )

    # Tags
    mapping_types = db.Column(ARRAY(db.Integer), index=True)

    # Editors
    mapping_editors = db.Column(
        ARRAY(db.Integer),
        default=[
            Editors.ID.value,
            Editors.JOSM.value,
            Editors.CUSTOM.value,
        ],
        index=True,
        nullable=False,
    )
    validation_editors = db.Column(
        ARRAY(db.Integer),
        default=[
            Editors.ID.value,
            Editors.JOSM.value,
            Editors.CUSTOM.value,
        ],
        index=True,
        nullable=False,
    )

    # Stats
    total_tasks = db.Column(db.Integer, nullable=False)
    tasks_mapped = db.Column(db.Integer, default=0, nullable=False)
    tasks_validated = db.Column(db.Integer, default=0, nullable=False)
    tasks_bad_imagery = db.Column(db.Integer, default=0, nullable=False)

    # Mapped Objects
    tasks = db.relationship(
        Task, backref="projects", cascade="all, delete, delete-orphan", lazy="dynamic"
    )
    project_info = db.relationship(ProjectInfo, lazy="dynamic", cascade="all")
    project_chat = db.relationship(ProjectChat, lazy="dynamic", cascade="all")
    author = db.relationship(User)
    allowed_users = db.relationship(User, secondary=project_allowed_users)
    priority_areas = db.relationship(
        PriorityArea,
        secondary=project_priority_areas,
        cascade="all, delete-orphan",
        single_parent=True,
    )
    custom_editor = db.relationship(CustomEditor, uselist=False)
    favorited = db.relationship(User, secondary=project_favorites, backref="favorites")
    organisation = db.relationship(Organisation, backref="projects")
    campaign = db.relationship(
        Campaign, secondary=campaign_projects, backref="projects"
    )
    interests = db.relationship(
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
        self.status = ProjectStatus.DRAFT.value
        self.author_id = draft_project_dto.user_id
        self.last_updated = timestamp()

    def set_project_aoi(self, draft_project_dto: DraftProjectDTO):
        """ Sets the AOI for the supplied project """
        aoi_geojson = geojson.loads(json.dumps(draft_project_dto.area_of_interest))

        aoi_geometry = GridService.merge_to_multi_polygon(aoi_geojson, dissolve=True)

        valid_geojson = geojson.dumps(aoi_geometry)
        self.geometry = ST_SetSRID(ST_GeomFromGeoJSON(valid_geojson), 4326)
        self.centroid = ST_Centroid(self.geometry)

    def set_default_changeset_comment(self):
        """ Sets the default changeset comment"""
        default_comment = current_app.config["DEFAULT_CHANGESET_COMMENT"]
        self.changeset_comment = (
            f"{default_comment}-{self.id} {self.changeset_comment}"
            if self.changeset_comment is not None
            else f"{default_comment}-{self.id}"
        )
        self.save()

    def set_country_info(self):
        """ Sets the default country based on centroid"""

        centroid = to_shape(self.centroid)
        lat, lng = (centroid.y, centroid.x)
        url = "{0}/reverse?format=jsonv2&lat={1}&lon={2}&accept-language=en".format(
            current_app.config["OSM_NOMINATIM_SERVER_URL"], lat, lng
        )
        try:
            country_info = requests.get(url).json()  # returns a dict
            if country_info["address"].get("country") is not None:
                self.country = [country_info["address"]["country"]]
        except (KeyError, AttributeError, requests.exceptions.ConnectionError):
            pass

        self.save()

    def create(self):
        """ Creates and saves the current model to the DB """
        db.session.add(self)
        db.session.commit()

    def save(self):
        """ Save changes to db"""
        db.session.commit()

    @staticmethod
    def clone(project_id: int, author_id: int):
        """ Clone project """

        orig = Project.query.get(project_id)
        if orig is None:
            raise NotFound()

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
        db.session.add(new_proj)

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
            )

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
        new_proj.custom_editor = orig.custom_editor

        return new_proj

    @staticmethod
    def get(project_id: int):
        """
        Gets specified project
        :param project_id: project ID in scope
        :return: Project if found otherwise None
        """
        return Project.query.options(
            orm.noload("tasks"), orm.noload("messages"), orm.noload("project_chat")
        ).get(project_id)

    def update(self, project_dto: ProjectDTO):
        """ Updates project from DTO """
        self.status = ProjectStatus[project_dto.project_status].value
        self.priority = ProjectPriority[project_dto.project_priority].value
        self.default_locale = project_dto.default_locale
        self.enforce_random_task_selection = project_dto.enforce_random_task_selection
        self.private = project_dto.private
        self.mapper_level = MappingLevel[project_dto.mapper_level.upper()].value
        self.changeset_comment = project_dto.changeset_comment
        self.due_date = project_dto.due_date
        self.imagery = project_dto.imagery
        self.josm_preset = project_dto.josm_preset
        self.id_presets = project_dto.id_presets
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
                raise NotFound("Organisation does not exist")
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
                    raise NotFound("Team not found")

                role = TeamRoles[team_dto.role].value
                ProjectTeams(project=self, team=team, role=role)

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

        db.session.commit()

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def exists(project_id):
        query = Project.query.filter(Project.id == project_id).exists()

        return db.session.query(literal(True)).filter(query).scalar()

    def is_favorited(self, user_id: int) -> bool:
        user = User.query.get(user_id)
        if user not in self.favorited:
            return False

        return True

    def favorite(self, user_id: int):
        user = User.query.get(user_id)
        self.favorited.append(user)
        db.session.commit()

    def unfavorite(self, user_id: int):
        user = User.query.get(user_id)
        if user not in self.favorited:
            raise ValueError("Project not been favorited by user")
        self.favorited.remove(user)
        db.session.commit()

    def set_as_featured(self):
        if self.featured is True:
            raise ValueError("Project is already featured")
        self.featured = True
        db.session.commit()

    def unset_as_featured(self):
        if self.featured is False:
            raise ValueError("Project is not featured")
        self.featured = False
        db.session.commit()

    def can_be_deleted(self) -> bool:
        """ Projects can be deleted if they have no mapped work """
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
        """ Get projects for admin """
        query = Project.query.filter(Project.author_id == admin_id)
        # Do Filtering Here

        if search_dto.order_by:
            if search_dto.order_by_type == "DESC":
                query = query.order_by(desc(search_dto.order_by))
            else:
                query = query.order_by(search_dto.order_by)

        admins_projects = query.all()

        if admins_projects is None:
            raise NotFound("No projects found for admin")

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
            db.session.query(
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
            TaskHistory.query.with_entities(
                func.date_trunc("minute", TaskHistory.action_date).label("trn"),
                func.max(TaskHistory.action_text).label("tm"),
            )
            .filter(TaskHistory.user_id == user_id)
            .filter(TaskHistory.project_id == self.id)
            .filter(TaskHistory.action == "LOCKED_FOR_VALIDATION")
            .group_by("trn")
            .subquery()
        )
        total_validation_time = db.session.query(
            func.sum(cast(func.to_timestamp(query.c.tm, "HH24:MI:SS"), Time))
        ).all()

        for time in total_validation_time:
            total_validation_time = time[0]
            if total_validation_time:
                stats_dto.time_spent_validating = total_validation_time.total_seconds()
                stats_dto.total_time_spent += stats_dto.time_spent_validating

        return stats_dto

    def get_project_stats(self) -> ProjectStatsDTO:
        """ Create Project Stats model for postgis project object"""
        project_stats = ProjectStatsDTO()
        project_stats.project_id = self.id
        project_area_sql = "select ST_Area(geometry, true)/1000000 as area from public.projects where id = :id"
        project_area_result = db.engine.execute(text(project_area_sql), id=self.id)

        project_stats.area = project_area_result.fetchone()["area"]
        project_stats.total_mappers = (
            db.session.query(User).filter(User.projects_mapped.any(self.id)).count()
        )
        project_stats.total_tasks = self.total_tasks
        project_stats.total_comments = (
            db.session.query(ProjectChat)
            .filter(ProjectChat.project_id == self.id)
            .count()
        )
        project_stats.percent_mapped = Project.calculate_tasks_percent(
            "mapped",
            self.total_tasks,
            self.tasks_mapped,
            self.tasks_validated,
            self.tasks_bad_imagery,
        )
        project_stats.percent_validated = Project.calculate_tasks_percent(
            "validated",
            self.total_tasks,
            self.tasks_mapped,
            self.tasks_validated,
            self.tasks_bad_imagery,
        )
        project_stats.percent_bad_imagery = Project.calculate_tasks_percent(
            "bad_imagery",
            self.total_tasks,
            self.tasks_mapped,
            self.tasks_validated,
            self.tasks_bad_imagery,
        )
        centroid_geojson = db.session.scalar(self.centroid.ST_AsGeoJSON())
        project_stats.aoi_centroid = geojson.loads(centroid_geojson)
        project_stats.total_time_spent = 0
        project_stats.total_mapping_time = 0
        project_stats.total_validation_time = 0
        project_stats.average_mapping_time = 0
        project_stats.average_validation_time = 0

        total_mapping_time, total_mapping_tasks = (
            db.session.query(
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
            db.session.query(
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
                Task.query.with_entities(Task.zoom.distinct())
                .filter(Task.project_id == self.id)
                .all()
            )
            zoom_levels = [z[0] for z in zoom_levels]

        # Validate project has arbitrary tasks.
        is_square = True
        if None in zoom_levels:
            is_square = False
        sq = (
            TaskHistory.query.with_entities(
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
            db.session.query(sq.c.zoom, sq.c.action, sq.c.ts)
            .filter(sq.c.ts > datetime.time(0))
            .limit(10000)
            .subquery()
        )

        if project_stats.average_mapping_time <= 0:
            mapped_avg = (
                db.session.query(nz.c.zoom, (func.avg(nz.c.ts)).label("avg"))
                .filter(nz.c.action == TaskStatus.LOCKED_FOR_MAPPING.name)
                .group_by(nz.c.zoom)
                .all()
            )
            mapping_time = sum([t.avg.total_seconds() for t in mapped_avg]) / len(
                mapped_avg
            )
            project_stats.average_mapping_time = mapping_time

        if project_stats.average_validation_time <= 0:
            val_avg = (
                db.session.query(nz.c.zoom, (func.avg(nz.c.ts)).label("avg"))
                .filter(nz.c.action == TaskStatus.LOCKED_FOR_VALIDATION.name)
                .group_by(nz.c.zoom)
                .all()
            )
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
        ) * project_stats.average_validation_time + time_to_finish_mapping

        return project_stats

    def get_project_summary(self, preferred_locale) -> ProjectSummary:
        """ Create Project Summary model for postgis project object"""
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
        summary.mapper_level = MappingLevel(self.mapper_level).name
        summary.mapping_permission = MappingPermission(self.mapping_permission).name
        summary.validation_permission = ValidationPermission(
            self.validation_permission
        ).name
        summary.random_task_selection_enforced = self.enforce_random_task_selection
        summary.private = self.private
        summary.license_id = self.license_id
        summary.status = ProjectStatus(self.status).name
        summary.id_presets = self.id_presets
        summary.imagery = self.imagery
        if self.organisation_id:
            summary.organisation = self.organisation_id
            summary.organisation_name = self.organisation.name
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

        centroid_geojson = db.session.scalar(self.centroid.ST_AsGeoJSON())
        summary.aoi_centroid = geojson.loads(centroid_geojson)

        summary.percent_mapped = Project.calculate_tasks_percent(
            "mapped",
            self.total_tasks,
            self.tasks_mapped,
            self.tasks_validated,
            self.tasks_bad_imagery,
        )
        summary.percent_validated = Project.calculate_tasks_percent(
            "validated",
            self.total_tasks,
            self.tasks_mapped,
            self.tasks_validated,
            self.tasks_bad_imagery,
        )
        summary.percent_bad_imagery = Project.calculate_tasks_percent(
            "bad_imagery",
            self.total_tasks,
            self.tasks_mapped,
            self.tasks_validated,
            self.tasks_bad_imagery,
        )
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

    @staticmethod
    def get_project_total_contributions(project_id: int) -> int:

        project_contributors_count = (
            TaskHistory.query.with_entities(TaskHistory.user_id)
            .filter(
                TaskHistory.project_id == project_id, TaskHistory.action != "COMMENT"
            )
            .distinct(TaskHistory.user_id)
            .count()
        )

        return project_contributors_count

    def get_aoi_geometry_as_geojson(self):
        """ Helper which returns the AOI geometry as a geojson object """
        aoi_geojson = db.engine.execute(self.geometry.ST_AsGeoJSON()).scalar()
        return geojson.loads(aoi_geojson)

    def get_project_teams(self):
        """ Helper to return teams with members so we can handle permissions """
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

    @staticmethod
    @cached(active_mappers_cache)
    def get_active_mappers(project_id) -> int:
        """ Get count of Locked tasks as a proxy for users who are currently active on the project """

        return (
            Task.query.filter(
                Task.task_status.in_(
                    (
                        TaskStatus.LOCKED_FOR_MAPPING.value,
                        TaskStatus.LOCKED_FOR_VALIDATION.value,
                    )
                )
            )
            .filter(Task.project_id == project_id)
            .distinct(Task.locked_by)
            .count()
        )

    def _get_project_and_base_dto(self):
        """ Populates a project DTO with properties common to all roles """
        base_dto = ProjectDTO()
        base_dto.project_id = self.id
        base_dto.project_status = ProjectStatus(self.status).name
        base_dto.default_locale = self.default_locale
        base_dto.project_priority = ProjectPriority(self.priority).name
        base_dto.area_of_interest = self.get_aoi_geometry_as_geojson()
        base_dto.aoi_bbox = shape(base_dto.area_of_interest).bounds
        base_dto.mapping_permission = MappingPermission(self.mapping_permission).name
        base_dto.validation_permission = ValidationPermission(
            self.validation_permission
        ).name
        base_dto.enforce_random_task_selection = self.enforce_random_task_selection
        base_dto.private = self.private
        base_dto.mapper_level = MappingLevel(self.mapper_level).name
        base_dto.changeset_comment = self.changeset_comment
        base_dto.osmcha_filter_id = self.osmcha_filter_id
        base_dto.due_date = self.due_date
        base_dto.imagery = self.imagery
        base_dto.josm_preset = self.josm_preset
        base_dto.id_presets = self.id_presets
        base_dto.country_tag = self.country
        base_dto.organisation_id = self.organisation_id
        base_dto.license_id = self.license_id
        base_dto.created = self.created
        base_dto.last_updated = self.last_updated
        base_dto.author = User.get_by_id(self.author_id).username
        base_dto.active_mappers = Project.get_active_mappers(self.id)
        base_dto.task_creation_mode = TaskCreationMode(self.task_creation_mode).name
        base_dto.percent_mapped = Project.calculate_tasks_percent(
            "mapped",
            self.total_tasks,
            self.tasks_mapped,
            self.tasks_validated,
            self.tasks_bad_imagery,
        )
        base_dto.percent_validated = Project.calculate_tasks_percent(
            "validated",
            self.total_tasks,
            self.tasks_mapped,
            self.tasks_validated,
            self.tasks_bad_imagery,
        )
        base_dto.percent_bad_imagery = Project.calculate_tasks_percent(
            "bad_imagery",
            self.total_tasks,
            self.tasks_mapped,
            self.tasks_validated,
            self.tasks_bad_imagery,
        )

        base_dto.project_teams = [
            ProjectTeamDTO(
                dict(
                    team_id=t.team.id,
                    team_name=t.team.name,
                    role=TeamRoles(t.role).name,
                )
            )
            for t in self.teams
        ]

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

        base_dto.interests = [
            InterestDTO(dict(id=i.id, name=i.name)) for i in self.interests
        ]

        return self, base_dto

    def as_dto_for_mapping(
        self, authenticated_user_id: int = None, locale: str = "en", abbrev: bool = True
    ) -> Optional[ProjectDTO]:
        """ Creates a Project DTO suitable for transmitting to mapper users """
        project, project_dto = self._get_project_and_base_dto()
        if abbrev is False:
            project_dto.tasks = Task.get_tasks_as_geojson_feature_collection(
                self.id, None
            )
        else:
            project_dto.tasks = Task.get_tasks_as_geojson_feature_collection_no_geom(
                self.id
            )
        project_dto.project_info = ProjectInfo.get_dto_for_locale(
            self.id, locale, project.default_locale
        )
        if project.organisation_id:
            project_dto.organisation = project.organisation.id
            project_dto.organisation_name = project.organisation.name
            project_dto.organisation_logo = project.organisation.logo

        project_dto.project_info_locales = ProjectInfo.get_dto_for_all_locales(self.id)
        return project_dto

    def tasks_as_geojson(
        self, task_ids_str: str, order_by=None, order_by_type="ASC", status=None
    ):
        """ Creates a geojson of all areas """
        project_tasks = Task.get_tasks_as_geojson_feature_collection(
            self.id, task_ids_str, order_by, order_by_type, status
        )

        return project_tasks

    @staticmethod
    def get_all_countries():
        query = (
            db.session.query(func.unnest(Project.country).label("country"))
            .distinct()
            .order_by("country")
            .all()
        )
        tags_dto = TagsDTO()
        tags_dto.tags = [r[0] for r in query]
        return tags_dto

    @staticmethod
    def calculate_tasks_percent(
        target, total_tasks, tasks_mapped, tasks_validated, tasks_bad_imagery
    ):
        """ Calculates percentages of contributions """
        if target == "mapped":
            return int(
                (tasks_mapped + tasks_validated)
                / (total_tasks - tasks_bad_imagery)
                * 100
            )
        elif target == "validated":
            return int(tasks_validated / (total_tasks - tasks_bad_imagery) * 100)
        elif target == "bad_imagery":
            return int((tasks_bad_imagery / total_tasks) * 100)

    def as_dto_for_admin(self, project_id):
        """ Creates a Project DTO suitable for transmitting to project admins """
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
        db.session.commit()

    @staticmethod
    def get_project_campaigns(project_id: int):
        query = (
            Campaign.query.join(campaign_projects)
            .filter(campaign_projects.c.project_id == project_id)
            .all()
        )
        campaign_list = []
        for campaign in query:
            campaign_dto = CampaignDTO()
            campaign_dto.id = campaign.id
            campaign_dto.name = campaign.name

            campaign_list.append(campaign_dto)

        return campaign_list


# Add index on project geometry
db.Index("idx_geometry", Project.geometry, postgresql_using="gist")
