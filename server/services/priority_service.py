import json

import geojson
from flask import current_app

from server.models.dtos.priority_dto import PriorityDTO, PriorityListDTO
from server.models.postgis.priority import Priority
from server.models.postgis.utils import NotFound


class PriorityService:
    @staticmethod
    def save_priority(priority_dto: PriorityDTO) -> Priority:
        """
        Validates and then persists draft projects in the DB
        :param draft_project_dto: Draft Project DTO with data from API
        :raises InvalidGeoJson
        :returns ID of new draft project
        """
        priority = Priority()
        priority.name = priority_dto.name
        priority.filesize = priority_dto.filesize
        priority.uploaded_by = priority_dto.uploaded_by
        priority.geometry = priority_dto.geometry

        priority.create()
        return priority

    @staticmethod
    def delete_priority(priority_id: int):
        """ Deletes project if it has no completed tasks """
        priority = PriorityService._get_priority_by_id(priority_id)
        priority.delete()

    @staticmethod
    def get_all_priorities() -> PriorityListDTO:
        """ Get all licenses in DB """
        return Priority.get_all()

    @staticmethod
    def _get_priority_by_id(priority_id: int) -> Priority:
        priority = Priority.get(priority_id)

        if priority is None:
            raise NotFound()

        return priority