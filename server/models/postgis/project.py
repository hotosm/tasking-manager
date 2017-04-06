import json
import geojson
from flask import current_app
from typing import Optional, List
from geoalchemy2 import Geometry
from server import db
from server.models.dtos.project_dto import ProjectDTO, ProjectInfoDTO, DraftProjectDTO, ProjectSearchDTO, \
    ProjectSearchResultDTO, ProjectSearchResultsDTO
from server.models.postgis.statuses import ProjectStatus, ProjectPriority, MappingLevel
from server.models.postgis.task import Task
from server.models.postgis.user import User
from server.models.postgis.utils import InvalidGeoJson, ST_SetSRID, ST_GeomFromGeoJSON, timestamp, ST_Centroid, \
    ST_AsGeoJSON


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
        aoi_geometry = geojson.loads(json.dumps(aoi_geometry_geojson))

        if type(aoi_geometry) is not geojson.MultiPolygon:
            raise InvalidGeoJson('Area Of Interest: geometry must be a MultiPolygon')

        is_valid_geojson = geojson.is_valid(aoi_geometry)
        if is_valid_geojson['valid'] == 'no':
            raise InvalidGeoJson(f"Area of Interest: Invalid MultiPolygon - {is_valid_geojson['message']}")

        valid_geojson = geojson.dumps(aoi_geometry)
        self.geometry = ST_SetSRID(ST_GeomFromGeoJSON(valid_geojson), 4326)
        self.centroid = ST_Centroid(self.geometry)


