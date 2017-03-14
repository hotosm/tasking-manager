import geojson
from enum import Enum
from geoalchemy2 import Geometry
from server import db
from server.models.task import Task
from server.models.utils import InvalidData, InvalidGeoJson, ST_SetSRID, ST_GeomFromGeoJSON, timestamp


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
        aoi_geometry = geojson.loads(aoi_geometry_geojson)

        if type(aoi_geometry) is not geojson.MultiPolygon:
            raise InvalidGeoJson('Area Of Interest: geometry must be a MultiPolygon')

        is_valid_geojson = geojson.is_valid(aoi_geometry)
        if is_valid_geojson['valid'] == 'no':
            raise InvalidGeoJson(f"Area of Interest: Invalid MultiPolygon - {is_valid_geojson['message']}")

        valid_geojson = geojson.dumps(aoi_geometry)
        self.geometry = ST_SetSRID(ST_GeomFromGeoJSON(valid_geojson), 4326)


class ProjectStatus(Enum):
    """
    Enum to describes all possible states of a Mapping Project
    """
    # TODO add DELETE state, others??
    ARCHIVED = 0
    PUBLISHED = 1
    DRAFT = 2


class Project(db.Model):
    """
    Describes a HOT Mapping Project
    """
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(256))
    status = db.Column(db.Integer, default=ProjectStatus.DRAFT.value)
    aoi_id = db.Column(db.Integer, db.ForeignKey('areas_of_interest.id'))
    area_of_interest = db.relationship(AreaOfInterest, cascade="all")
    tasks = db.relationship(Task, backref='projects', cascade="all, delete, delete-orphan")
    created = db.Column(db.DateTime, default=timestamp)

    def __init__(self, project_name, aoi):
        """
        Project constructor
        :param project_name: Name Project Manager has given the project
        :param aoi: Area of Interest for the project (eg boundary of project)
        :raises InvalidData
        """
        if not project_name:
            raise InvalidData('Project: project_name cannot be empty')

        self.name = project_name
        self.area_of_interest = aoi
        self.status = ProjectStatus.DRAFT.value

    def create(self):
        """
        Creates and saves the current model to the DB
        """
        # TODO going to need some validation and logic re Draft, Published etc
        db.session.add(self)
        db.session.commit()

    def delete(self):
        """
        Deletes the current model from the DB
        """
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def as_dto(project_id):
        """
        Creates a Project DTO suitable for transmitting via the API
        :param project_id: project_id in scope
        :return: Project DTO dict
        """
        query = db.session.query(Project.id, Project.name, AreaOfInterest.geometry.ST_AsGeoJSON()
                                 .label('geojson')).join(AreaOfInterest).filter(Project.id == project_id).one_or_none()

        if query is None:
            return None

        project_dto = dict(projectId=project_id, projectName=query.name)
        project_dto['areaOfInterest'] = geojson.loads(query.geojson)
        project_dto['tasks'] = Task.get_tasks_as_geojson_feature_collection(project_id)

        return project_dto
