from databases import Database

from backend.exceptions import NotFound
from backend.models.postgis.mapping_issues import MappingIssueCategory
from backend.models.dtos.mapping_issues_dto import MappingIssueCategoryDTO


class MappingIssueCategoryService:
    @staticmethod
    async def get_mapping_issue_category(
        category_id: int, db: Database
    ) -> MappingIssueCategory:
        """
        Get MappingIssueCategory from DB
        :raises: NotFound
        """
        category = await MappingIssueCategory.get_by_id(category_id, db)

        if category is None:
            raise NotFound(sub_code="ISSUE_CATEGORY_NOT_FOUND", category_id=category_id)

        return category

    @staticmethod
    async def get_mapping_issue_category_as_dto(
        category_id: int, db: Database
    ) -> MappingIssueCategoryDTO:
        """Get MappingIssueCategory from DB"""
        category = await MappingIssueCategoryService.get_mapping_issue_category(
            category_id, db
        )
        return MappingIssueCategory.as_dto(category)

    @staticmethod
    async def create_mapping_issue_category(
        category_dto: MappingIssueCategoryDTO, db: Database
    ) -> int:
        """Create MappingIssueCategory in DB"""
        new_mapping_issue_category_id = await MappingIssueCategory.create_from_dto(
            category_dto, db
        )
        return new_mapping_issue_category_id

    @staticmethod
    async def update_mapping_issue_category(
        category_dto: MappingIssueCategoryDTO, db: Database
    ) -> MappingIssueCategoryDTO:
        """Create MappingIssueCategory in DB"""
        category = await MappingIssueCategoryService.get_mapping_issue_category(
            category_dto.category_id, db
        )
        await MappingIssueCategory.update_category(category, category_dto, db)
        return MappingIssueCategory.as_dto(category)

    @staticmethod
    async def delete_mapping_issue_category(category_id: int, db: Database):
        """Delete specified license"""
        category = await MappingIssueCategoryService.get_mapping_issue_category(
            category_id, db
        )
        await MappingIssueCategory.delete(category, db)

    @staticmethod
    async def get_all_mapping_issue_categories(include_archived, db):
        """Get all mapping issue categories"""
        return await MappingIssueCategory.get_all_categories(include_archived, db)
