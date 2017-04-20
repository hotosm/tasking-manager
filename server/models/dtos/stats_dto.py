from schematics import Model
from schematics.types import StringType, IntType, BooleanType
from schematics.types.compound import ListType, ModelType
from server.models.dtos.mapping_dto import TaskHistoryDTO


class UserContribution(Model):
    """ User contribution for a project """
    username = StringType()
    mapped = IntType()
    validated = IntType()


class ProjectContributionsDTO(Model):
    """ DTO for all user contributons on a project """
    def __init__(self):
        super().__init__()
        self.user_contributions = []

    user_contributions = ListType(ModelType(UserContribution), serialized_name='userContributions')


class Pagination(Model):
    """ Properties for paginating results """
    has_next = BooleanType(serialized_name='hasNext')
    has_prev = BooleanType(serialized_name='hasPrev')
    next_num = IntType(serialized_name='nextNum')
    page = IntType()
    pages = IntType
    prev_num = IntType(serialized_name='prevNum')
    per_page = IntType(serialized_name='perPage')
    total = IntType()


class ProjectActivityDTO(Model):
    """ DTO to hold all project activity """
    def __init__(self):
        super().__init__()
        self.activity = []

    pagination = ModelType(Pagination)
    activity = ListType(ModelType(TaskHistoryDTO))
