import geojson
from enum import Enum
from geoalchemy2 import Geometry
from server import db
from server.models.utils import InvalidData, InvalidGeoJson, ST_GeomFromGeoJSON, ST_SetSRID


class TaskStatus(Enum):
    """
    Enum describing available Task Statuses
    """
    READY = 0
    INVALIDATED = 1
    DONE = 2
    VALIDATED = 3
    BADIMAGERY = 4  # Task cannot be mapped because of clouds, fuzzy imagery
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
