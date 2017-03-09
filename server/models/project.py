import datetime
import geojson
from enum import Enum
from flask import current_app
from geoalchemy2 import Geometry
from geoalchemy2.functions import GenericFunction
from server import db


class InvalidGeoJson(Exception):
    """
    Custom exception to notify caller they have supplied Invalid GeoJson
    """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class InvalidData(Exception):
    """
    Custom exception to notify caller they have supplied Invalid data to a model
    """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ST_SetSRID(GenericFunction):
    name = 'ST_SetSRID'
    type = Geometry


class ST_GeomFromGeoJSON(GenericFunction):
    name = 'ST_GeomFromGeoJSON'
    type = Geometry


class TaskStatus(Enum):
    """
    Enum describing available Task Statuses
    """
    # task states
    READY = 0
    INVALIDATED = 1
    DONE = 2
    VALIDATED = 3
    # REMOVED = -1 TODO this looks weird can it be removed


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
    task_status = db.Column(db.Integer, default=TaskStatus.READY.value)
    task_locked = db.Column(db.Boolean, default=False)

    @classmethod
    def from_geojson_feature(cls, task_id, task_feature):
        """
        Constructs and validates a task from a GeoJson feature object
        :param task_id: Unique ID for the task
        :param task_feature: A geoJSON feature object
        :raises InvalidGeoJson, InvalidData
        """
        if type(task_feature) is not geojson.Feature:
            raise InvalidGeoJson('Task: Invalid GeoJson should be a feature')

        task_geometry = task_feature.geometry

        if type(task_geometry) is not geojson.MultiPolygon:
            raise InvalidGeoJson('Task: Geometry must be a MultiPolygon')

        is_valid_geojson = geojson.is_valid(task_geometry)
        if is_valid_geojson['valid'] == 'no':
            raise InvalidGeoJson(f"Task: Invalid MultiPolygon - {is_valid_geojson['message']}")

        task = cls()
        try:
            task.x = task_feature.properties['x']
            task.y = task_feature.properties['y']
            task.zoom = task_feature.properties['zoom']
        except KeyError as e:
            raise InvalidData(f'Task: Expected property not found: {str(e)}')

        task.id = task_id
        task_geojson = geojson.dumps(task_geometry)
        task.geometry = ST_SetSRID(ST_GeomFromGeoJSON(task_geojson), 4326)

        return task

    @staticmethod
    def get(project_id, task_id):
        """
        Gets specified task
        :param project_id: project ID in scope
        :param task_id: task ID in scope
        :return: Task if found otherwise None
        """
        return Task.query.filter_by(id=task_id, project_id=project_id).one_or_none()

    def update(self):
        """
        Updates the DB with the current state of the Task
        """
        db.session.commit()

    @staticmethod
    def get_tasks_as_geojson_feature_collection(project_id):
        """
        Creates a geoJson.FeatureCollection object for all tasks related to the supplied project ID
        :param project_id: Owning project ID
        :return: geojson.FeatureCollection
        """
        project_tasks = \
            db.session.query(Task.id, Task.x, Task.y, Task.zoom, Task.task_locked, Task.task_status,
                             Task.geometry.ST_AsGeoJSON().label('geojson')).filter(Task.project_id == project_id).all()

        tasks_features = []
        for task in project_tasks:
            task_geometry = geojson.loads(task.geojson)
            task_properties = dict(taskId=task.id, taskX=task.x, taskY=task.y, taskZoom=task.zoom,
                                   taskLocked=task.task_locked, taskStatus=TaskStatus(task.task_status).name)
            feature = geojson.Feature(geometry=task_geometry, properties=task_properties)
            tasks_features.append(feature)

        return geojson.FeatureCollection(tasks_features)


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
    created = db.Column(db.DateTime, default=datetime.datetime.utcnow)

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
        Creates a Project DTO suitable of transmitting via the API
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
