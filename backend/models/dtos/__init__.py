from functools import wraps
from flask import request
from schematics.exceptions import DataError
from werkzeug.exceptions import BadRequest as WerkzeugBadRequest

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
                try:
                    body = request.json if request.is_json else {}
                except (
                    WerkzeugBadRequest
                ):  # If request body does not contain valid JSON then BadRequest is raised by Flask
                    body = {}

                for attr in dto.__class__._fields:
                    # Get serialized name of attr if exists otherwise use attr name
                    field = dto.__class__._fields[attr]
                    attr_name = field.serialized_name if field.serialized_name else attr

                    # Set attribute value from request body, query parameters, or path parameters
                    if attr_name in body:
                        setattr(dto, attr, body[attr_name])
                    elif attr_name in request.args:
                        setattr(dto, attr, request.args.get(attr_name))
                    elif attr_name in kwargs:
                        setattr(dto, attr, kwargs[attr_name])

                #  Set authenticated user id if user_id is a field in the DTO
                if "user_id" in dto.__class__._fields:
                    dto.user_id = token_auth.current_user()

                # Get accepted language from request header
                if "preferred_locale" in dto.__class__._fields:
                    dto.preferred_locale = request.environ.get(
                        "HTTP_ACCEPT_LANGUAGE", "en"
                    )

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
