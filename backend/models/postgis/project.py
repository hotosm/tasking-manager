import json
import os
import re
from typing import Optional

import geojson
import requests
from cachetools import TTLCache
from databases import Database
from fastapi import HTTPException
from geoalchemy2 import Geometry, WKTElement
from geoalchemy2.shape import to_shape
from loguru import logger
from shapely.geometry import shape
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.hybrid import hybrid_property


from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    delete,
    func,
    inspect,
    orm,
    select,
    update,
)
from sqlalchemy.orm import backref, relationship

from backend.config import settings
from backend.db import Base
from backend.exceptions import NotFound
from backend.models.dtos.campaign_dto import CampaignDTO, ListCampaignDTO
from backend.models.dtos.interests_dto import InterestDTO
from backend.models.dtos.project_dto import (
    CustomEditorDTO,
    DraftProjectDTO,
    PMDashboardDTO,
    ProjectDTO,
    ProjectInfoDTO,
    ProjectSearchDTO,
    ProjectStatsDTO,
    ProjectSummary,
    ProjectTeamDTO,
    ProjectUserStatsDTO,
)
from backend.models.dtos.tags_dto import TagsDTO
from backend.models.postgis.campaign import Campaign, campaign_projects
from backend.models.postgis.custom_editors import CustomEditor
from backend.models.postgis.interests import Interest, project_interests
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.priority_area import PriorityArea, project_priority_areas
from backend.models.postgis.project_chat import ProjectChat
from backend.models.postgis.project_info import ProjectInfo
from backend.models.postgis.statuses import (
    Editors,
    MappingPermission,
    MappingTypes,
    ProjectDifficulty,
    ProjectPriority,
    ProjectStatus,
    TaskCreationMode,
    TaskStatus,
    TeamRoles,
    ValidationPermission,
)
from backend.models.postgis.task import Task
from backend.models.postgis.team import Team
from backend.models.postgis.user import User
from backend.models.postgis.utils import timestamp
from backend.services.grid.grid_service import GridService

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

    async def create(self, db: Database):
        """Creates and saves the current model to the DB"""
        await db.execute(
            self.__table__.insert().values(
                team_id=self.team_id, project_id=self.project_id, role=self.role
            )
        )


# cache mapper counts for 30 seconds
active_mappers_cache = TTLCache(maxsize=1024, ttl=30)


