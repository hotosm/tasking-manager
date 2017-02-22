import datetime
from enum import Enum
from server import db


class ProjectStatus(Enum):
    """
    Enum to describes all possible states of a Mapping Project
    """
    # TODO add DELETE state, others??
    ARCHIVED = 0
    PUBLISHED = 1
    DRAFT = 2


class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.Integer, default=ProjectStatus.DRAFT)
    created = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
