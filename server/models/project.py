import datetime
import geojson
from geoalchemy2 import Geometry
from geoalchemy2.functions import GenericFunction
from enum import Enum
from server import db


class InvalidGeoJson(Exception):
    """
    Custom exception to notify caller they have supplied Invalid GeoJson
    """
    pass


class ST_SetSRID(GenericFunction):
    name = 'ST_SetSRID'
    type = Geometry


class ST_GeomFromGeoJSON(GenericFunction):
    name = 'ST_GeomFromGeoJSON'
    type = Geometry


class ProjectStatus(Enum):
    """
    Enum to describes all possible states of a Mapping Project
    """
    # TODO add DELETE state, others??
    ARCHIVED = 0
    PUBLISHED = 1
    DRAFT = 2


class Task(db.Model):
    """
    Describes an individual mapping Task
    """
    __tablename__ = "tasks"

    # Table has composite PK on (id and project_id)
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), index=True, primary_key=True)
    x = db.Column(db.Integer, nullable=False)
    y = db.Column(db.Integer, nullable=False)
    zoom = db.Column(db.Integer, nullable=False)
    geometry = db.Column(Geometry('MULTIPOLYGON', srid=4326))

    def __init__(self, task_id, task_multipolygon):

        if type(task_multipolygon) is not geojson.MultiPolygon:
            raise InvalidGeoJson('Task must be a MultiPolygon')

        # TODO make a util
        is_valid_geojson = geojson.is_valid(task_multipolygon)
        if is_valid_geojson['valid'] == 'no':
            raise InvalidGeoJson(f"Invalid MultiPolygon - {is_valid_geojson['message']}")

        self.id = task_id
        self.x = task_multipolygon.properties['x']
        self.y = task_multipolygon.properties['y']
        self.zoom = task_multipolygon.properties['zoom']

        task_geojson = geojson.dumps(task_multipolygon)
        self.geometry = ST_SetSRID(ST_GeomFromGeoJSON(task_geojson), 4326)

        iain = 1



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
            raise InvalidGeoJson('Area Of Interest geometry must be a MultiPolygon')

        is_valid_geojson = geojson.is_valid(aoi_geometry)
        if is_valid_geojson['valid'] == 'no':
            raise InvalidGeoJson(f"Invalid MultiPolygon - {is_valid_geojson['message']}")

        valid_geojson = geojson.dumps(aoi_geometry)
        self.geometry = ST_SetSRID(ST_GeomFromGeoJSON(valid_geojson), 4326)



class Project(db.Model):
    """
    Describes a HOT Mapping Project
    """
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(256))
    status = db.Column(db.Integer, default=ProjectStatus.DRAFT.value)
    aoi_id = db.Column(db.Integer, db.ForeignKey('areas_of_interest.id'))
    area_of_interest = db.relationship(AreaOfInterest)
    tasks = db.relationship(Task, backref='projects', cascade="all, delete, delete-orphan")
    created = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def __init__(self, name, aoi):
        self.name = name
        self.area_of_interest = aoi

    def create(self):
        """
        Creates and saves the current model to the DB
        """
        # TODO going to need some validation and logic re Draft, Published etc
        db.session.add(self)
        db.session.commit()
