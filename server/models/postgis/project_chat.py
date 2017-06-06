from flask import current_app
from sqlalchemy.dialects.postgresql import TSVECTOR
from typing import List
from server import db
from server.models.postgis.utils import timestamp
from server.models.dtos.project_dto import ProjectInfoDTO


class ProjectChat(db.Model):
    """ Contains all project info localized into supported languages """
    __tablename__ = 'project_chat'
    id = db.Column(db.BigInteger, primary_key=True)
    project_id = db.Column(db.Integer, index=True, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    time_stamp = db.Column(db.DateTime, nullable=False, default=timestamp)
    message = db.String(db.String, length=250, nullable=False)

