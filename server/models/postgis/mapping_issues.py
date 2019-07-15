from server import db
from server.models.dtos.mapping_issues_dto import MappingIssueCategoryDTO, MappingIssueCategoriesDTO

class MappingIssueCategory(db.Model):
    """ Represents a category of task mapping issues identified during validaton """
    __tablename__ = "mapping_issue_categories"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True)
    description = db.Column(db.String, nullable=True)
    archived = db.Column(db.Boolean, default=False, nullable=False)

    def __init__(self, name):
        self.name = name

    @staticmethod
    def get_by_id(category_id: int):
        """ Get category by id """
        return MappingIssueCategory.query.get(category_id)

    @classmethod
    def create_from_dto(cls, dto: MappingIssueCategoryDTO) -> int:
        """ Creates a new MappingIssueCategory class from dto """
        new_category = cls(dto.name)
        new_category.description = dto.description

        db.session.add(new_category)
        db.session.commit()

        return new_category.id

    def update_category(self, dto: MappingIssueCategoryDTO):
        """ Update existing category """
        self.name = dto.name
        self.description = dto.description
        if dto.archived is not None:
            self.archived = dto.archived
        db.session.commit()

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def get_all_categories(include_archived):
        category_query = MappingIssueCategory.query.order_by(MappingIssueCategory.name)
        if not include_archived:
          category_query = category_query.filter_by(archived=False)

        results = category_query.all()
        if len(results) == 0:
            raise NotFound()

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
        """ Convert the category to its DTO representation """
        dto = MappingIssueCategoryDTO()
        dto.category_id = self.id
        dto.name = self.name
        dto.description = self.description
        dto.archived = self.archived

        return dto
