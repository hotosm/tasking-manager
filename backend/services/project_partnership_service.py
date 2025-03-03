# from flask import current_app
import datetime
from typing import List, Optional

from databases import Database
from loguru import logger

from backend.exceptions import BadRequest, NotFound
from backend.models.dtos.project_partner_dto import ProjectPartnershipDTO
from backend.models.postgis.partner import Partner
from backend.models.postgis.project_partner import ProjectPartnerAction, ProjectPartnership, ProjectPartnershipHistory


class ProjectPartnershipServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling project partnerships"""

    def __init__(self, message):
        logger.debug(message)


class ProjectPartnershipService:
    @staticmethod
    async def get_partnership_as_dto(partnership_id: int, db: Database) -> ProjectPartnershipDTO:
        partnership = await ProjectPartnership.get_by_id(partnership_id, db)
        if partnership is None:
            raise NotFound(sub_code="PARTNERSHIP_NOT_FOUND", partnership_id=partnership_id)

        partnership_dto = ProjectPartnershipDTO(
            id=partnership.id,
            project_id=partnership.project_id,
            partner_id=partnership.partner_id,
            started_on=partnership.started_on,
            ended_on=partnership.ended_on,
        )
        return partnership_dto

    @staticmethod
    async def get_partnerships_by_project(project_id: int, db: Database) -> List[ProjectPartnershipDTO]:
        """
        Retrieves all partnerships for a specific project ID.
        """
        query = """
            SELECT id, project_id, partner_id, started_on, ended_on
            FROM project_partnerships
            WHERE project_id = :project_id
        """
        rows = await db.fetch_all(query, values={"project_id": project_id})
        return [ProjectPartnershipDTO(**row) for row in rows]

    @staticmethod
    async def create_partnership(
        db: Database,
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

        if partnership.ended_on is not None and partnership.started_on > partnership.ended_on:
            raise BadRequest(
                sub_code="INVALID_TIME_RANGE",
                message="Partnership cannot end before it started.",
                started_on=partnership.started_on,
                ended_on=partnership.ended_on,
            )

        partnership_id = await partnership.create(db)

        partnership_history = ProjectPartnershipHistory()
        partnership_history.partnership_id = partnership_id
        partnership_history.project_id = project_id
        partnership_history.partner_id = partner_id
        partnership_history.started_on_new = partnership.started_on
        partnership_history.ended_on_new = partnership.ended_on
        await partnership_history.create(db)

        return partnership_id

    @staticmethod
    async def update_partnership_time_range(
        db: Database,
        partnership_id: int,
        started_on: Optional[datetime.datetime],
        ended_on: Optional[datetime.datetime],
    ) -> ProjectPartnership:
        partnership_record = await ProjectPartnership.get_by_id(partnership_id, db)
        partnership = ProjectPartnership(**partnership_record)
        if partnership is None:
            raise NotFound(sub_code="PARTNERSHIP_NOT_FOUND", partnership_id=partnership_id)

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

            if partnership.ended_on is not None and partnership.started_on > partnership.ended_on:
                raise BadRequest(
                    sub_code="INVALID_TIME_RANGE",
                    message="Partnership cannot end before it started.",
                    started_on=partnership.started_on,
                    ended_on=partnership.ended_on,
                )

            await partnership.save(db)
            await partnership_history.create(db)

        return partnership

    @staticmethod
    async def delete_partnership(partnership_id: int, db: Database):
        partnership_record = await ProjectPartnership.get_by_id(partnership_id, db)
        partnership = ProjectPartnership(**partnership_record)
        if partnership is None:
            raise NotFound(sub_code="PARTNERSHIP_NOT_FOUND", partnership_id=partnership_id)

        partnership_history = ProjectPartnershipHistory()
        partnership_history.partnership_id = partnership_id
        partnership_history.project_id = partnership.project_id
        partnership_history.partner_id = partnership.partner_id
        partnership_history.started_on_old = partnership.started_on
        partnership_history.ended_on_old = partnership.ended_on
        partnership_history.action = ProjectPartnerAction.DELETE.value
        await partnership_history.create(db)
        await partnership.delete(db)

    @staticmethod
    def get_partners_by_project(project_id: int) -> List[Partner]:
        return ProjectPartnership.query.filter(project_id=project_id).all()
