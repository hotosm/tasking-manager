import datetime
import geojson
from enum import Enum
from geoalchemy2 import Geometry
from server import db
from server.models.utils import InvalidData, InvalidGeoJson, ST_GeomFromGeoJSON, ST_SetSRID, current_datetime


class TaskAction(Enum):
    """
    Describes the possible actions that can happen to to a task, that we'll record history for
    """
    LOCKED = 1
    STATE_CHANGE = 2
    COMMENT = 3


class TaskHistory(db.Model):
    """
    Describes the history associated with a task
    """
    __tablename__ = "task_history"

    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), index=True, primary_key=True)

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, nullable=False)
    project_id = db.Column(db.Integer, nullable=False)
    action = db.Column(db.String, nullable=False)
    action_text = db.Column(db.String)
    action_date = db.Column(db.DateTime, nullable=False, default=current_datetime())

    __table_args__ = (db.ForeignKeyConstraint([task_id, project_id], ['tasks.id', 'tasks.project_id']),
                      db.Index('idx_task_history_composite', 'task_id', 'project_id'), {})

    def __init__(self, task_id, project_id):
        self.task_id = task_id
        self.project_id = project_id

    def set_task_locked_action(self):
        self.action = TaskAction.LOCKED.name

    @staticmethod
    def update_task_locked_with_duration(task_id, project_id):
        """
        Calculates the duration a task was locked for and sets it on the history record
        :param task_id: Task in scope
        :param project_id: Project ID in scope
        :return:
        """
        last_locked = TaskHistory.query.filter_by(task_id=task_id, project_id=project_id, action=TaskAction.LOCKED.name,
                                                  action_text=None).one()

        duration_task_locked = datetime.datetime.utcnow() - last_locked.action_date
        # Cast duration to isoformat for later transmission via api
        last_locked.action_text = (datetime.datetime.min + duration_task_locked).time().isoformat()
        db.session.commit()

    def set_comment_action(self, comment):
        self.action = TaskAction.COMMENT.name
        self.action_text = comment

    def set_state_change_action(self, new_state):
        self.action = TaskAction.STATE_CHANGE.name
        self.action_text = new_state.name


class TaskStatus(Enum):
    """ Enum describing available Task Statuses """
    READY = 0
    INVALIDATED = 1
    DONE = 2
    VALIDATED = 3
    BADIMAGERY = 4  # Task cannot be mapped because of clouds, fuzzy imagery
    # REMOVED = -1 TODO this looks weird can it be removed


class Task(db.Model):
    """ Describes an individual mapping Task """

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
    task_history = db.relationship(TaskHistory, cascade="all")

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
    def get(task_id, project_id):
        """
        Gets specified task
        :param task_id: task ID in scope
        :param project_id: project ID in scope
        :return: Task if found otherwise None
        """
        return Task.query.filter_by(id=task_id, project_id=project_id).one_or_none()

    def update(self):
        """ Updates the DB with the current state of the Task """
        db.session.commit()

    def lock_task(self):
        """ Lock task and save in DB  """
        self.task_locked = True
        self.update()

    def unlock_task(self):
        """ Unlock task and ensure duration task locked is saved in History """
        TaskHistory.update_task_locked_with_duration(self.id, self.project_id)
        self.task_locked = False
        self.update()

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

    @staticmethod
    def as_dto(task_id, project_id):
        """
        Creates a Task DTO suitable for transmitting via the API
        :param task_id: Task ID in scope
        :param project_id: Project ID in scope
        :return: JSON serializable Task DTO
        """
        task = Task.get(task_id, project_id)

        if task is None:
            return None

        task_history = []
        for action in task.task_history:
            if action.action_text is None:
                continue  # Don't return any history without action text

            history = dict(action=action.action, actionText=action.action_text, actionDate=action.action_date)
            task_history.append(history)

        task_dto = dict(taskId=task.id, projectId=task.project_id, taskStatus=TaskStatus(task.task_status).name,
                        taskLocked=task.task_locked, taskHistory=task_history)

        return task_dto
