import json
from typing import Optional
from cachetools import TTLCache, cached

import geojson
from flask import current_app
from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm.session import make_transient

from server import db
from server.models.dtos.project_dto import ProjectDTO, DraftProjectDTO, ProjectSummary, PMDashboardDTO
from server.models.postgis.priority_area import PriorityArea, project_priority_areas
from server.models.postgis.project_info import ProjectInfo
from server.models.postgis.statuses import ProjectStatus, ProjectPriority, MappingLevel, TaskStatus, MappingTypes
from server.models.postgis.tags import Tags
from server.models.postgis.task import Task
from server.models.postgis.user import User
from server.models.postgis.utils import ST_SetSRID, ST_GeomFromGeoJSON, timestamp, ST_Centroid, NotFound
from server.services.grid.grid_service import GridService

# Secondary table defining many-to-many join for private projects that only defined users can map on
project_allowed_users = db.Table(
    'project_allowed_users',
    db.metadata,
    db.Column('project_id', db.Integer, db.ForeignKey('projects.id')),
    db.Column('user_id', db.BigInteger, db.ForeignKey('users.id'))
)

# cache mapper counts for 30 seconds
active_mappers_cache = TTLCache(maxsize=1024, ttl=30)


class Project(db.Model):
    """ Describes a HOT Mapping Project """
    __tablename__ = 'projects'

    # Columns
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.Integer, default=ProjectStatus.DRAFT.value, nullable=False)
    created = db.Column(db.DateTime, default=timestamp, nullable=False)
    priority = db.Column(db.Integer, default=ProjectPriority.MEDIUM.value)
    default_locale = db.Column(db.String(10),
                               default='en')  # The locale that is returned if requested locale not available
    author_id = db.Column(db.BigInteger, db.ForeignKey('users.id', name='fk_users'), nullable=False)
    mapper_level = db.Column(db.Integer, default=1, nullable=False, index=True)  # Mapper level project is suitable for
    enforce_mapper_level = db.Column(db.Boolean, default=False)
    enforce_validator_role = db.Column(db.Boolean, default=False)  # Means only users with validator role can validate
    private = db.Column(db.Boolean, default=False)  # Only allowed users can validate
    entities_to_map = db.Column(db.String)
    changeset_comment = db.Column(db.String)
    due_date = db.Column(db.DateTime)
    imagery = db.Column(db.String)
    josm_preset = db.Column(db.String)
    last_updated = db.Column(db.DateTime, default=timestamp)
    license_id = db.Column(db.Integer, db.ForeignKey('licenses.id', name='fk_licenses'))
    geometry = db.Column(Geometry('MULTIPOLYGON', srid=4326))
    centroid = db.Column(Geometry('POINT', srid=4326))

    # Tags
    mapping_types = db.Column(ARRAY(db.Integer), index=True)
    organisation_tag = db.Column(db.String, index=True)
    campaign_tag = db.Column(db.String, index=True)

    # Stats
    total_tasks = db.Column(db.Integer, nullable=False)
    tasks_mapped = db.Column(db.Integer, default=0, nullable=False)
    tasks_validated = db.Column(db.Integer, default=0, nullable=False)
    tasks_bad_imagery = db.Column(db.Integer, default=0, nullable=False)

    # Mapped Objects
    tasks = db.relationship(Task, backref='projects', cascade="all, delete, delete-orphan", lazy='dynamic')
    project_info = db.relationship(ProjectInfo, lazy='dynamic', cascade='all')
    author = db.relationship(User)
    allowed_users = db.relationship(User, secondary=project_allowed_users)
    priority_areas = db.relationship(PriorityArea, secondary=project_priority_areas, cascade="all, delete-orphan",
                                     single_parent=True)

    def create_draft_project(self, draft_project_dto: DraftProjectDTO):
        """
        Creates a draft project
        :param draft_project_dto: DTO containing draft project details
        :param aoi: Area of Interest for the project (eg boundary of project)
        """
        self.project_info.append(ProjectInfo.create_from_name(draft_project_dto.project_name))
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
        default_comment = current_app.config['DEFAULT_CHANGESET_COMMENT']
        self.changeset_comment = f'{default_comment}-{self.id}'
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

        cloned_project = Project.get(project_id)

        # Remove clone from session so we can reinsert it as a new object
        db.session.expunge(cloned_project)
        make_transient(cloned_project)

        # Re-initialise counters and meta-data
        cloned_project.total_tasks = 0
        cloned_project.tasks_mapped = 0
        cloned_project.tasks_validated = 0
        cloned_project.tasks_bad_imagery = 0
        cloned_project.last_updated = timestamp()
        cloned_project.created = timestamp()
        cloned_project.author_id = author_id
        cloned_project.status = ProjectStatus.DRAFT.value
        cloned_project.id = None  # Reset ID so we get a new ID when inserted
        cloned_project.geometry = None
        cloned_project.centroid = None

        db.session.add(cloned_project)
        db.session.commit()

        # Now add the project info, we have to do it in a two stage commit because we need to know the new project id
        original_project = Project.get(project_id)

        for info in original_project.project_info:
            db.session.expunge(info)
            make_transient(info)  # Must remove the object from the session or it will be updated rather than inserted
            info.id = None
            info.project_id_str = str(cloned_project.id)
            cloned_project.project_info.append(info)

        # Now add allowed users now we know new project id, if there are any
        for user in original_project.allowed_users:
            cloned_project.allowed_users.append(user)

        db.session.add(cloned_project)
        db.session.commit()

        return cloned_project

    @staticmethod
    def get(project_id: int):
        """
        Gets specified project
        :param project_id: project ID in scope
        :return: Project if found otherwise None
        """
        return Project.query.get(project_id)

    def update(self, project_dto: ProjectDTO):
        """ Updates project from DTO """
        self.status = ProjectStatus[project_dto.project_status].value
        self.priority = ProjectPriority[project_dto.project_priority].value
        self.default_locale = project_dto.default_locale
        self.enforce_mapper_level = project_dto.enforce_mapper_level
        self.enforce_validator_role = project_dto.enforce_validator_role
        self.private = project_dto.private
        self.mapper_level = MappingLevel[project_dto.mapper_level.upper()].value
        self.entities_to_map = project_dto.entities_to_map
        self.changeset_comment = project_dto.changeset_comment
        self.due_date = project_dto.due_date
        self.imagery = project_dto.imagery
        self.josm_preset = project_dto.josm_preset
        self.last_updated = timestamp()
        self.license_id = project_dto.license_id

        if project_dto.organisation_tag:
            org_tag = Tags.upsert_organistion_tag(project_dto.organisation_tag)
            self.organisation_tag = org_tag
        else:
            self.organisation_tag = None  # Set to none, for cases where a tag could have been removed

        if project_dto.campaign_tag:
            camp_tag = Tags.upsert_campaign_tag(project_dto.campaign_tag)
            self.campaign_tag = camp_tag
        else:
            self.campaign_tag = None  # Set to none, for cases where a tag could have been removed

        # Cast MappingType strings to int array
        type_array = []
        for mapping_type in project_dto.mapping_types:
            type_array.append(MappingTypes[mapping_type].value)
        self.mapping_types = type_array

        # Add list of allowed users, meaning the project can only be mapped by users in this list
        if hasattr(project_dto, 'allowed_users'):
            self.allowed_users = []  # Clear existing relationships then re-insert
            for user in project_dto.allowed_users:
                self.allowed_users.append(user)

        # Set Project Info for all returned locales
        for dto in project_dto.project_info_locales:

            project_info = self.project_info.filter_by(locale=dto.locale).one_or_none()

            if project_info is None:
                new_info = ProjectInfo.create_from_dto(dto)  # Can't find info so must be new locale
                self.project_info.append(new_info)
            else:
                project_info.update_from_dto(dto)

        self.priority_areas = []  # Always clear Priority Area prior to updating
        if project_dto.priority_areas:
            for priority_area in project_dto.priority_areas:
                pa = PriorityArea.from_dict(priority_area)
                self.priority_areas.append(pa)

        db.session.commit()

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    def can_be_deleted(self) -> bool:
        """ Projects can be deleted if they have no mapped work """
        task_count = self.tasks.filter(Task.task_status != TaskStatus.READY.value).count()
        if task_count == 0:
            return True
        else:
            return False

    def get_locked_tasks_for_user(self, user_id: int):
        """ Gets tasks on project owned by specifed user id"""
        tasks = self.tasks.filter_by(locked_by=user_id)

        locked_tasks = []
        for task in tasks:
            locked_tasks.append(task.id)

        return locked_tasks

    def get_locked_tasks_details_for_user(self, user_id: int):
        """ Gets tasks on project owned by specifed user id"""
        tasks = self.tasks.filter_by(locked_by=user_id)

        locked_tasks = []
        for task in tasks:
            locked_tasks.append(task)

        return locked_tasks

    @staticmethod
    def get_projects_for_admin(admin_id: int, preferred_locale: str) -> PMDashboardDTO:
        """ Get projects for admin """
        admins_projects = Project.query.filter_by(author_id=admin_id).all()

        if admins_projects is None:
            raise NotFound('No projects found for admin')

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
                current_app.logger.error(f'Unexpected state project {project.id}')

        return admin_projects_dto

    def get_project_summary(self, preferred_locale) -> ProjectSummary:
        """ Create Project Summary model for postgis project object"""
        summary = ProjectSummary()
        summary.project_id = self.id
        summary.campaign_tag = self.campaign_tag
        summary.created = self.created
        summary.last_updated = self.last_updated
        summary.mapper_level = MappingLevel(self.mapper_level).name
        summary.organisation_tag = self.organisation_tag
        summary.status = ProjectStatus(self.status).name

        centroid_geojson = db.session.scalar(self.centroid.ST_AsGeoJSON())
        summary.aoi_centroid = geojson.loads(centroid_geojson)

        summary.percent_mapped = round((self.tasks_mapped / (self.total_tasks - self.tasks_bad_imagery)) * 100, 0)
        summary.percent_validated = round(((self.tasks_validated + self.tasks_bad_imagery) / self.total_tasks) * 100, 0)

        project_info = ProjectInfo.get_dto_for_locale(self.id, preferred_locale, self.default_locale)
        summary.name = project_info.name
        summary.short_description = project_info.short_description

        return summary

    def get_aoi_geometry_as_geojson(self):
        """ Helper which returns the AOI geometry as a geojson object """
        aoi_geojson = db.engine.execute(self.geometry.ST_AsGeoJSON()).scalar()
        return geojson.loads(aoi_geojson)

    @staticmethod
    @cached(active_mappers_cache)
    def get_active_mappers(project_id) -> int:
        """ Get count of Locked tasks as a proxy for users who are currently active on the project """

        return Task.query \
            .filter(Task.task_status == TaskStatus.LOCKED_FOR_MAPPING.value) \
            .filter(Task.project_id == project_id) \
            .count()

    def _get_project_and_base_dto(self):
        """ Populates a project DTO with properties common to all roles """
        base_dto = ProjectDTO()
        base_dto.project_id = self.id
        base_dto.project_status = ProjectStatus(self.status).name
        base_dto.default_locale = self.default_locale
        base_dto.project_priority = ProjectPriority(self.priority).name
        base_dto.area_of_interest = self.get_aoi_geometry_as_geojson()
        base_dto.enforce_mapper_level = self.enforce_mapper_level
        base_dto.enforce_validator_role = self.enforce_validator_role
        base_dto.private = self.private
        base_dto.mapper_level = MappingLevel(self.mapper_level).name
        base_dto.entities_to_map = self.entities_to_map
        base_dto.changeset_comment = self.changeset_comment
        base_dto.due_date = self.due_date
        base_dto.imagery = self.imagery
        base_dto.josm_preset = self.josm_preset
        base_dto.campaign_tag = self.campaign_tag
        base_dto.organisation_tag = self.organisation_tag
        base_dto.license_id = self.license_id
        base_dto.last_updated = self.last_updated
        base_dto.author = User().get_by_id(self.author_id).username
        base_dto.active_mappers = Project.get_active_mappers(self.id)

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

        if self.priority_areas:
            geojson_areas = []
            for priority_area in self.priority_areas:
                geojson_areas.append(priority_area.get_as_geojson())

            base_dto.priority_areas = geojson_areas

        return self, base_dto

    def as_dto_for_mapping(self, locale: str) -> Optional[ProjectDTO]:
        """ Creates a Project DTO suitable for transmitting to mapper users """
        project, project_dto = self._get_project_and_base_dto()

        project_dto.tasks = Task.get_tasks_as_geojson_feature_collection(self.id)
        project_dto.project_info = ProjectInfo.get_dto_for_locale(self.id, locale, project.default_locale)

        return project_dto

    def as_dto_for_admin(self, project_id):
        """ Creates a Project DTO suitable for transmitting to project admins """
        project, project_dto = self._get_project_and_base_dto()

        if project is None:
            return None

        project_dto.project_info_locales = ProjectInfo.get_dto_for_all_locales(project_id)

        return project_dto


# Add index on project geometry
db.Index('idx_geometry', Project.geometry, postgresql_using='gist')
