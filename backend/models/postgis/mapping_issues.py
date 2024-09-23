from databases import Database
from sqlalchemy import Column, Integer, String, Boolean, select, insert, delete, update

from backend.db import Base
from backend.models.dtos.mapping_issues_dto import (
    MappingIssueCategoryDTO,
    MappingIssueCategoriesDTO,
)


class MappingIssueCategory(Base):
    """Represents a category of task mapping issues identified during validaton"""

    __tablename__ = "mapping_issue_categories"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    archived = Column(Boolean, default=False, nullable=False)

    def __init__(self, name):
        self.name = name

    @staticmethod
    async def get_by_id(category_id: int, db: Database):
        """Get category by id"""
        query = select(MappingIssueCategory).where(
            MappingIssueCategory.id == category_id
        )
        return await db.fetch_one(query)

    @classmethod
    async def create_from_dto(cls, dto: MappingIssueCategoryDTO, db: Database) -> int:
        """Creates a new MappingIssueCategory class from dto"""
        new_category = cls(dto.name)
        new_category.description = dto.description

        query = insert(MappingIssueCategory.__table__).values(
            name=new_category.name,
            description=new_category.description,
            archived=dto.archived,
        )
        result = await db.execute(query)
        return result

    async def update_category(self, dto: MappingIssueCategoryDTO, db: Database):
        """Update existing category"""
        self.name = dto.name
        self.description = dto.description
        if dto.archived is not None:
            self.archived = dto.archived
        query = (
            update(MappingIssueCategory.__table__)
            .where(
                MappingIssueCategory.id == self.id,
            )
            .values(
                name=self.name, description=self.description, archived=self.archived
            )
        )
        await db.execute(query)

    async def delete(self, db: Database):
        """Deletes the current model from the DB"""
        query = delete(MappingIssueCategory.__table__).where(
            MappingIssueCategory.id == self.id
        )
        await db.execute(query)

    @staticmethod
    async def get_all_categories(include_archived, db):
        query = select(MappingIssueCategory).order_by(MappingIssueCategory.name)

        # Apply condition if archived records are to be excluded
        if not include_archived:
            query = query.where(MappingIssueCategory.archived == False)

        results = await db.fetch_all(query)

        dto = MappingIssueCategoriesDTO()
        for result in results:
            category = MappingIssueCategoryDTO()
            category.category_id = result.id
            category.name = result.name
            category.description = result.description
            category.archived = result.archived
            dto.categories.append(category)

        return dto

    def as_dto(self) -> MappingIssueCategoryDTO:
        """Convert the category to its DTO representation"""
        dto = MappingIssueCategoryDTO()
        dto.category_id = self.id
        dto.name = self.name
        dto.description = self.description
        dto.archived = self.archived

        return dto
