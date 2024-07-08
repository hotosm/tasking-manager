from flask import current_app
from backend.exceptions import NotFound, BadRequest
from backend.models.postgis.project_partner import (
    ProjectPartnership,
    ProjectPartnershipHistory,
    ProjectPartnerAction,
)
from backend.models.dtos.project_partner_dto import ProjectPartnershipDTO

from backend.models.postgis.partner import Partner

from typing import List, Optional
import datetime


class ProjectPartnershipServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling project partnerships"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class ProjectPartnershipService:
    @staticmethod
    def get_partnership_as_dto(partnership_id: int) -> ProjectPartnershipDTO:
        partnership = ProjectPartnership.get_by_id(partnership_id)
        if partnership is None:
            raise NotFound(
                sub_code="PARTNERSHIP_NOT_FOUND", partnership_id=partnership_id
            )

        partnership_dto = ProjectPartnershipDTO()
        partnership_dto.id = partnership.id
        partnership_dto.project_id = partnership.project_id
        partnership_dto.partner_id = partnership.partner_id
        partnership_dto.started_on = partnership.started_on
        partnership_dto.ended_on = partnership.ended_on
        return partnership_dto

    @staticmethod
    def get_partnerships_by_project(project_id: int) -> List[ProjectPartnershipDTO]:
        partnerships = ProjectPartnership.query.filter(
            ProjectPartnership.project_id == project_id
        ).all()

        return list(
            map(lambda partnership: partnership.as_dto().to_primitive(), partnerships)
        )

    @staticmethod
    def create_partnership(
        project_id: int,
        partner_id: int,
        started_on: Optional[datetime.datetime],
        ended_on: Optional[datetime.datetime],
    ) -> int:
        partnership = ProjectPartnership()
        partnership.project_id = project_id
        partnership.partner_id = partner_id
        partnership.started_on = started_on
        partnership.ended_on = ended_on

        if (
            partnership.ended_on is not None
            and partnership.started_on > partnership.ended_on
        ):
            raise BadRequest(
                sub_code="INVALID_TIME_RANGE",
                message=f"Partnership started on {partnership.started_on} but ended at a previous time: {partnership.ended_on}",
                started_on=partnership.started_on,
                ended_on=partnership.ended_on,
            )

        partnership_id = partnership.create()

        partnership_history = ProjectPartnershipHistory()
        partnership_history.partnership_id = partnership_id
        partnership_history.project_id = project_id
        partnership_history.partner_id = partner_id
        partnership_history.started_on_new = partnership.started_on
        partnership_history.ended_on_new = partnership.ended_on
        partnership_history.create()

        return partnership_id

    @staticmethod
    def update_partnership_time_range(
        partnership_id: int,
        started_on: Optional[datetime.datetime],
        ended_on: Optional[datetime.datetime],
    ) -> ProjectPartnership:
        partnership = ProjectPartnership.get_by_id(partnership_id)
        if partnership is None:
            raise NotFound(
                sub_code="PARTNERSHIP_NOT_FOUND", partnership_id=partnership_id
            )

        if (started_on is not None or ended_on is not None) and (
            started_on != partnership.started_on or ended_on != partnership.ended_on
        ):
            partnership_history = ProjectPartnershipHistory()
            partnership_history.partnership_id = partnership.id
            partnership_history.project_id = partnership.project_id
            partnership_history.partner_id = partnership.partner_id
            partnership_history.action = ProjectPartnerAction.UPDATE.value

            if started_on is not None and started_on != partnership.started_on:
                partnership_history.started_on_old = partnership.started_on
                partnership_history.started_on_new = started_on
                partnership.started_on = started_on

            if ended_on is not None and ended_on != partnership.ended_on:
                partnership_history.ended_on_old = partnership.ended_on
                partnership_history.ended_on_new = ended_on
                partnership.ended_on = ended_on

            if (
                partnership.ended_on is not None
                and partnership.started_on > partnership.ended_on
            ):
                raise BadRequest(
                    sub_code="INVALID_TIME_RANGE",
                    message=f"Partnership started on {partnership.started_on} but ended at a previous time: {partnership.ended_on}",
                    started_on=partnership.started_on,
                    ended_on=partnership.ended_on,
                )

            partnership.save()
            partnership_history.create()

        return partnership

    @staticmethod
    def delete_partnership(partnership_id: int):
        partnership = ProjectPartnership.get_by_id(partnership_id)
        if partnership is None:
            raise NotFound(
                sub_code="PARTNERSHIP_NOT_FOUND", partnership_id=partnership_id
            )

        partnership_history = ProjectPartnershipHistory()
        partnership_history.partnership_id = partnership_id
        partnership_history.project_id = partnership.project_id
        partnership_history.partner_id = partnership.partner_id
        partnership_history.started_on_old = partnership.started_on
        partnership_history.ended_on_old = partnership.ended_on
        partnership_history.action = ProjectPartnerAction.DELETE.value
        partnership_history.create()

        partnership.delete()

    @staticmethod
    def get_partners_by_project(project_id: int) -> List[Partner]:
        return ProjectPartnership.query.filter(project_id=project_id).all()
