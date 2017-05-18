import json
import geojson
from flask import current_app
from typing import Optional
from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import ARRAY
from server import db
from server.models.dtos.project_dto import ProjectDTO, DraftProjectDTO, ProjectSearchResultDTO, \
    ProjectSearchResultsDTO, ProjectSummary, PMDashboardDTO
from server.models.postgis.priority_area import PriorityArea, project_priority_areas
from server.models.postgis.project_info import ProjectInfo
from server.models.postgis.statuses import ProjectStatus, ProjectPriority, MappingLevel, TaskStatus, MappingTypes
from server.models.postgis.tags import Tags
from server.models.postgis.task import Task
from server.models.postgis.user import User
from server.models.postgis.utils import InvalidGeoJson, ST_SetSRID, ST_GeomFromGeoJSON, timestamp, ST_Centroid, NotFound
from server.services.grid_service import GridService

# Secondary table defining many-to-many join for private projects that only defined users can map on
project_allowed_users = db.Table(
    'project_allowed_users',
    db.metadata,
    db.Column('project_id', db.Integer, db.ForeignKey('projects.id')),
    db.Column('user_id', db.BigInteger, db.ForeignKey('users.id'))
)


class AreaOfInterest(db.Model):
    """
    Describes the Area of Interest (AOI) that the project manager defined when creating a project
    """
    __tablename__ = 'areas_of_interest'

    id = db.Column(db.Integer, primary_key=True)
    geometry = db.Column(Geometry('MULTIPOLYGON', srid=4326))
    centroid = db.Column(Geometry('POINT', srid=4326))

    def __init__(self, aoi_geometry_geojson):
        """
        AOI Constructor
        :param aoi_geometry_geojson: AOI GeoJson
        :raises InvalidGeoJson
        """
        aoi_geojson = geojson.loads(json.dumps(aoi_geometry_geojson))
        aoi_geometry = GridService.merge_to_multi_polygon(aoi_geojson, dissolve=True)

        if type(aoi_geometry) is not geojson.MultiPolygon:
            raise InvalidGeoJson('Area Of Interest: geometry must be a MultiPolygon')

        is_valid_geojson = geojson.is_valid(aoi_geometry)
        if is_valid_geojson['valid'] == 'no':
            raise InvalidGeoJson(f"Area of Interest: Invalid MultiPolygon - {is_valid_geojson['message']}")

        valid_geojson = geojson.dumps(aoi_geometry)
        self.geometry = ST_SetSRID(ST_GeomFromGeoJSON(valid_geojson), 4326)
        self.centroid = ST_Centroid(self.geometry)

    def get_aoi_geometry_as_geojson(self):
        """ Helper which returns the AOI geometry as a geojson object """
        aoi_geojson = db.engine.execute(self.geometry.ST_AsGeoJSON()).scalar()
        return geojson.loads(aoi_geojson)