class Project(Base):
    """Describes a HOT Mapping Project"""

    __tablename__ = "projects"

    def __init__(self, **kwargs):
        # First, initialize with provided kwargs
        super().__init__(**kwargs)

        # Then dynamically set defaults for any fields that are None
        for column in self.__table__.columns:
            if getattr(self, column.name) is None and column.default is not None:
                # Retrieve the default value from the column
                default_value = (
                    column.default.arg
                    if callable(column.default.arg)
                    else column.default.arg
                )
                setattr(self, column.name, default_value)

    # Columns
    id = Column(Integer, primary_key=True)
    status = Column(Integer, default=ProjectStatus.DRAFT.value, nullable=False)
    created = Column(DateTime, default=timestamp(), nullable=False)
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
    last_updated = Column(DateTime, default=timestamp())
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

    # Total tasks are always >= 1
    @hybrid_property
    def percent_mapped(self):
        return (
            (self.tasks_mapped + self.tasks_validated)
            * 100
            // (self.total_tasks - self.tasks_bad_imagery)
        )

    @hybrid_property
    def percent_validated(self):
        return self.tasks_validated * 100 // (self.total_tasks - self.tasks_bad_imagery)

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
    partnerships = orm.relationship("ProjectPartnership", backref="project")

    def create_draft_project(self, draft_project_dto: DraftProjectDTO):
        """
        Creates a draft project
        :param draft_project_dto: DTO containing draft project details
        :param aoi: Area of Interest for the project (eg boundary of project)
        """
        organisation = dict(draft_project_dto.organisation)
        organisation["id"] = organisation.pop("organisation_id")
        self.organisation = Organisation(**organisation)
        self.organisation_id = self.organisation.id
        self.status = ProjectStatus.DRAFT.value
        self.author_id = draft_project_dto.user_id
        self.created = timestamp()
        self.last_updated = timestamp()

    async def set_project_aoi(self, draft_project_dto: DraftProjectDTO, db: Database):
        """Sets the AOI for the supplied project"""
        aoi_geojson = geojson.loads(json.dumps(draft_project_dto.area_of_interest))

        aoi_geometry = GridService.merge_to_multi_polygon(aoi_geojson, dissolve=True)

        valid_geojson = geojson.dumps(aoi_geometry)

        query = """
        SELECT ST_AsText(
            ST_SetSRID(
                ST_GeomFromGeoJSON(:geojson), 4326
            )
        ) AS geometry_wkt;
        """
        # Execute the query with the GeoJSON value passed in as a parameter
        result = await db.fetch_one(query=query, values={"geojson": valid_geojson})
        self.geometry = result["geometry_wkt"] if result else None

        query = """
        SELECT ST_AsText(ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON(:geometry), 4326))) AS centroid
        """

        # Execute the query and pass the GeoJSON as a parameter
        result = await db.fetch_one(query=query, values={"geometry": valid_geojson})
        self.centroid = result["centroid"] if result else None

    def set_default_changeset_comment(self):
        """Sets the default changeset comment"""
        default_comment = settings.DEFAULT_CHANGESET_COMMENT
        self.changeset_comment = (
            f"{default_comment}-{self.id} {self.changeset_comment}"
            if self.changeset_comment is not None
            else f"{default_comment}-{self.id}"
        )

    def set_country_info(self):
        """Sets the default country based on centroid"""
        centroid = WKTElement(self.centroid, srid=4326)

        centroid = to_shape(centroid)
        lat, lng = (centroid.y, centroid.x)
        url = "{0}/reverse?format=jsonv2&lat={1}&lon={2}&accept-language=en".format(
            settings.OSM_NOMINATIM_SERVER_URL, lat, lng
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
            logger.debug(e, exc_info=True)

    async def create(self, project_name: str, db: Database):
        """Creates and saves the current model to the DB"""
        values = {}
        for column in Project.__table__.columns:
            # Get attribute value from the instance
            attribute_value = getattr(self, column.name, None)
            values[column.name] = attribute_value

        values.pop("id", None)

        project = await db.execute(Project.__table__.insert().values(**values))
        await db.execute(
            ProjectInfo.__table__.insert().values(
                project_id=project, locale="en", name=project_name
            )
        )

        for task in self.tasks:
            await db.execute(
                Task.__table__.insert().values(
                    id=task.id,
                    project_id=project,
                    x=task.x,
                    y=task.y,
                    zoom=task.zoom,
                    is_square=task.is_square,
                    task_status=TaskStatus.READY.value,
                    extra_properties=task.extra_properties,
                    geometry=task.geometry,
                )
            )

        return project

    async def save(self, db: Database):
        """Save changes to db"""
        columns = {
            c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs
        }
        await db.execute(
            Project.__table__.update().where(Project.id == self.id).values(**columns)
        )

    @staticmethod
    async def clone(project_id: int, author_id: int, db: Database):
        """Clone a project using encode databases and raw SQL."""
        # Fetch the original project data
        orig_query = "SELECT * FROM projects WHERE id = :project_id"
        orig = await db.fetch_one(orig_query, {"project_id": project_id})

        if not orig:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        orig_metadata = dict(orig)
        items_to_remove = ["id", "allowed_users"]
        for item in items_to_remove:
            orig_metadata.pop(item, None)

        # Update metadata for the new project
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

        # Construct the INSERT query for the new project
        columns = ", ".join(orig_metadata.keys())
        values = ", ".join([f":{key}" for key in orig_metadata.keys()])
        insert_project_query = (
            f"INSERT INTO projects ({columns}) VALUES ({values}) RETURNING id"
        )
        new_project_id = await db.execute(insert_project_query, orig_metadata)

        # Clone project_info data
        project_info_query = "SELECT * FROM project_info WHERE project_id = :project_id"
        project_info_records = await db.fetch_all(
            project_info_query, {"project_id": project_id}
        )

        for info in project_info_records:
            info_data = dict(info)
            info_data.pop("id", None)
            info_data.update({"project_id": new_project_id})
            columns_info = ", ".join(info_data.keys())
            values_info = ", ".join([f":{key}" for key in info_data.keys()])
            insert_info_query = (
                f"INSERT INTO project_info ({columns_info}) VALUES ({values_info})"
            )
            await db.execute(insert_info_query, info_data)

        # Clone teams data
        teams_query = "SELECT * FROM project_teams WHERE project_id = :project_id"
        team_records = await db.fetch_all(teams_query, {"project_id": project_id})

        for team in team_records:
            team_data = dict(team)
            team_data.pop("id", None)
            team_data.update({"project_id": new_project_id})
            columns_team = ", ".join(team_data.keys())
            values_team = ", ".join([f":{key}" for key in team_data.keys()])
            insert_team_query = (
                f"INSERT INTO project_teams ({columns_team}) VALUES ({values_team})"
            )
            await db.execute(insert_team_query, team_data)

        # Clone campaigns associated with the original project
        campaign_query = (
            "SELECT campaign_id FROM campaign_projects WHERE project_id = :project_id"
        )
        campaign_ids = await db.fetch_all(campaign_query, {"project_id": project_id})

        for campaign in campaign_ids:
            clone_campaign_query = """
                INSERT INTO campaign_projects (campaign_id, project_id)
                VALUES (:campaign_id, :new_project_id)
            """
            await db.execute(
                clone_campaign_query,
                {
                    "campaign_id": campaign["campaign_id"],
                    "new_project_id": new_project_id,
                },
            )

        # Clone interests associated with the original project
        interest_query = (
            "SELECT interest_id FROM project_interests WHERE project_id = :project_id"
        )
        interest_ids = await db.fetch_all(interest_query, {"project_id": project_id})

        for interest in interest_ids:
            clone_interest_query = """
                INSERT INTO project_interests (interest_id, project_id)
                VALUES (:interest_id, :new_project_id)
            """
            await db.execute(
                clone_interest_query,
                {
                    "interest_id": interest["interest_id"],
                    "new_project_id": new_project_id,
                },
            )

        # Clone CustomEditor associated with the original project
        custom_editor_query = """
            SELECT name, description, url FROM project_custom_editors WHERE project_id = :project_id
        """
        custom_editor = await db.fetch_one(
            custom_editor_query, {"project_id": project_id}
        )

        if custom_editor:
            clone_custom_editor_query = """
                INSERT INTO project_custom_editors (project_id, name, description, url)
                VALUES (:new_project_id, :name, :description, :url)
            """
            await db.execute(
                clone_custom_editor_query,
                {
                    "new_project_id": new_project_id,
                    "name": custom_editor["name"],
                    "description": custom_editor["description"],
                    "url": custom_editor["url"],
                },
            )

        # Return the new project data
        new_project_query = "SELECT * FROM projects WHERE id = :new_project_id"
        new_project = await db.fetch_one(
            new_project_query, {"new_project_id": new_project_id}
        )
        return Project(**new_project)

    @staticmethod
    async def get(project_id: int, db: Database) -> Optional["Project"]:
        """
        Gets specified project
        :param project_id: project ID in scope
        :param db: Instance of `databases.Database` for querying
        :return: Project if found otherwise None
        """
        # Construct the SQLAlchemy select statement
        query = (
            select(Project)
            .where(Project.id == project_id)
            .options(
                orm.noload(Project.tasks),
                orm.noload(Project.messages),
                orm.noload(Project.project_chat),
            )
        )

        # Execute the query using the `fetch_one` method of `db`
        result = await db.fetch_one(query)

        # If a result is found, map it back to the Project ORM class
        # (If `Project` is a Core table, you can directly return `result`)
        if result:
            project = Project(**result)
            return project

        return None

    async def update(self, project_dto: ProjectDTO, db: Database):
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
        self.due_date = (
            project_dto.due_date.replace(tzinfo=None) if project_dto.due_date else None
        )
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
            organisation_query = "SELECT * FROM organisations WHERE id = :id"
            organization = await db.fetch_one(
                organisation_query, values={"id": project_dto.organisation}
            )

            if organization is None:
                raise NotFound(
                    sub_code="ORGANISATION_NOT_FOUND",
                    organisation_id=project_dto.organisation,
                )

            update_organisation_query = """
            UPDATE projects
            SET organisation_id = :organisation_id
            WHERE id = :project_id
            """
            await db.execute(
                update_organisation_query,
                values={
                    "organisation_id": project_dto.organisation,
                    "project_id": project_dto.project_id,
                },
            )

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
        await db.execute(delete(ProjectTeams).where(ProjectTeams.project_id == self.id))
        if hasattr(project_dto, "project_teams") and project_dto.project_teams:
            for team_dto in project_dto.project_teams:
                team = await Team.get(team_dto.team_id, db)
                if team is None:
                    raise NotFound(sub_code="TEAM_NOT_FOUND", team_id=team_dto.team_id)
                role = TeamRoles[team_dto.role].value
                project_team = ProjectTeams(
                    project_id=self.id, team_id=team.id, role=role
                )
                await project_team.create(db)

        # Set Project Info for all returned locales
        for dto in project_dto.project_info_locales:
            project_info = await db.fetch_one(
                select(ProjectInfo).where(
                    ProjectInfo.project_id == self.id, ProjectInfo.locale == dto.locale
                )
            )
            if project_info is None:
                new_info = await ProjectInfo.create_from_dto(
                    dto, self.id, db
                )  # Can't find info so must be new locale
                self.project_info.append(new_info)
            else:
                await ProjectInfo.update_from_dto(ProjectInfo(**project_info), dto, db)

        # Always clear Priority Area prior to updating
        await Project.clear_existing_priority_areas(db, self.id)
        if project_dto.priority_areas:
            for priority_area in project_dto.priority_areas:
                pa = await PriorityArea.from_dict(priority_area, db)
                # Link project and priority area in the database
                if pa and pa.id:
                    link_query = """
                    INSERT INTO project_priority_areas (project_id, priority_area_id)
                    VALUES (:project_id, :priority_area_id)
                    """
                    await db.execute(
                        query=link_query,
                        values={"project_id": self.id, "priority_area_id": pa.id},
                    )

        if project_dto.custom_editor:
            if not self.custom_editor:
                new_editor = await CustomEditor.create_from_dto(
                    self.id, project_dto.custom_editor, db
                )
                self.custom_editor = new_editor
            else:
                await CustomEditor.update_editor(
                    self.custom_editor, project_dto.custom_editor, db
                )
        else:
            if self.custom_editor:
                await CustomEditor.delete(self.custom_editor, db)

        # handle campaign update
        try:
            new_ids = [c.id for c in project_dto.campaigns]
        except TypeError:
            new_ids = []

        query = """
            SELECT campaign_id
            FROM campaign_projects
            WHERE project_id = :project_id
        """
        campaign_results = await db.fetch_all(
            query, values={"project_id": project_dto.project_id}
        )
        current_ids = [c.campaign_id for c in campaign_results]

        new_set = set(new_ids)
        current_set = set(current_ids)

        if new_set != current_set:
            to_add = new_set - current_set
            to_remove = current_set - new_set
            if to_remove:
                await db.execute(
                    """
                    DELETE FROM campaign_projects
                    WHERE project_id = :project_id
                    AND campaign_id = ANY(:to_remove)
                    """,
                    values={
                        "project_id": project_dto.project_id,
                        "to_remove": list(to_remove),
                    },
                )

            if to_add:
                insert_query = """
                INSERT INTO campaign_projects (project_id, campaign_id)
                VALUES (:project_id, :campaign_id)
                """
                for campaign_id in to_add:
                    await db.execute(
                        insert_query,
                        values={
                            "project_id": project_dto.project_id,
                            "campaign_id": campaign_id,
                        },
                    )

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
            new_interest_ids = [i.id for i in project_dto.interests]
        except TypeError:
            new_interest_ids = []

        interest_query = """
            SELECT interest_id
            FROM project_interests
            WHERE project_id = :project_id
        """
        interest_results = await db.fetch_all(
            interest_query, values={"project_id": project_dto.project_id}
        )
        current_interest_ids = [i.interest_id for i in interest_results]

        new_interest_set = set(new_interest_ids)
        current_interest_set = set(current_interest_ids)

        if new_interest_set != current_interest_set:
            to_add_interests = new_interest_set - current_interest_set
            to_remove_interests = current_interest_set - new_interest_set

            if to_remove_interests:
                await db.execute(
                    """
                    DELETE FROM project_interests
                    WHERE project_id = :project_id
                    AND interest_id = ANY(:to_remove)
                    """,
                    values={
                        "project_id": project_dto.project_id,
                        "to_remove": list(to_remove_interests),
                    },
                )

            if to_add_interests:
                insert_interest_query = """
                INSERT INTO project_interests (project_id, interest_id)
                VALUES (:project_id, :interest_id)
                """
                for interest_id in to_add_interests:
                    await db.execute(
                        insert_interest_query,
                        values={
                            "project_id": project_dto.project_id,
                            "interest_id": interest_id,
                        },
                    )

        # try to update country info if that information is not present
        if not self.country:
            self.set_country_info()

        columns = {
            c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs
        }
        columns.pop("geometry", None)
        columns.pop("centroid", None)
        columns.pop("id", None)
        columns.pop("organisation_id", None)
        # Update the project in the database
        await db.execute(
            self.__table__.update().where(Project.id == self.id).values(**columns)
        )

    async def delete(self, db: Database):
        """Deletes the current project and related records from the database using raw SQL."""
        # List of tables to delete from, in the order required to satisfy foreign key constraints
        related_tables = [
            "project_favorites",
            "project_custom_editors",
            "project_interests",
            "project_priority_areas",
            "project_allowed_users",
            "project_teams",
            "task_invalidation_history",
            "task_history",
            "tasks",
            "project_info",
            "project_chat",
            "project_partnerships_history",
            "project_partnerships",
        ]

        # Start a transaction to ensure atomic deletion
        async with db.transaction():
            # Loop through each table and execute the delete query
            for table in related_tables:
                await db.execute(
                    f"DELETE FROM {table} WHERE project_id = :project_id",
                    {"project_id": self.id},
                )

            # Finally, delete the project itself
            await db.execute(
                "DELETE FROM projects WHERE id = :project_id", {"project_id": self.id}
            )

    @staticmethod
    async def exists(project_id: int, db: Database) -> bool:
        query = """
            SELECT 1
            FROM projects
            WHERE id = :project_id
        """

        # Execute the query
        result = await db.fetch_one(query=query, values={"project_id": project_id})

        if result is None:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)

        return True

    @staticmethod
    async def is_favorited(project_id: int, user_id: int, db: Database) -> bool:
        query = """
            SELECT 1
            FROM project_favorites
            WHERE user_id = :user_id
              AND project_id = :project_id
            LIMIT 1
        """

        result = await db.fetch_one(
            query, values={"user_id": user_id, "project_id": project_id}
        )
        return result is not None

    @staticmethod
    async def favorite(project_id: int, user_id: int, db: Database):
        check_query = """
        SELECT 1 FROM project_favorites WHERE project_id = :project_id AND user_id = :user_id
        """
        exists = await db.fetch_one(
            check_query, {"project_id": project_id, "user_id": user_id}
        )

        if not exists:
            insert_query = """
            INSERT INTO project_favorites (project_id, user_id)
            VALUES (:project_id, :user_id)
            """
            await db.execute(
                insert_query, {"project_id": project_id, "user_id": user_id}
            )

    @staticmethod
    async def unfavorite(project_id: int, user_id: int, db: Database):
        check_query = """
        SELECT 1 FROM project_favorites
        WHERE project_id = :project_id AND user_id = :user_id
        """
        exists = await db.fetch_one(
            check_query, {"project_id": project_id, "user_id": user_id}
        )

        if not exists:
            raise ValueError("NotFeatured - Project has not been favorited by user")

        delete_query = """
        DELETE FROM project_favorites
        WHERE project_id = :project_id AND user_id = :user_id
        """
        await db.execute(delete_query, {"project_id": project_id, "user_id": user_id})

    async def set_as_featured(self, db: Database):
        """
        Sets the project as featured.
        :param db: Instance of `databases.Database` for querying
        """
        if self.featured is True:
            raise ValueError("AlreadyFeatured- Project is already featured")

        query = update(Project).where(Project.id == self.id).values(featured=True)

        # Execute the update query using the async `db.execute`
        await db.execute(query)

    async def unset_as_featured(self, db: Database):
        """
        Unsets the project as featured.
        :param db: Instance of `databases.Database` for querying
        """
        # Check if the project is already not featured
        if self.featured is False:
            raise ValueError("NotFeatured - Project is not featured")

        query = update(Project).where(Project.id == self.id).values(featured=False)

        # Execute the update query using the async `db.execute`
        await db.execute(query)

    async def can_be_deleted(self, db: Database) -> bool:
        """Projects can be deleted if they have no mapped work."""
        # Build a query to count tasks associated with the project
        query = (
            select(func.count())
            .select_from(Task)
            .where(
                Task.project_id
                == self.id,  # Assuming `self.id` refers to the project instance ID
                Task.task_status != TaskStatus.READY.value,
            )
        )

        # Execute the query
        task_count = await db.fetch_val(query)
        if task_count == 0:
            return True
        else:
            return False

    @staticmethod
    async def get_projects_for_admin(
        admin_id: int, preferred_locale: str, search_dto: ProjectSearchDTO, db: Database
    ) -> PMDashboardDTO:
        """Get all projects for provided admin."""

        query = """
        SELECT
            p.id AS id,
            p.difficulty,
            p.priority,
            p.default_locale,
            ST_AsGeoJSON(p.centroid) AS centroid,
            p.organisation_id,
            p.tasks_bad_imagery,
            p.tasks_mapped,
            p.tasks_validated,
            p.status,
            p.mapping_types,
            p.total_tasks,
            p.last_updated,
            p.due_date,
            p.country,
            p.changeset_comment,
            p.created,
            p.osmcha_filter_id,
            p.mapping_permission,
            p.validation_permission,
            p.enforce_random_task_selection,
            p.private,
            p.license_id,
            p.id_presets,
            p.extra_id_params,
            p.rapid_power_user,
            p.imagery,
            p.mapping_editors,
            p.validation_editors,
            u.username AS author,
            o.name AS organisation_name,
            o.slug AS organisation_slug,
            o.logo AS organisation_logo,
            ARRAY(SELECT user_id FROM project_allowed_users WHERE project_id = p.id) AS allowed_users
        FROM projects p
        LEFT JOIN organisations o ON o.id = p.organisation_id
        LEFT JOIN users u ON u.id = p.author_id
        WHERE p.author_id = :admin_id
        """

        params = {"admin_id": admin_id}

        if search_dto.order_by:
            query += f" ORDER BY p.{search_dto.order_by} "
            if search_dto.order_by_type == "DESC":
                query += "DESC"

        # Execute query
        rows = await db.fetch_all(query, params)
        # Process results
        admin_projects_dto = PMDashboardDTO()
        for row in rows:
            pm_project = await Project.get_project_summary(row, preferred_locale, db)
            project_status = ProjectStatus(row["status"])

            if project_status == ProjectStatus.DRAFT:
                admin_projects_dto.draft_projects.append(pm_project)
            elif project_status == ProjectStatus.PUBLISHED:
                admin_projects_dto.active_projects.append(pm_project)
            elif project_status == ProjectStatus.ARCHIVED:
                admin_projects_dto.archived_projects.append(pm_project)
            else:
                raise HTTPException(
                    status_code=500, detail=f"Unexpected state project {row['id']}"
                )

        return admin_projects_dto

    @staticmethod
    async def get_project_user_stats(
        project_id: int, user_id: int, db: Database
    ) -> ProjectUserStatsDTO:
        """Compute project-specific stats for a given user"""
        stats_dto = ProjectUserStatsDTO()

        total_mapping_query = """
            SELECT
                SUM(TO_TIMESTAMP(action_text, 'HH24:MI:SS')::TIME - '00:00:00'::TIME) AS total_time
            FROM task_history
            WHERE action IN ('LOCKED_FOR_MAPPING', 'AUTO_UNLOCKED_FOR_MAPPING')
            AND project_id = :project_id
            AND user_id = :user_id
        """
        total_mapping_result = await db.fetch_one(
            total_mapping_query, {"project_id": project_id, "user_id": user_id}
        )

        total_mapping_time = (
            total_mapping_result["total_time"].total_seconds()
            if total_mapping_result and total_mapping_result["total_time"]
            else 0
        )
        stats_dto.time_spent_mapping = total_mapping_time
        stats_dto.total_time_spent += total_mapping_time

        total_validation_query = """
            SELECT
                SUM(TO_TIMESTAMP(action_text, 'HH24:MI:SS')::TIME - '00:00:00'::TIME) AS total_time
            FROM task_history
            WHERE action IN ('LOCKED_FOR_VALIDATION', 'AUTO_UNLOCKED_FOR_VALIDATION')
            AND project_id = :project_id
            AND user_id = :user_id
        """
        total_validation_result = await db.fetch_one(
            total_validation_query, {"project_id": project_id, "user_id": user_id}
        )

        total_validation_time = (
            total_validation_result["total_time"].total_seconds()
            if total_validation_result and total_validation_result["total_time"]
            else 0
        )
        stats_dto.time_spent_validating = total_validation_time
        stats_dto.total_time_spent += total_validation_time
        return stats_dto

    @staticmethod
    async def get_project_stats(project_id: int, database: Database) -> ProjectStatsDTO:
        """Create Project Stats model for postgis project object."""
        project_stats = ProjectStatsDTO()
        project_stats.project_id = project_id
        project_query = """
            SELECT
                ST_Area(geometry, TRUE) / 1000000 AS area,
                ST_AsGeoJSON(centroid) AS centroid_geojson,
                tasks_mapped,
                tasks_validated,
                total_tasks,
                tasks_bad_imagery
            FROM projects
            WHERE id = :project_id
        """

        result = await database.fetch_one(
            project_query, values={"project_id": project_id}
        )

        project_stats.area = result["area"]
        project_stats.aoi_centroid = (
            geojson.loads(result["centroid_geojson"])
            if result["centroid_geojson"]
            else None
        )
        tasks_mapped = result["tasks_mapped"]
        tasks_validated = result["tasks_validated"]
        total_tasks = result["total_tasks"]
        tasks_bad_imagery = result["tasks_bad_imagery"]

        # Calculate task percentages
        project_stats.total_tasks = total_tasks

        project_stats.percent_mapped = Project.calculate_tasks_percent(
            "mapped", tasks_mapped, tasks_validated, total_tasks, tasks_bad_imagery
        )
        project_stats.percent_validated = Project.calculate_tasks_percent(
            "validated", tasks_mapped, tasks_validated, total_tasks, tasks_bad_imagery
        )
        project_stats.percent_bad_imagery = Project.calculate_tasks_percent(
            "bad_imagery", tasks_mapped, tasks_validated, total_tasks, tasks_bad_imagery
        )

        # Query for total mappers
        total_mappers_query = """
            SELECT COUNT(*)
            FROM users
            WHERE :project_id = ANY(projects_mapped)
        """
        total_mappers_result = await database.fetch_one(
            total_mappers_query, values={"project_id": project_id}
        )
        project_stats.total_mappers = (
            total_mappers_result[0] if total_mappers_result else 0
        )

        # Query for total comments
        total_comments_query = """
            SELECT COUNT(*)
            FROM project_chat
            WHERE project_id = :project_id
        """
        total_comments_result = await database.fetch_one(
            total_comments_query, values={"project_id": project_id}
        )
        project_stats.total_comments = (
            total_comments_result[0] if total_comments_result else 0
        )

        # Initialize time stats
        project_stats.total_time_spent = 0
        project_stats.total_mapping_time = 0
        project_stats.total_validation_time = 0
        project_stats.average_mapping_time = 0
        project_stats.average_validation_time = 0

        # Query total mapping time and tasks
        total_mapping_query = """
            SELECT
                SUM(TO_TIMESTAMP(action_text, 'HH24:MI:SS')::TIME - '00:00:00'::TIME) AS total_time,
                COUNT(action) AS total_tasks
            FROM task_history
            WHERE action IN ('LOCKED_FOR_MAPPING', 'AUTO_UNLOCKED_FOR_MAPPING')
            AND project_id = :project_id
        """
        total_mapping_result = await database.fetch_one(
            total_mapping_query, values={"project_id": project_id}
        )
        total_mapping_time, total_mapping_tasks = (
            (total_mapping_result["total_time"], total_mapping_result["total_tasks"])
            if total_mapping_result
            else (0, 0)
        )

        if total_mapping_tasks > 0:
            total_mapping_time = total_mapping_time.total_seconds()
            project_stats.total_mapping_time = total_mapping_time
            project_stats.average_mapping_time = (
                total_mapping_time / total_mapping_tasks
            )
            project_stats.total_time_spent += total_mapping_time

        # Query total validation time and tasks
        total_validation_query = """
            SELECT
                SUM(TO_TIMESTAMP(action_text, 'HH24:MI:SS')::TIME - '00:00:00'::TIME) AS total_time,
                COUNT(action) AS total_tasks
            FROM task_history
            WHERE action IN ('LOCKED_FOR_VALIDATION', 'AUTO_UNLOCKED_FOR_VALIDATION')
            AND project_id = :project_id
        """
        total_validation_result = await database.fetch_one(
            total_validation_query, values={"project_id": project_id}
        )

        # Safely unpack the results, or default to (0, 0) if the query returns no results
        total_validation_time, total_validation_tasks = (
            (
                total_validation_result["total_time"],
                total_validation_result["total_tasks"],
            )
            if total_validation_result
            else (0, 0)
        )

        # If there are validation tasks, convert the time to total seconds and update project stats
        if total_validation_tasks > 0:
            total_validation_time = total_validation_time.total_seconds()
            project_stats.total_validation_time = total_validation_time
            project_stats.average_validation_time = (
                total_validation_time / total_validation_tasks
            )
            project_stats.total_time_spent += total_validation_time

        # TODO: Understand the functionality of subquery used and incorporate this part.

        # actions = []
        # if project_stats.average_mapping_time <= 0:
        #     actions.append(TaskStatus.LOCKED_FOR_MAPPING.name)
        # if project_stats.average_validation_time <= 0:
        #     actions.append(TaskStatus.LOCKED_FOR_VALIDATION.name)

        # zoom_levels = []
        # if actions:
        #     # Query for distinct zoom levels
        #     zoom_levels_query = """
        #         SELECT DISTINCT zoom
        #         FROM tasks
        #         WHERE project_id = :project_id
        #     """
        #     zoom_levels_result = await database.fetch_all(zoom_levels_query, values={"project_id": project_id})
        #     zoom_levels = [row['zoom'] for row in zoom_levels_result]

        # is_square = None not in zoom_levels

        # subquery = f"""
        #     SELECT
        #         t.zoom,
        #         th.action,
        #         EXTRACT(EPOCH FROM TO_TIMESTAMP(th.action_text, 'HH24:MI:SS')) AS ts
        #     FROM task_history th
        #     JOIN tasks t ON th.task_id = t.id
        #     WHERE th.action IN :actions
        #     AND th.project_id = :project_id
        #     AND t.is_square = :is_square
        #     AND (t.zoom IN :zoom_levels OR :is_square IS FALSE)
        # """
        # subquery_params = {
        #     "project_id": project_id,
        #     "actions": tuple(actions),
        #     "is_square": is_square,
        #     "zoom_levels": tuple(zoom_levels) if zoom_levels else (None,)
        # }
        # subquery_result = await database.fetch_all(subquery, values=subquery_params)

        # # Query for average mapping time
        # if project_stats.average_mapping_time <= 0:
        #     mapping_avg_query = """
        #         SELECT zoom, AVG(ts) AS avg
        #         FROM (
        #             SELECT zoom, ts
        #             FROM subquery_result
        #             WHERE action = 'LOCKED_FOR_MAPPING'
        #         ) AS mapping_times
        #         GROUP BY zoom
        #     """
        #     mapping_avg_result = await database.fetch_all(mapping_avg_query)
        #     if mapping_avg_result:
        #         mapping_time = sum(row['avg'].total_seconds() for row in mapping_avg_result) / len(mapping_avg_result)
        #         project_stats.average_mapping_time = mapping_time

        # # Query for average validation time
        # if project_stats.average_validation_time <= 0:
        #     validation_avg_query = """
        #         SELECT zoom, AVG(ts) AS avg
        #         FROM (
        #             SELECT zoom, ts
        #             FROM subquery_result
        #             WHERE action = 'LOCKED_FOR_VALIDATION'
        #         ) AS validation_times
        #         GROUP BY zoom
        #     """
        #     validation_avg_result = await database.fetch_all(validation_avg_query)
        #     if validation_avg_result:
        #         validation_time = sum(row['avg'].total_seconds() for row in validation_avg_result) / len(validation_avg_result)
        #         project_stats.average_validation_time = validation_time

        # Calculate time to finish mapping and validation
        project_stats.time_to_finish_mapping = (
            total_tasks - (tasks_mapped + tasks_bad_imagery + tasks_validated)
        ) * project_stats.average_mapping_time
        project_stats.time_to_finish_validating = (
            total_tasks - (tasks_validated + tasks_bad_imagery)
        ) * project_stats.average_validation_time

        return project_stats

    @staticmethod
    async def get_project_summary(
        project_row, preferred_locale: str, db: Database, calculate_completion=True
    ) -> ProjectSummary:
        """Create Project Summary model for a project."""

        project_id = project_row["id"]

        # Mapping editors
        if project_row.mapping_editors:
            mapping_editors = (
                [
                    Editors(mapping_editor).name
                    for mapping_editor in project_row.mapping_editors
                ]
                if project_row["mapping_editors"]
                else []
            )
        # Validation editors
        if project_row.validation_editors:
            validation_editors = (
                [
                    Editors(validation_editor).name
                    for validation_editor in project_row["validation_editors"]
                ]
                if project_row["validation_editors"]
                else []
            )
        summary = ProjectSummary(
            project_id=project_id,
            mapping_editors=mapping_editors,
            validation_editors=validation_editors,
        )

        # Set priority
        priority_map = {0: "URGENT", 1: "HIGH", 2: "MEDIUM"}
        summary.priority = priority_map.get(project_row["priority"], "LOW")

        summary.author = project_row.author

        # Set other fields directly from project_row
        summary.default_locale = project_row.default_locale
        summary.country_tag = project_row.country
        summary.changeset_comment = project_row.changeset_comment
        summary.due_date = project_row.due_date
        summary.created = project_row.created
        summary.last_updated = project_row.last_updated
        summary.osmcha_filter_id = project_row.osmcha_filter_id
        summary.difficulty = ProjectDifficulty(project_row["difficulty"]).name
        summary.mapping_permission = MappingPermission(
            project_row["mapping_permission"]
        ).name
        summary.validation_permission = ValidationPermission(
            project_row["validation_permission"]
        ).name
        summary.random_task_selection_enforced = (
            project_row.enforce_random_task_selection
        )
        summary.private = project_row.private
        summary.license_id = project_row.license_id
        summary.status = ProjectStatus(project_row["status"]).name
        summary.id_presets = project_row.id_presets
        summary.extra_id_params = project_row.extra_id_params
        summary.rapid_power_user = project_row.rapid_power_user
        summary.imagery = project_row.imagery

        # Handle organisation details if available
        if project_row.organisation_id:
            summary.organisation = project_row.organisation_id
            summary.organisation_name = project_row.organisation_name
            summary.organisation_slug = project_row.organisation_slug
            summary.organisation_logo = project_row.organisation_logo

        # Mapping types
        if project_row.mapping_types:
            summary.mapping_types = (
                [
                    MappingTypes(mapping_type).name
                    for mapping_type in project_row.mapping_types
                ]
                if project_row.mapping_types
                else []
            )

        # Custom editor
        custom_editor_query = """
            SELECT name, description, url
            FROM project_custom_editors
            WHERE project_id = :project_id
        """
        custom_editor_row = await db.fetch_one(
            custom_editor_query, {"project_id": project_id}
        )
        if custom_editor_row:
            summary.custom_editor = CustomEditorDTO(
                name=custom_editor_row.name,
                description=custom_editor_row.description,
                url=custom_editor_row.url,
            )

        if summary.private:
            allowed_user_ids = (
                project_row.allowed_users if project_row.allowed_users else []
            )
            if allowed_user_ids:
                query = "SELECT username FROM users WHERE id = ANY(:allowed_user_ids)"
                allowed_users = await db.fetch_all(
                    query, {"allowed_user_ids": allowed_user_ids}
                )
                summary.allowed_users = [user["username"] for user in allowed_users]
            else:
                summary.allowed_users = []

        # AOI centroid
        summary.aoi_centroid = geojson.loads(project_row.centroid)

        # Calculate completion percentages if requested
        if calculate_completion:
            summary.percent_mapped = Project.calculate_tasks_percent(
                "mapped",
                project_row.tasks_mapped,
                project_row.tasks_validated,
                project_row.total_tasks,
                project_row.tasks_bad_imagery,
            )
            summary.percent_validated = Project.calculate_tasks_percent(
                "validated",
                project_row.tasks_validated,
                project_row.tasks_validated,
                project_row.total_tasks,
                project_row.tasks_bad_imagery,
            )
            summary.percent_bad_imagery = Project.calculate_tasks_percent(
                "bad_imagery",
                project_row.tasks_mapped,
                project_row.tasks_validated,
                project_row.total_tasks,
                project_row.tasks_bad_imagery,
            )

        # Project campaigns
        query = """
            SELECT c.*
            FROM campaigns c
            INNER JOIN campaign_projects cp ON c.id = cp.campaign_id
            WHERE cp.project_id = :project_id
        """

        campaigns = await db.fetch_all(query=query, values={"project_id": project_id})
        campaigns_dto = (
            [CampaignDTO(**campaign) for campaign in campaigns] if campaigns else []
        )
        summary.campaigns = campaigns_dto

        # Project teams
        query = """
        SELECT
            pt.team_id,
            t.name AS team_name,
            pt.role
        FROM project_teams pt
        JOIN teams t ON pt.team_id = t.id
        WHERE pt.project_id = :project_id
        """
        teams = await db.fetch_all(query, {"project_id": project_row["id"]})
        summary.project_teams = [
            ProjectTeamDTO(
                team_id=team["team_id"],
                team_name=team["team_name"],
                role=TeamRoles(team["role"]),
            )
            for team in teams
        ]
        # Project info for the preferred locale
        project_info = await Project.get_dto_for_locale(
            project_row["id"], preferred_locale, project_row["default_locale"], db
        )
        summary.project_info = project_info

        return summary

    # TODO Remove if not used.
    # @staticmethod
    # async def calculate_tasks_percent(status: str, project_id: int, db: Database) -> float:
    #     """Calculate the percentage of tasks with a given status for a project."""
    #     query = f"""
    #     SELECT COUNT(*)
    #     FROM tasks
    #     WHERE project_id = :project_id AND status = :status
    #     """
    #     total_tasks_query = "SELECT COUNT(*) FROM tasks WHERE project_id = :project_id"

    #     total_tasks = await db.fetch_val(total_tasks_query, {"project_id": project_id})
    #     status_tasks = await db.fetch_val(query, {"project_id": project_id, "status": status})
    #     return (status_tasks / total_tasks) * 100 if total_tasks > 0 else 0.0

    @staticmethod
    async def get_dto_for_locale(
        project_id: int, preferred_locale: str, default_locale: str, db: Database
    ) -> ProjectInfoDTO:
        """Get project info for the preferred locale."""
        query = """
        SELECT
            name,
            locale,
            short_description,
            description,
            instructions
        FROM project_info
        WHERE project_id = :project_id AND locale = :preferred_locale
        """
        project_info = await db.fetch_one(
            query, {"project_id": project_id, "preferred_locale": preferred_locale}
        )

        if not project_info:
            # Fallback to default locale if preferred locale is not available
            project_info = await db.fetch_one(
                query, {"project_id": project_id, "preferred_locale": default_locale}
            )
        return ProjectInfoDTO(**project_info) if project_info else None

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

    @staticmethod
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
        aoi_geojson = geojson.loads(result["aoi_geojson"])
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

    # def get_project_title(self, preferred_locale):
    #     project_info = ProjectInfo.get_dto_for_locale(
    #         self.id, preferred_locale, self.default_locale
    #     )
    #     return project_info.name

    @staticmethod
    async def get_project_title(db: Database, project_id: int, preferred_locale):
        project_info = await ProjectInfo.get_dto_for_locale(
            db, project_id, preferred_locale
        )
        return project_info.name

    @staticmethod
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
            "locked_for_validation": TaskStatus.LOCKED_FOR_VALIDATION.value,
        }

        count = await database.fetch_val(query, values)
        # Handle the case where count might be None
        return count or 0

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

        percent_mapped = Project.calculate_tasks_percent(
            "mapped", tasks_mapped, tasks_validated, total_tasks, tasks_bad_imagery
        )
        percent_validated = Project.calculate_tasks_percent(
            "validated",
            tasks_validated,
            tasks_validated,
            total_tasks,
            tasks_bad_imagery,
        )
        percent_bad_imagery = Project.calculate_tasks_percent(
            "bad_imagery", tasks_mapped, tasks_validated, total_tasks, tasks_bad_imagery
        )

        # Convert record to DTO
        project_dto = ProjectDTO(
            project_id=record.project_id,
            project_status=ProjectStatus(record.project_status).name,
            default_locale=record.default_locale,
            project_priority=ProjectPriority(record.project_priority).name,
            area_of_interest=area_of_interest,
            aoi_bbox=aoi_bbox,
            mapping_permission=MappingPermission(record.mapping_permission).name,
            validation_permission=ValidationPermission(
                record.validation_permission
            ).name,
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
            mapping_types=(
                [
                    MappingTypes(mapping_type).name
                    for mapping_type in record.mapping_types
                ]
                if record.mapping_types is not None
                else []
            ),
            mapping_editors=(
                [Editors(editor).name for editor in record.mapping_editors]
                if record.mapping_editors
                else []
            ),
            validation_editors=(
                [Editors(editor).name for editor in record.validation_editors]
                if record.validation_editors
                else []
            ),
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
        project_dto.project_teams = (
            [
                ProjectTeamDTO(**{**team, "role": TeamRoles(team["role"]).name})
                for team in teams
            ]
            if teams
            else []
        )

        custom_editor = await db.fetch_one(
            """
            SELECT project_id, name, description, url
            FROM project_custom_editors
            WHERE project_id = :project_id
        """,
            {"project_id": project_id},
        )

        if custom_editor:
            project_dto.custom_editor = CustomEditorDTO(**custom_editor)

        if project_dto.private:
            # Fetch allowed usernames using the intermediate table
            allowed_users_query = """
                SELECT u.username
                FROM project_allowed_users pau
                JOIN users u ON pau.user_id = u.id
                WHERE pau.project_id = :project_id
            """
            allowed_usernames = await db.fetch_all(
                allowed_users_query, {"project_id": project_id}
            )
            project_dto.allowed_usernames = (
                [user.username for user in allowed_usernames]
                if allowed_usernames
                else []
            )

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
        priority_areas = await db.fetch_all(
            priority_areas_query, {"project_id": project_id}
        )
        project_dto.priority_areas = (
            [geojson.loads(area["geojson"]) for area in priority_areas]
            if priority_areas
            else None
        )

        interests_query = """
            SELECT i.id, i.name
            FROM interests i
            JOIN project_interests pi ON i.id = pi.interest_id
            WHERE pi.project_id = :project_id
        """
        interests = await db.fetch_all(interests_query, {"project_id": project_id})
        project_dto.interests = [InterestDTO(**i) for i in interests]
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
            project_dto.tasks = (
                await Task.get_tasks_as_geojson_feature_collection_no_geom(
                    db, project_id
                )
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
            org_record = await db.fetch_one(
                org_query, values={"organisation_id": project_dto.organisation}
            )
            if org_record:
                project_dto.organisation_name = org_record.name
                project_dto.organisation_logo = org_record.logo
                project_dto.organisation_slug = org_record.slug

        project_dto.project_info_locales = await ProjectInfo.get_dto_for_all_locales(
            db, project_id
        )

        return project_dto

    @staticmethod
    async def tasks_as_geojson(
        db: Database,
        project_id: int,
        task_ids_str: Optional[str],
        order_by: Optional[str] = None,
        order_by_type: str = "ASC",
        status: Optional[int] = None,
    ):
        return await Task.get_tasks_as_geojson_feature_collection(
            db, project_id, task_ids_str, order_by, order_by_type, status
        )

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

    @staticmethod
    def calculate_tasks_percent(
        target: str,
        tasks_mapped: int,
        tasks_validated: int,
        total_tasks: int,
        tasks_bad_imagery: int,
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
                return int(tasks_validated / (total_tasks - tasks_bad_imagery) * 100)
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

    @staticmethod
    async def as_dto_for_admin(project_id: int, db: Database):
        """Creates a Project DTO suitable for transmitting to project admins"""
        project_dto = await Project.get_project_and_base_dto(project_id, db)

        project_dto.project_info_locales = await ProjectInfo.get_dto_for_all_locales(
            db, project_id
        )

        return project_dto

    async def create_or_update_interests(self, interests_ids, db):
        self.interests = []
        objs = [Interest.get_by_id(i, db) for i in interests_ids]
        self.interests.extend(objs)
        query = (
            update(Project)
            .where(Project.id == self.id)
            .values(interests=self.interests)
        )

        # Execute the update query using the async `db.execute`
        project = await db.execute(query)

        return project

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

    @staticmethod
    async def clear_existing_priority_areas(db: Database, project_id: int):
        """Clear existing priority area links and delete the corresponding priority areas for the given project ID."""

        existing_priority_area_ids_query = """
        SELECT priority_area_id
        FROM project_priority_areas
        WHERE project_id = :project_id;
        """
        existing_priority_area_ids = await db.fetch_all(
            query=existing_priority_area_ids_query, values={"project_id": project_id}
        )
        existing_ids = [
            record["priority_area_id"] for record in existing_priority_area_ids
        ]

        clear_links_query = """
        DELETE FROM project_priority_areas
        WHERE project_id = :project_id;
        """
        await db.execute(query=clear_links_query, values={"project_id": project_id})

        if existing_ids:
            delete_priority_areas_query = """
            DELETE FROM priority_areas
            WHERE id = ANY(:ids);
            """
            # Pass the list as an array using PostgreSQL's array syntax
            await db.execute(
                query=delete_priority_areas_query, values={"ids": existing_ids}
            )

    async def update_project_author(project_id: int, new_author_id: int, db: Database):
        query = """
        UPDATE projects
        SET author_id = :new_author_id
        WHERE id = :project_id
        """
        values = {"new_author_id": new_author_id, "project_id": project_id}

        # Execute the query
        await db.execute(query=query, values=values)


# Add index on project geometry
Index("idx_geometry", Project.geometry, postgresql_using="gist")
