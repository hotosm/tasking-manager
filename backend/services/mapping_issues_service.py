from backend.exceptions import NotFound
from backend.models.postgis.mapping_issues import MappingIssueCategory
from backend.models.dtos.mapping_issues_dto import MappingIssueCategoryDTO


class MappingIssueCategoryService:
    @staticmethod
    def get_mapping_issue_category(category_id: int) -> MappingIssueCategory:
        """
        Get MappingIssueCategory from DB
        :raises: NotFound
        """
        category = MappingIssueCategory.get_by_id(category_id)

        if category is None:
            raise NotFound(sub_code="ISSUE_CATEGORY_NOT_FOUND", category_id=category_id)

        return category

    @staticmethod
    def get_mapping_issue_category_as_dto(category_id: int) -> MappingIssueCategoryDTO:
        """Get MappingIssueCategory from DB"""
        category = MappingIssueCategoryService.get_mapping_issue_category(category_id)
        return category.as_dto()

    @staticmethod
    def create_mapping_issue_category(category_dto: MappingIssueCategoryDTO) -> int:
        """Create MappingIssueCategory in DB"""
        new_mapping_issue_category_id = MappingIssueCategory.create_from_dto(
            category_dto
        )
        return new_mapping_issue_category_id

    @staticmethod
    def update_mapping_issue_category(
        category_dto: MappingIssueCategoryDTO,
    ) -> MappingIssueCategoryDTO:
        """Create MappingIssueCategory in DB"""
        category = MappingIssueCategoryService.get_mapping_issue_category(
            category_dto.category_id
        )
        category.update_category(category_dto)
        return category.as_dto()

    @staticmethod
    def delete_mapping_issue_category(category_id: int):
        """Delete specified license"""
        category = MappingIssueCategoryService.get_mapping_issue_category(category_id)
        category.delete()

    @staticmethod
    def get_all_mapping_issue_categories(include_archived):
        """Get all mapping issue categories"""
        return MappingIssueCategory.get_all_categories(include_archived)
