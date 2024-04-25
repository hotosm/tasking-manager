from backend import db
import json
from backend.models.dtos.partner_dto import (
    PartnerDTO,
    UpdatePartnerDTO
)
from backend.models.dtos.partner_dto import PartnerDTO, PartnerListDTO


class Partner(db.Model):
    __tablename__ = "partners"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), nullable=False)
    primary_hashtag = db.Column(db.String(50), nullable=False)
    secondary_hashtag = db.Column(db.String(50), nullable=False)
    logo_url = db.Column(db.String(100))
    link_meta = db.Column(db.String(50), nullable=False)
    link_x = db.Column(db.String(50), nullable=False)
    link_instagram = db.Column(db.String(50), nullable=False)
    website_links_json = db.Column(db.String)

    def create(self):
        """Creates and saves the current model to the DB"""
        db.session.add(self)
        db.session.commit()

    def save(self):
        db.session.commit()

    def update_from_dto(self, dto: UpdatePartnerDTO):
        """Updates the current model in the DB"""
        self.name = dto.name if dto.name else self.name
        self.logo_url = dto.logo_url if dto.logo_url else self.logo_url
        self.link_x = dto.link_x if dto.link_x else self.link_x
        self.link_meta = dto.link_meta if dto.link_meta else self.link_meta
        self.link_instagram = dto.link_instagram if dto.link_instagram else self.link_instagram
        self.website_links_json = json.dumps(dto.website_links)
        db.session.commit()

    def delete(self):
        """Deletes from the DB"""
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def get_all_partners():
        """Get all partners in DB"""
        return db.session.query(Partner.id).all()

    @staticmethod
    def get_by_name(name: str):
        """Return the user for the specified username, or None if not found"""
        return Partner.query.filter_by(name=name).one_or_none()


    @staticmethod
    def partner_list_as_dto(partners):
        """Converts a collection of partners into DTO"""
        partner_list_dto = PartnerListDTO()
        for partner in partners:
            partner_dto = PartnerDTO()
            partner_dto.id = partner.id
            partner_dto.name = partner.name

            partner_list_dto.partners.append(partner_dto)

        return partner_list_dto