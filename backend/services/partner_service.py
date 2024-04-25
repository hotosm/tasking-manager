from backend import db
import json
from backend.exceptions import NotFound
from backend.models.dtos.partner_dto import (
    PartnerDTO,
    PartnerListDTO
)
from backend.models.postgis.partner import (
    Partner
)


class PartnerService:
    @staticmethod
    def get_partner(partner_id: int) -> Partner:
        """Gets the specified partner"""
        partner = db.session.get(Partner, partner_id)
        if partner is None:
            raise NotFound(sub_code="PARTNER_NOT_FOUND", partner_id=partner_id)
        return partner

    @staticmethod
    def get_partner_by_name(partner_name: str) -> Partner:
        partner = Partner.query.filter_by(name=partner_name).first()
        if partner is None:
            raise NotFound(sub_code="PARTNER_NOT_FOUND", partner_name=partner_name)
        return partner

    @staticmethod
    def get_all_partners() -> PartnerListDTO:
        """Returns all partners"""
        query = Partner.query.order_by(Partner.name)
        partners = query.all()
        return PartnerListDTO(partners=partners)
    
    @staticmethod
    def create_partner(partner_dto: PartnerDTO):
        """Create Partner in DB"""
        partner = Partner(
            name=partner_dto.name,
            primary_hashtag=partner_dto.primary_hashtag,
            secondary_hashtag=partner_dto.secondary_hashtag,
            link_x=partner_dto.link_x,
            link_meta=partner_dto.link_meta,
            link_instagram=partner_dto.link_instagram,
            logo_url=partner_dto.logo_url,
            social_media_links_json=json.dumps(partner_dto.website_links)
        )
        partner.create()
        return partner.id

    @staticmethod
    def delete_partner(partner_id: int):
        """Delete partner for a project"""
        partner = db.session.get(Partner, partner_id)
        partner.delete()

    @staticmethod
    def get_partner_as_dto(partner_id: int, user_id: int):
        """Gets the specified partner"""
        partner = PartnerService.get_partner(partner_id)

        partner_dto = PartnerDTO(
            id=partner.id,
            name=partner.name,
            primary_hashtag=partner.primary_hashtag,
            secondary_hashtag=partner.secondary_hashtag,
            link_x=partner.link_x,
            link_meta=partner.link_meta,
            link_instagram=partner.link_instagram,
            logo_url=partner.logo_url,
            website_links=partner.website_links
        )
        return partner_dto

    @staticmethod
    def update_partner(partner_dto: PartnerDTO, partner_id: int):
        partner = PartnerService.get_partner(partner_id)
        partner.name = partner_dto.name
        partner.primary_hashtag = partner_dto.primary_hashtag
        partner.secondary_hashtag = partner_dto.secondary_hashtag
        partner.link_x = partner_dto.link_x
        partner.link_meta = partner_dto.link_meta
        partner.link_instagram = partner_dto.link_instagram
        partner.logo_url = partner_dto.logo_url
        db.session.commit()
        return partner