from server.models.postgis.statuses import TaskAnnotationType
from server.models.postgis.utils import InvalidData, InvalidGeoJson, timestamp, NotFound
from server import db


class TaskAnnotation(db.Model):
    """ Describes Task annotaions like derived ML attributes """
    __tablename__ = "task_annotations"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'),  index=True)
    task_id = db.Column(db.Integer, nullable=False)
    annotation_type = db.Column(db.Integer, nullable=False)
    annotation_source = db.Column(db.String)
    updated_timestamp = db.Column(db.DateTime, nullable=False, default=timestamp)
    properties = db.Column(db.JSON, nullable=False)

    __table_args__ = (db.ForeignKeyConstraint([task_id, project_id], ['tasks.id', 'tasks.project_id'], name='fk_task_annotations'),
                      db.Index('idx_task_annotations_composite', 'task_id', 'project_id'), {})


    def create(self):
        """ Creates and saves the current model to the DB """
        db.session.add(self)
        db.session.commit()

    def update(self):
        """ Updates the DB with the current state of the Task Annotations """
        db.session.commit()

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()