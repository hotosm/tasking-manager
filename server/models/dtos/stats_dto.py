from schematics import Model
from schematics.types import StringType, IntType
from schematics.types.compound import ListType, ModelType


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
