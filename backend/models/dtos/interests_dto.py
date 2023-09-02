from schematics import Model
from schematics.types import IntType, StringType, FloatType, BooleanType
from schematics.types.compound import ListType, ModelType


class InterestDTO(Model):
    """DTO for a interest."""

    id = IntType()
    name = StringType(required=True, min_length=1)
    user_selected = BooleanType(
        serialized_name="userSelected", serialize_when_none=False
    )
    count_projects = IntType(serialize_when_none=False, serialized_name="countProjects")
    count_users = IntType(serialize_when_none=False, serialized_name="countUsers")


class InterestsListDTO(Model):
    """DTO for a list of interests."""

    def __init__(self):
        super().__init__()
        self.interests = []

    interests = ListType(ModelType(InterestDTO))


class InterestRateDTO(Model):
    """DTO for a interest rate."""

    name = StringType()
    rate = FloatType()


class InterestRateListDTO(Model):
    """DTO for a list of interests rates."""

    def __init__(self):
        super().__init__()
        self.interests = []

    rates = ListType(ModelType(InterestRateDTO))
