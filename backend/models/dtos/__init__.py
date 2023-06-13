from functools import wraps
from flask import request
from schematics.exceptions import DataError


from backend.exceptions import BadRequest


def get_validation_errors(e):
    """Returns a list of validation errors from a schematics DataError"""
    return [
        {"field": field, "message": str(error[0])} for field, error in e.errors.items()
    ]


def validate_request_body(dto_class):
    """Decorator to validate request body against a DTO class"""

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            try:
                dto = dto_class(request.get_json())
                dto.validate()
                request.validated_dto = dto
            except DataError as e:
                field_errors = get_validation_errors(e)
                raise BadRequest(field_errors=field_errors)
            return f(*args, **kwargs)

        return wrapper

    return decorator
