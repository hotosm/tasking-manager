import datetime
from enum import Enum
from server import db


class ProjectStatus(Enum):
    """
    Enum to describes all possible states of a Mapping Project
    """
    ARCHIVED = 0
    PUBLISHED = 1
    DRAFT = 2


class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.Integer, default=ProjectStatus.DRAFT)
    created = db.Column(db.DateTime, default=datetime.datetime.utcnow)
