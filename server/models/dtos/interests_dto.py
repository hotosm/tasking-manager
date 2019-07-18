from schematics import Model
from schematics.types import IntType, StringType, FloatType
from schematics.types.compound import ListType, ModelType


class InterestDTO(Model):
    id = IntType()
    name = StringType()


class InterestsDTO(Model):
    """ DTO for all user contributons on a project """
    def __init__(self):
        super().__init__()
        self.interests = []

    interests = ListType(ModelType(InterestDTO))

class InterestrateDTO(Model):
    name = StringType()
    rate = FloatType()


class InterestratesDTO(Model):
    """ DTO for all user contributons on a project """
    def __init__(self):
        super().__init__()
        self.interests = []

    rates = ListType(ModelType(InterestrateDTO))