from backend import db
import json
from backend.exceptions import NotFound
from backend.models.dtos.partner_dto import PartnerDTO


class Partner(db.Model):
    """Model for Partners"""

    __tablename__ = "partners"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=False, unique=True)
    primary_hashtag = db.Column(db.String(200), nullable=False)
    secondary_hashtag = db.Column(db.String(200))
    logo_url = db.Column(db.String(500))
    link_meta = db.Column(db.String(300))
    link_x = db.Column(db.String(300))
    link_instagram = db.Column(db.String(300))
    current_projects = db.Column(db.String)
    permalink = db.Column(db.String(500), unique=True)
    website_links = db.Column(db.String)

    def create(self):
        """Creates and saves the current model to the DB"""
        db.session.add(self)
        db.session.commit()

    def save(self):
        """Save changes to DB"""
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
    def get_by_permalink(permalink: str):
        """Get partner by permalink"""
        return Partner.query.filter_by(permalink=permalink).one_or_none()

    @staticmethod
    def get_by_id(partner_id: int):
        """Get partner by id"""
        partner = db.session.get(Partner, partner_id)
        if partner is None:
            raise NotFound(sub_code="PARTNER_NOT_FOUND", partner_id=partner_id)
        return partner

    def as_dto(self) -> PartnerDTO:
        """Creates partner from DTO"""
        partner_dto = PartnerDTO()
        partner_dto.id = self.id
        partner_dto.name = self.name
        partner_dto.primary_hashtag = self.primary_hashtag
        partner_dto.secondary_hashtag = self.secondary_hashtag
        partner_dto.logo_url = self.logo_url
        partner_dto.link_x = self.link_x
        partner_dto.link_meta = self.link_meta
        partner_dto.link_instagram = self.link_instagram
        partner_dto.current_projects = self.current_projects
        partner_dto.permalink = self.permalink
        partner_dto.website_links = json.loads(self.website_links)

        return partner_dto
