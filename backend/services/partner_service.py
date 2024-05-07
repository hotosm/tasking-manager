from flask import current_app
from backend import db
import json
from backend.exceptions import NotFound
from backend.models.dtos.partner_dto import (
    PartnerDTO,
    UpdatePartnerDTO
)
from backend.models.postgis.partner import (
    Partner,
    PartnerRole
)


class PartnerServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling partners"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)

class PartnerService:
    @staticmethod
    def get_partner_by_id(partner_id: int) -> Partner:
        partner = Partner.get_by_id(partner_id)

        if partner is None:
            raise NotFound(
                sub_code="PARTNER_NOT_FOUND", partner_id=partner_id
            )        
        return partner
    
    @staticmethod
    def get_partner_by_name(name: str) -> Partner:
        partner = Partner.get_by_name(name)

        if partner is None:
            raise NotFound(sub_code="PARTNER_NOT_FOUND", name=name)

        return partner
    
    @staticmethod
    def create_partner(data):
        """Create a new partner in database"""
        new_partner = Partner(
            name=data.get("name"),
            primary_hashtag=data.get("primary_hashtag"),
            secondary_hashtag=data.get("secondary_hashtag"),
            logo_url=data.get("logo_url"),
            link_meta=data.get("link_meta"),
            link_x=data.get("link_x"),
            link_instagram=data.get("link_instagram"),
            current_projects=data.get("current_projects"),
            website_links_json=json.dumps(data.get("website_links"))
        )
        new_partner.create()
        return new_partner

    @staticmethod
    def update_partner(partner_id: int, data: dict):
        partner = Partner.get_by_id(partner_id)
        if partner is None:
            raise NotFound(sub_code="PARTNER_NOT_FOUND", partner_id=partner_id)
        
        partner.update_from_dto(UpdatePartnerDTO(data))

    @staticmethod
    def delete_partner(partner_id: int):
        partner = Partner.get_by_id(partner_id)

        if partner:
            partner.delete()
            return {"Success": "Team deleted"}, 200
        else:
            return {
                "Error": "Partner cannot be deleted",
            }, 400

    @staticmethod
    def get_partner_dto_by_id(partner: int, request_partner: int) -> PartnerDTO:
        partner = PartnerService.get_partner_by_id(partner)
        if request_partner:
            request_name = PartnerService.get_partner_by_id(request_partner).name
            return partner.as_dto(request_name)
        return partner.as_dto()

    @staticmethod
    def get_all_partners():
        """Get all partners"""
        return Partner.get_all_partners()
    
    @staticmethod
    def is_partner_an_admin(partner_id: int) -> bool:
        """Is the partner an admin"""
        partner = PartnerService.get_partner_by_id(partner_id)
        if PartnerRole(partner.role) == PartnerRole.ADMIN:
            return True

        return False
    
    @staticmethod
    def is_partner_validator(partner_id: int) -> bool:
        """Determines if partner is a validator"""
        partner = PartnerService.get_partner_by_id(partner_id)
        if PartnerRole(partner.role) in [
            PartnerRole.ADMIN,
        ]:
            return True

        return False