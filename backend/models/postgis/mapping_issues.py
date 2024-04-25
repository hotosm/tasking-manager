from sqlalchemy import Column, Integer, String, Boolean
from backend.models.dtos.mapping_issues_dto import (
    MappingIssueCategoryDTO,
    MappingIssueCategoriesDTO,
)
from backend.db import Base, get_session
session = get_session()

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
    def get_by_id(category_id: int):
        """Get category by id"""
        return session.get(MappingIssueCategory, category_id)

    @classmethod
    def create_from_dto(cls, dto: MappingIssueCategoryDTO) -> int:
        """Creates a new MappingIssueCategory class from dto"""
        new_category = cls(dto.name)
        new_category.description = dto.description

        session.add(new_category)
        session.commit()

        return new_category.id

    def update_category(self, dto: MappingIssueCategoryDTO):
        """Update existing category"""
        self.name = dto.name
        self.description = dto.description
        if dto.archived is not None:
            self.archived = dto.archived
        session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()

    @staticmethod
    def get_all_categories(include_archived):
        category_query = MappingIssueCategory.query.order_by(MappingIssueCategory.name)
        if not include_archived:
            category_query = category_query.filter_by(archived=False)

        results = category_query.all()

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