class ProjectInfo(db.Model):
    """ Contains all project info localized into supported languages """
    __tablename__ = 'project_info'

    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), primary_key=True)
    locale = db.Column(db.String(10), primary_key=True)
    name = db.Column(db.String(512))
    short_description = db.Column(db.String)
    description = db.Column(db.String)
    instructions = db.Column(db.String)

    __table_args__ = (db.Index('idx_project_info composite', 'locale', 'project_id'), {})

    @classmethod
    def create_from_name(cls, name: str):
        """ Creates a new ProjectInfo class from name, used when creating draft projects """
        new_info = cls()
        new_info.locale = 'en'  # Draft project default to english, PMs can change this prior to publication
        new_info.name = name
        return new_info

    @classmethod
    def create_from_dto(cls, dto: ProjectInfoDTO):
        """ Creates a new ProjectInfo class from dto, used from project edit """
        new_info = cls()
        new_info.update_from_dto(dto)
        return new_info

    def update_from_dto(self, dto: ProjectInfoDTO):
        """ Updates existing ProjectInfo from supplied DTO """
        self.locale = dto.locale
        self.name = dto.name

        # TODO bleach input
        self.short_description = dto.short_description
        self.description = dto.description
        self.instructions = dto.instructions

    @staticmethod
    def get_dto_for_locale(project_id, locale, default_locale='en') -> ProjectInfoDTO:
        """
        Gets the projectInfoDTO for the project for the requested locale. If not found, then the default locale is used
        :param project_id: ProjectID in scope
        :param locale: locale requested by user
        :param default_locale: default locale of project
        :raises: ValueError if no info found for Default Locale
        """
        project_info = ProjectInfo.query.filter_by(project_id=project_id, locale=locale).one_or_none()

        if project_info is None:
            # If project is none, get default locale and don't worry about empty translations
            project_info = ProjectInfo.query.filter_by(project_id=project_id, locale=default_locale).one_or_none()
            return project_info.get_dto()

        if locale == default_locale:
            # If locale == default_locale don't need to worry about empty translations
            return project_info.get_dto()

        default_locale = ProjectInfo.query.filter_by(project_id=project_id, locale=default_locale).one_or_none()

        if default_locale is None:
            error_message = \
                f'BAD DATA - no info found for project {project_id}, locale: {locale}, default {default_locale}'
            current_app.logger.critical(error_message)
            raise ValueError(error_message)

        # Pass thru default_locale in case of partial translation
        return project_info.get_dto(default_locale)

    def get_dto(self, default_locale=ProjectInfoDTO()) -> ProjectInfoDTO:
        """
        Get DTO for current ProjectInfo
        :param default_locale: The default locale string for any empty fields
        """
        project_info_dto = ProjectInfoDTO()
        project_info_dto.locale = self.locale
        project_info_dto.name = self.name if self.name else default_locale.name
        project_info_dto.description = self.description if self.description else default_locale.description
        project_info_dto.short_description = self.short_description if self.short_description else default_locale.short_description
        project_info_dto.instructions = self.instructions if self.description else default_locale.instructions

        return project_info_dto

    @staticmethod
    def get_dto_for_all_locales(project_id) -> List[ProjectInfoDTO]:
        locales = ProjectInfo.query.filter_by(project_id=project_id).all()

        project_info_dtos = []
        for locale in locales:
            project_info_dto = locale.get_dto()
            project_info_dtos.append(project_info_dto)

        return project_info_dtos


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
    mapper_level = db.Column(db.Integer, default=1, nullable=False)  # Mapper level project is suitable for
    enforce_mapper_level = db.Column(db.Boolean, default=False)
    enforce_validator_role = db.Column(db.Boolean, default=False)  # Means only users with validator role can validate
    private = db.Column(db.Boolean, default=False)  # Only allowed users can validate

    # Mapped Objects
    tasks = db.relationship(Task, backref='projects', cascade="all, delete, delete-orphan", lazy='dynamic')
    area_of_interest = db.relationship(AreaOfInterest, cascade="all")  # TODO AOI just in project??
    project_info = db.relationship(ProjectInfo, lazy='dynamic', cascade='all')
    author = db.relationship(User)

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

    def create(self):
        """ Creates and saves the current model to the DB """
        # TODO going to need some validation and logic re Draft, Published etc
        db.session.add(self)
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

        # Set Project Info for all returned locales
        for dto in project_dto.project_info_locales:

            project_info = self.project_info.filter_by(locale=dto.locale).one_or_none()

            if project_info is None:
                new_info = ProjectInfo.create_from_dto(dto)  # Can't find info so must be new locale
                self.project_info.append(new_info)
            else:
                project_info.update_from_dto(dto)

        db.session.commit()

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    def get_locked_tasks_for_user(self, user_id: int):
        """ Gets tasks on project owned by specifed user id"""
        tasks = self.tasks.filter_by(locked_by=user_id)

        locked_tasks = []
        for task in tasks:
            locked_tasks.append(task.id)

        return locked_tasks

    def _get_project_and_base_dto(self, project_id):
        """ Populates a project DTO with properties common to all roles """

        # Query ignores tasks so we can more optimally generate the task feature collection if needed
        project = db.session.query(Project.id,
                                   Project.priority,
                                   Project.status,
                                   Project.default_locale,
                                   Project.mapper_level,
                                   Project.enforce_validator_role,
                                   Project.enforce_mapper_level,
                                   Project.private,
                                   AreaOfInterest.geometry.ST_AsGeoJSON().label('geojson')) \
            .join(AreaOfInterest).filter(Project.id == project_id).one_or_none()

        if project is None:
            return None, None

        base_dto = ProjectDTO()
        base_dto.project_id = project_id
        base_dto.project_status = ProjectStatus(project.status).name
        base_dto.project_priority = ProjectPriority(project.priority).name
        base_dto.area_of_interest = geojson.loads(project.geojson)
        base_dto.enforce_mapper_level = project.enforce_mapper_level
        base_dto.enforce_validator_role = project.enforce_validator_role
        base_dto.private = project.private
        base_dto.mapper_level = MappingLevel(project.mapper_level).name

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
    def get_projects_by_seach_criteria(search_dto: ProjectSearchDTO) -> ProjectSearchResultsDTO:
        """ Find all projects that match the search criteria """

        projects = Project.query.filter_by(status=ProjectStatus.PUBLISHED.value,
                                           mapper_level=MappingLevel[search_dto.mapper_level].value).all()

        results_list = []
        for project in projects:
            # TODO would be nice to get this for an array rather than individually would be more efficient
            project_info_dto = ProjectInfo.get_dto_for_locale(project.id, search_dto.preferred_locale,
                                                              project.default_locale)

            result_dto = ProjectSearchResultDTO()
            result_dto.project_id = project.id
            result_dto.locale = project_info_dto.locale
            result_dto.name = project_info_dto.name
            result_dto.priority = ProjectPriority(project.priority).name
            result_dto.mapper_level = MappingLevel(project.mapper_level).name
            result_dto.short_description = project_info_dto.short_description

            # Get AOI centroid as geoJson
            centroid_str = db.session.scalar(project.area_of_interest.centroid.ST_AsGeoJSON())
            result_dto.aoi_centroid = geojson.loads(centroid_str)

            results_list.append(result_dto)

        results_dto = ProjectSearchResultsDTO()
        results_dto.results = results_list

        return results_dto
