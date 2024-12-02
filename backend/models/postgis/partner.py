import json

from databases import Database
from sqlalchemy import Column, Integer, String

from backend import db
from backend.db import Base
from backend.exceptions import NotFound
from backend.models.dtos.partner_dto import PartnerDTO
from typing import Optional


class Partner(Base):
    """Describes a Partner"""

    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False, unique=True)
    primary_hashtag = Column(String(200), nullable=False)
    secondary_hashtag = Column(String(200), nullable=True)
    logo_url = Column(String(500), nullable=True)
    link_meta = Column(String(300), nullable=True)
    link_x = Column(String(300), nullable=True)  # Formerly link_twitter
    link_instagram = Column(String(300), nullable=True)
    current_projects = Column(String, nullable=True)
    permalink = Column(String(500), unique=True, nullable=True)
    website_links = Column(String, nullable=True)
    mapswipe_group_id = Column(String, nullable=True)

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
    async def get_all_partners(db: Database):
        """
        Retrieve all partner IDs
        """
        query = "SELECT id FROM partners"
        results = await db.fetch_all(query)
        return [row["id"] for row in results]

    @staticmethod
    async def get_by_permalink(permalink: str, db: Database) -> Optional[PartnerDTO]:
        """Get partner by permalink using raw SQL."""
        query = "SELECT * FROM partners WHERE permalink = :permalink"
        result = await db.fetch_one(query, values={"permalink": permalink})
        if result is None:
            raise NotFound(sub_code="PARTNER_NOT_FOUND", permalink=permalink)
        return result

    @staticmethod
    async def get_by_id(partner_id: int, db: Database) -> PartnerDTO:
        query = "SELECT * FROM partners WHERE id = :partner_id"
        result = await db.fetch_one(query, values={"partner_id": partner_id})
        if result is None:
            raise NotFound(sub_code="PARTNER_NOT_FOUND", partner_id=partner_id)
        return result

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
        partner_dto.mapswipe_group_id = self.mapswipe_group_id

        return partner_dto
