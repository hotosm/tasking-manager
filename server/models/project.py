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


class AreaOfInterest(db.Model):
    """
    Describes the Area of Interest (AOI) that the project manager defined when creating a project
    """
    __tablename__ = 'areas_of_interest'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))

    def __init__(self, *initial_data, **kwargs):
        # TODO - prob move to base class, leave while we build up models
        for dictionary in initial_data:
            for key in dictionary:
                setattr(self, key, dictionary[key])
        for key in kwargs:
            setattr(self, key, kwargs[key])


class Project(db.Model):
    """
    Describes a HOT Mapping Project
    """
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(256))
    status = db.Column(db.Integer, default=ProjectStatus.DRAFT.value)
    area_id = db.Column(db.Integer, db.ForeignKey('areas.id'))
    area = db.relationship(AreaOfInterest)
    created = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def __init__(self, *initial_data, **kwargs):
        # TODO - prob move to base class, leave while we build up models
        for dictionary in initial_data:
            for key in dictionary:
                setattr(self, key, dictionary[key])
        for key in kwargs:
            setattr(self, key, kwargs[key])

    def save(self):
        """
        Saves the current model state to the DB
        """
        # TODO going to need some validation and logic re Draft, Published etc
        db.session.add(self)
        db.session.commit()