class Project(db.Model):
    """ Describes a HOT Mapping Project """
    __tablename__ = 'projects'

    # Columns
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.Integer, default=ProjectStatus.DRAFT.value, nullable=False)
    aoi_id = db.Column(db.Integer, db.ForeignKey('areas_of_interest.id'))
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
    area_of_interest = db.relationship(AreaOfInterest, cascade="all")  # TODO AOI just in project??
    project_info = db.relationship(ProjectInfo, lazy='dynamic', cascade='all')
    author = db.relationship(User)
    allowed_users = db.relationship(User, secondary=project_allowed_users)
    priority_areas = db.relationship(PriorityArea, secondary=project_priority_areas, cascade="all, delete-orphan",
                                     single_parent=True)

    def create_draft_project(self, draft_project_dto: DraftProjectDTO, aoi: AreaOfInterest):
        """
        Creates a draft project
        :param draft_project_dto: DTO containing draft project details
        :param aoi: Area of Interest for the project (eg boundary of project)
        """
        self.project_info.append(ProjectInfo.create_from_name(draft_project_dto.project_name))
        self.area_of_interest = aoi
        self.status = ProjectStatus.DRAFT.value
        self.author_id = draft_project_dto.user_id
        self.last_updated = timestamp()

    def create(self):
        """ Creates and saves the current model to the DB """
        db.session.add(self)
        db.session.commit()

    def save(self):
        """ Save changes to db"""
        db.session.commit()

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

    @staticmethod
    def get_projects_for_admin(admin_id: int, preferred_locale: str) -> PMDashboardDTO:
        """ Get projects for admin """
        admins_projects = db.session.query(Project.id,
                                           Project.status,
                                           Project.campaign_tag,
                                           Project.total_tasks,
                                           Project.tasks_mapped,
                                           Project.tasks_validated,
                                           Project.tasks_bad_imagery,
                                           Project.created,
                                           Project.last_updated,
                                           Project.default_locale,
                                           AreaOfInterest.centroid.ST_AsGeoJSON().label('geojson'))\
            .join(AreaOfInterest).filter(Project.author_id == admin_id).all()

        if admins_projects is None:
            raise NotFound('No projects found for admin')

        admin_projects_dto = PMDashboardDTO()
        for project in admins_projects:
            pm_project = Project.get_project_summary(project, preferred_locale)
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

    @staticmethod
    def get_project_summary(project, preferred_locale) -> ProjectSummary:
        """ Create Project Summary model for postgis project object"""
        pm_project = ProjectSummary()
        pm_project.project_id = project.id
        pm_project.campaign_tag = project.campaign_tag
        pm_project.created = project.created
        pm_project.last_updated = project.last_updated
        pm_project.aoi_centroid = geojson.loads(project.geojson)

        pm_project.percent_mapped = round((project.tasks_mapped / (project.total_tasks - project.tasks_bad_imagery)) * 100, 0)
        pm_project.percent_validated = round(((project.tasks_validated + project.tasks_bad_imagery) / project.total_tasks) * 100, 0)

        project_info = ProjectInfo.get_dto_for_locale(project.id, preferred_locale, project.default_locale)
        pm_project.name = project_info.name

        return pm_project

    def _get_project_and_base_dto(self, project_id):
        """ Populates a project DTO with properties common to all roles """
        project = Project.get(project_id)

        if project is None:
            return None, None

        aoi = project.area_of_interest

        base_dto = ProjectDTO()
        base_dto.project_id = project_id
        base_dto.project_status = ProjectStatus(project.status).name
        base_dto.default_locale = project.default_locale
        base_dto.project_priority = ProjectPriority(project.priority).name
        base_dto.area_of_interest = aoi.get_aoi_geometry_as_geojson()
        base_dto.enforce_mapper_level = project.enforce_mapper_level
        base_dto.enforce_validator_role = project.enforce_validator_role
        base_dto.private = project.private
        base_dto.mapper_level = MappingLevel(project.mapper_level).name
        base_dto.entities_to_map = project.entities_to_map
        base_dto.changeset_comment = project.changeset_comment
        base_dto.due_date = project.due_date
        base_dto.imagery = project.imagery
        base_dto.josm_preset = project.josm_preset
        base_dto.campaign_tag = project.campaign_tag
        base_dto.organisation_tag = project.organisation_tag
        base_dto.license_id = project.license_id
        base_dto.last_updated = project.last_updated
        base_dto.author = User().get_by_id(project.author_id).username

        if project.private:
            # If project is private it should have a list of allowed users
            allowed_usernames = []
            for user in project.allowed_users:
                allowed_usernames.append(user.username)
            base_dto.allowed_usernames = allowed_usernames

        if project.mapping_types:
            mapping_types = []
            for mapping_type in project.mapping_types:
                mapping_types.append(MappingTypes(mapping_type).name)

            base_dto.mapping_types = mapping_types

        if project.priority_areas:
            geojson_areas = []
            for priority_area in project.priority_areas:
                geojson_areas.append(priority_area.get_as_geojson())

            base_dto.priority_areas = geojson_areas

        return project, base_dto

    def as_dto_for_mapping(self, locale: str) -> Optional[ProjectDTO]:
        """ Creates a Project DTO suitable for transmitting to mapper users """
        project, project_dto = self._get_project_and_base_dto(self.id)

        project_dto.tasks = Task.get_tasks_as_geojson_feature_collection(self.id)
        project_dto.project_info = ProjectInfo.get_dto_for_locale(self.id, locale, project.default_locale)

        return project_dto

    def as_dto_for_admin(self, project_id):
        """ Creates a Project DTO suitable for transmitting to project admins """
        project, project_dto = self._get_project_and_base_dto(project_id)

        if project is None:
            return None

        project_dto.project_info_locales = ProjectInfo.get_dto_for_all_locales(project_id)

        return project_dto

    @staticmethod
    def get_projects_by_seach_criteria(sql: str, preferred_locale: str) -> ProjectSearchResultsDTO:
        """ Find all projects that match the search criteria """
        results = db.engine.execute(sql)

        if results.rowcount == 0:
            raise NotFound()

        results_list = []
        for row in results:
            # TODO would be nice to get this for an array rather than individually would be more efficient
            project_info_dto = ProjectInfo.get_dto_for_locale(row[0], preferred_locale, row[3])

            result_dto = ProjectSearchResultDTO()
            result_dto.project_id = row[0]
            result_dto.locale = project_info_dto.locale
            result_dto.name = project_info_dto.name
            result_dto.priority = ProjectPriority(row[2]).name
            result_dto.mapper_level = MappingLevel(row[1]).name
            result_dto.short_description = project_info_dto.short_description
            result_dto.aoi_centroid = geojson.loads(row[4])
            result_dto.organisation_tag = row[5]
            result_dto.campaign_tag = row[6]

            results_list.append(result_dto)

        results_dto = ProjectSearchResultsDTO()
        results_dto.results = results_list

        return results_dto
