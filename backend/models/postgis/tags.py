from databases import Database
from sqlalchemy import Column, Integer, String

from backend.db import Base
from backend.models.dtos.tags_dto import TagsDTO


class Tags(Base):
    """Describes an individual mapping Task"""

    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)
    organisations = Column(String, unique=True)
    campaigns = Column(String, unique=True)

    @staticmethod
    async def upsert_organisation_tag(organisation_tag: str, db: Database) -> str:
        """Insert organisation tag if it doesn't exist otherwise return matching tag"""
        # Try to find existing tag
        query = """
        SELECT organisations FROM tags
        WHERE organisations = :tag
        LIMIT 1
        """
        existing_tag = await db.fetch_one(query=query, values={"tag": organisation_tag})

        if existing_tag:
            return existing_tag["organisations"]

        # Insert new tag
        query = """
        INSERT INTO tags (organisations)
        VALUES (:tag)
        RETURNING organisations
        """
        await db.execute(query=query, values={"tag": organisation_tag})
        return organisation_tag

    @staticmethod
    async def upsert_campaign_tag(campaign_tag: str, db: Database) -> str:
        """Insert campaign tag if doesn't exist otherwise return matching tag"""
        # Try to find existing tag
        query = """
        SELECT campaigns FROM tags
        WHERE campaigns = :tag
        LIMIT 1
        """
        existing_tag = await db.fetch_one(query=query, values={"tag": campaign_tag})

        if existing_tag:
            return existing_tag["campaigns"]

        # Insert new tag
        query = """
        INSERT INTO tags (campaigns)
        VALUES (:tag)
        RETURNING campaigns
        """
        await db.execute(query=query, values={"tag": campaign_tag})
        return campaign_tag

    @staticmethod
    async def get_all_organisations(db: Database) -> TagsDTO:
        """Get all org tags in DB"""
        query = """
        SELECT organisations FROM tags
        WHERE organisations IS NOT NULL
        """
        results = await db.fetch_all(query=query)

        dto = TagsDTO()
        dto.tags = [row["organisations"] for row in results]
        return dto

    @staticmethod
    async def get_all_campaigns(db: Database) -> TagsDTO:
        """Get all campaign tags in DB"""
        query = """
        SELECT campaigns FROM tags
        WHERE campaigns IS NOT NULL
        """
        results = await db.fetch_all(query=query)

        dto = TagsDTO()
        dto.tags = [row["campaigns"] for row in results]
        return dto
