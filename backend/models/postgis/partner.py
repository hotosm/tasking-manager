from backend import db
import json
from backend.exceptions import NotFound
from backend.models.dtos.partner_dto import (
    PartnerDTO,
    UpdatePartnerDTO
)
from backend.models.postgis.statuses import (
    PartnerRole
)


class Partner(db.Model):
    __tablename__ = "partners"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.Integer, default=1, nullable=False)
    primary_hashtag = db.Column(db.String(50), nullable=False)
    secondary_hashtag = db.Column(db.String(50), nullable=False)
    logo_url = db.Column(db.String(100))
    link_meta = db.Column(db.String(50), nullable=False)
    link_x = db.Column(db.String(50), nullable=False)
    link_instagram = db.Column(db.String(50), nullable=False)
    current_projects = db.Column(db.String, nullable=False)
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
        self.primary_hashtag = dto.primary_hashtag if dto.primary_hashtag else self.primary_hashtag
        self.secondary_hashtag = dto.secondary_hashtag if dto.secondary_hashtag else self.secondary_hashtag
        self.logo_url = dto.logo_url if dto.logo_url else self.logo_url
        self.link_x = dto.link_x if dto.link_x else self.link_x
        self.link_meta = dto.link_meta if dto.link_meta else self.link_meta
        self.link_instagram = dto.link_instagram if dto.link_instagram else self.link_instagram
        self.current_projects = dto.current_projects if dto.current_projects else self.current_projects
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
    
    def set_user_role(self, role: PartnerRole):
        """Sets the supplied role on the partner"""
        self.role = role.value
        db.session.commit()

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
        partner_dto.role = PartnerRole(self.role).name
        partner_dto.primary_hashtag = self.primary_hashtag
        partner_dto.secondary_hashtag = self.secondary_hashtag
        partner_dto.logo_url = self.logo_url
        partner_dto.link_x = self.link_x 
        partner_dto.link_meta = self.link_meta
        partner_dto.link_instagram = self.link_instagram
        partner_dto.current_projects = self.current_projects
        partner_dto.website_links = json.loads(self.website_links_json)

        return partner_dto
