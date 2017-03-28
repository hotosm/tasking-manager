from schematics import Model
from schematics.types import StringType


class AuthorizedDTO(Model):
    """ DTO used to transmit user info for successfully authenticated user"""
    username = StringType(required=True)
    session_token = StringType(required=True)
