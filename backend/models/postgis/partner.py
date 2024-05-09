from backend import db
import json
from backend.exceptions import NotFound
from backend.models.dtos.partner_dto import (
    PartnerDTO
)


class Partner(db.Model):
    __tablename__ = "partners"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), nullable=False)
    primary_hashtag = db.Column(db.String(50), nullable=False)
    secondary_hashtag = db.Column(db.String(50))
    logo_url = db.Column(db.String(100))
    link_meta = db.Column(db.String(50))
    link_x = db.Column(db.String(50))
    link_instagram = db.Column(db.String(50))
    current_projects = db.Column(db.String)
    website_links = db.Column(db.String)

    def as_dict(self):
        website_links = json.loads(self.website_links)
        return {
            "id": self.id,
            "name": self.name,
            "primary_hashtag": self.primary_hashtag,
            "secondary_hashtag": self.secondary_hashtag,
            "logo_url": self.logo_url,
            "link_meta": self.link_meta,
            "link_x": self.link_x,
            "link_instagram": self.link_instagram,
            "current_projects": self.current_projects,
            "website_links": website_links
        }

    def create(self):
        """Creates and saves the current model to the DB"""
        db.session.add(self)
        db.session.commit()

    def save(self):
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
    def get_by_id(partner_id: int):
        """Get partner by id"""

        partner = db.session.get(Partner, partner_id)

        if partner is None:
            raise NotFound(sub_code="PARTNER_NOT_FOUND", partner_id=partner_id) 
        
        return partner
    
    def as_dto(self) -> PartnerDTO:
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
        
        website_links = json.loads(self.website_links)
        partner_dto.website_links = [{"name": link['name'], "url": link['url']} for link in website_links]

        return partner_dto
