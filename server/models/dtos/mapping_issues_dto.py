from schematics import Model
from schematics.types import IntType, StringType, BooleanType, ModelType
from schematics.types.compound import ListType

class MappingIssueCategoryDTO(Model):
    """ DTO used to define a mapping-issue category """
    category_id = IntType(serialized_name='categoryId')
    name = StringType(required=True)
    description = StringType(required=False)
    archived = BooleanType(required=False)

class MappingIssueCategoriesDTO(Model):
    """ DTO for all mapping-issue categories """
    def __init__(self):
        super().__init__()
        self.categories = []

    categories = ListType(ModelType(MappingIssueCategoryDTO))

class TaskMappingIssueDTO(Model):
    """ DTO used to define a single mapping issue recorded with a task invalidation """
    category_id = IntType(serialized_name='categoryId')
    name = StringType(required=True)
    count = IntType(required=True)
