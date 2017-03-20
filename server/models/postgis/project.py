import json
import geojson
from flask import current_app
from typing import Optional, List
from geoalchemy2 import Geometry
from server import db
from server.models.dtos.project_dto import ProjectDTO, ProjectInfoDTO
from server.models.postgis.statuses import ProjectStatus, ProjectPriority
from server.models.postgis.task import Task
from server.models.postgis.utils import InvalidData, InvalidGeoJson, ST_SetSRID, ST_GeomFromGeoJSON, timestamp


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

        # Pass thru default_locale incase of partial translation
        return project_info.get_dto(default_locale)

    def get_dto(self, default_locale=None) -> ProjectDTO:
        """
        Get DTO for current ProjectInfo
        :param default_locale: If true, use default locale string for any empty fields
        """

        # TODO on migrate fill in MISSING on any empty null columns on default locales

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
    tasks = db.relationship(Task, backref='projects', cascade="all, delete, delete-orphan")
    created = db.Column(db.DateTime, default=timestamp, nullable=False)
    priority = db.Column(db.Integer, default=ProjectPriority.MEDIUM.value)
    default_locale = db.Column(db.String(10), default='en')  # The locale that is returned if requested locale not available

    # Mapped Objects
    area_of_interest = db.relationship(AreaOfInterest, cascade="all")  # TODO AOI just in project??
    project_info = db.relationship(ProjectInfo, lazy='dynamic', cascade='all')

    def create_draft_project(self, project_name, aoi):
        """
        Project constructor
        :param project_name: Name Project Manager has given the project
        :param aoi: Area of Interest for the project (eg boundary of project)
        :raises InvalidData
        """
        if not project_name:
            raise InvalidData('Project: project_name cannot be empty')

        self.project_info.append(ProjectInfo.create_from_name(project_name))
        self.area_of_interest = aoi
        self.status = ProjectStatus.DRAFT.value

    def create(self):
        """
        Creates and saves the current model to the DB
        """
        # TODO going to need some validation and logic re Draft, Published etc
        db.session.add(self)
        db.session.commit()

    def update(self, project_dto: ProjectDTO):
        """ Updates project from DTO """
        self.status = ProjectStatus[project_dto.project_status].value
        self.priority = ProjectPriority[project_dto.project_priority].value
        self.default_locale = project_dto.default_locale

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

    def _get_project_and_base_dto(self, project_id):
        """ Populates a project DTO with properties common to all roles """

        # Query ignores tasks so we can more optimally generate the task feature collection if needed
        project = db.session.query(Project.id,
                                   Project.priority,
                                   Project.status,
                                   Project.default_locale,
                                   AreaOfInterest.geometry.ST_AsGeoJSON().label('geojson')) \
            .join(AreaOfInterest).filter(Project.id == project_id).one_or_none()

        if project is None:
            return None, None

        base_dto = ProjectDTO()
        base_dto.project_id = project_id
        base_dto.project_status = ProjectStatus(project.status).name
        base_dto.project_priority = ProjectPriority(project.priority).name
        base_dto.area_of_interest = geojson.loads(project.geojson)

        return project, base_dto

    def as_dto_for_mapping(self, project_id: int, locale: str) -> Optional[ProjectDTO]:
        """ Creates a Project DTO suitable for transmitting to mapper users """
        project, project_dto = self._get_project_and_base_dto(project_id)

        if project is None:
            return None

        project_dto.tasks = Task.get_tasks_as_geojson_feature_collection(project_id)
        project_dto.project_info = ProjectInfo.get_dto_for_locale(project_id, locale, project.default_locale)

        return project_dto

    def as_dto_for_admin(self, project_id):
        """ Creates a Project DTO suitable for transmitting to project admins """
        project, project_dto = self._get_project_and_base_dto(project_id)

        if project is None:
            return None

        project_dto.project_info_locales = ProjectInfo.get_dto_for_all_locales(project_id)

        return project_dto
