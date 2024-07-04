from flask import current_app
from backend.exceptions import NotFound
from backend.models.postgis.project_partner import ProjectPartnership
from backend.models.dtos.project_partner_dto import ProjectPartnershipDTO

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
