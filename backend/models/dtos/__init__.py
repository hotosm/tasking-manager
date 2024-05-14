from functools import wraps
from flask import request
from schematics.exceptions import DataError


from backend.exceptions import BadRequest


def get_validation_errors(e):
    """Returns a list of validation errors from a schematics DataError"""
    return [
        {"field": field, "message": str(error[0])} for field, error in e.errors.items()
    ]


def validate_request(dto_class):
    """
    Decorator to validate request against a DTO class.
    --------------------------------
    NOTE: This decorator should be applied after the token_auth decorator (if used) so that
    the authenticated user id can be set on the DTO if the DTO has a user_id field.
    --------------------------------
    Parameters:
        dto_class: DTO
            The DTO class to validate against
    """

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            from backend.services.users.authentication_service import token_auth

            try:
                dto = dto_class()

                # Set attribute values from request body, query parameters, and path parameters
                for attr in dto.__class__._fields:
                    if request.is_json and attr in request.json:
                        setattr(dto, attr, request.json[attr])
                    elif attr in request.args:
                        setattr(dto, attr, request.args.get(attr))
                    elif attr in kwargs:
                        setattr(dto, attr, kwargs[attr])

                #  Set authenticated user id if user_id is a field in the DTO
                if "user_id" in dto.__class__._fields:
                    dto.user_id = token_auth.current_user()

                dto.validate()
                request.validated_dto = (
                    dto  # Set validated DTO on request object for use in view function
                )
            except DataError as e:
                field_errors = get_validation_errors(e)
                raise BadRequest(field_errors=field_errors)
            return f(*args, **kwargs)

        return wrapper

    return decorator
