import bleach
import datetime
import geojson
from enum import Enum
from geoalchemy2 import Geometry
from server import db
from typing import List
from server.models.postgis.user import User
from server.models.postgis.utils import InvalidData, InvalidGeoJson, ST_GeomFromGeoJSON, ST_SetSRID, timestamp, NotFound
from server.models.dtos.priority_dto import PriorityDTO, PriorityListDTO


class Priority(db.Model):
    """ Describes a priority dataset """
    __tablename__ = "priorities"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey('projects.id', name='fk_priority_project'))
    name = db.Column(db.String, nullable=False)
    geometry = db.Column(Geometry('GEOMETRY', srid=4326))
    uploaded_by = db.Column(db.BigInteger, db.ForeignKey('users.id', name='fk_users_uploader'))
    uploaded_on = db.Column(db.DateTime, default=timestamp, nullable=False)
    filesize = db.Column(db.Integer, default=0)
    uploader = db.relationship(User)

    def create(self):
        """ Creates and saves the current model to the DB """
        db.session.add(self)
        db.session.commit()

    def update(self):
        """ Updates the DB with the current state of the Task """
        db.session.commit()

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def get(priority_id: int):
        """
        Gets specified priority
        :param priority_id: priority ID in scope
        :return: Priority if found otherwise None
        """
        return Priority.query.get(priority_id)

    @staticmethod
    def get_all(project_id: int) -> PriorityListDTO:
        """ Gets all priorities currently stored """
        if project_id:
            results = Priority.query.filter(Priority.project_id == project_id).all()
        else:
            results = Priority.query.all()

        if len(results) == 0:
            raise NotFound()

        dto = PriorityListDTO()
        for result in results:
            priority = PriorityDTO()
            priority.priority_id = result.id
            priority.project_id = result.project_id
            priority.name = result.name
            priority.filesize = result.filesize
            priority.uploaded_by = result.uploader.username if result.uploader else None
            priority.uploaded_on = result.uploaded_on
            dto.priorities.append(priority)

        return dto

    @staticmethod
    def check_available(priority_list):
        if not priority_list: return False
        priority_ids = list(map(lambda x: x[0], priority_list))
        if len(priority_ids ) > 0:
            total = Priority.query.filter(Priority.id.in_(priority_ids)).count()
            return total == len(priority_list)
        return False
