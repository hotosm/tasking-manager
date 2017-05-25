from schematics.types import BaseType, BooleanType, IntType
from schematics import Model


class GridDTO(Model):
    """ Describes JSON model used for creating grids """
    area_of_interest = BaseType(required=True, serialized_name='areaOfInterest')
    grid = BaseType(required=True)
    clip_to_aoi = BooleanType(required=True, serialized_name='clipToAoi')

class SplitTaskDTO(Model):
    """ DTO used to split a task """
    user_id = IntType(required=True)
    task_id = IntType(required=True)
    project_id = IntType(required=True)