from backend.models.dtos.interests_dto import InterestDTO
from backend.services.interests_service import InterestService
from backend.services.organisation_service import OrganisationService

from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, Depends, Request
from backend.db import get_session
from starlette.authentication import requires
from loguru import logger

router = APIRouter(
    prefix="/interests",
    tags=["interests"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)

INTEREST_NOT_FOUND = "Interest Not Found"

@router.post("/")
@requires("authenticated")
async def post(request: Request):
    """
    Creates a new interest
    ---
    tags:
        - interests
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - in: body
            name: body
            required: true
            description: JSON object for creating a new interest
            schema:
                properties:
                    name:
                        type: string
                        default: Public Domain
    responses:
        200:
            description: New interest created
        400:
            description: Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        500:
            description: Internal Server Error
    """
    try:
        orgs_dto = OrganisationService.get_organisations_managed_by_user_as_dto(
            request.user.display_name
        )
        if len(orgs_dto.organisations) < 1:
            raise ValueError("User not a Org Manager")
    except ValueError as e:
        error_msg = f"InterestsAllAPI POST: {str(e)}"
        return {"Error": error_msg, "SubCode": "UserNotPermitted"}, 403

    try:
        interest_dto = InterestDTO(request.get_json())
        interest_dto.validate()
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return {"Error": str(e), "SubCode": "InvalidData"}, 400

    try:
        new_interest = InterestService.create(interest_dto.name)
        return new_interest.model_dump(by_alias=True), 200
    except IntegrityError:
        return (
            {
                "Error": "Value '{0}' already exists".format(interest_dto.name),
                "SubCode": "NameExists",
            },
            400,
        )

@router.get("/")
async def get():
    """
    Get all interests
    ---
    tags:
        - interests
    produces:
        - application/json
    responses:
        200:
            description: List of interests
        500:
            description: Internal Server Error
    """
    interests = InterestService.get_all_interests()
    return interests.model_dump(by_alias=True), 200


@router.get("/{interest_id}/")
@requires("authenticated")
async def get(request: Request, interest_id: int):
    """
    Get an existing interest
    ---
    tags:
        - interests
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: interest_id
            in: path
            description: Interest ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Interest
        400:
            description: Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Interest not found
        500:
            description: Internal Server Error
    """
    try:
        orgs_dto = OrganisationService.get_organisations_managed_by_user_as_dto(
            request.user.display_name
        )
        if len(orgs_dto.organisations) < 1:
            raise ValueError("User not a Org Manager")
    except ValueError as e:
        error_msg = f"InterestsRestAPI GET: {str(e)}"
        return {"Error": error_msg, "SubCode": "UserNotPermitted"}, 403

    interest = InterestService.get(interest_id)
    return interest.model_dump(by_alias=True), 200

@router.patch("/{interest_id}/")
@requires("authenticated")
async def patch(request: Request, interest_id):
    """
    Update an existing interest
    ---
    tags:
        - interests
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: interest_id
            in: path
            description: Interest ID
            required: true
            type: integer
            default: 1
        - in: body
            name: body
            required: true
            description: JSON object for creating a new interest
            schema:
                properties:
                    name:
                        type: string
                        default: Public Domain
    responses:
        200:
            description: Interest updated
        400:
            description: Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Interest not found
        500:
            description: Internal Server Error
    """
    try:
        orgs_dto = OrganisationService.get_organisations_managed_by_user_as_dto(
            request.user.display_name
        )
        if len(orgs_dto.organisations) < 1:
            raise ValueError("User not a Org Manager")
    except ValueError as e:
        error_msg = f"InterestsRestAPI PATCH: {str(e)}"
        return {"Error": error_msg, "SubCode": "UserNotPermitted"}, 403

    try:
        interest_dto = InterestDTO(request.json())
        interest_dto.validate()
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return {"Error": str(e), "SubCode": "InvalidData"}, 400

    update_interest = InterestService.update(interest_id, interest_dto)
    return update_interest.model_dump(by_alias=True), 200

@router.delete("/{interest_id}/")
@requires("authenticated")
async def delete(request: Request, interest_id: int):
    """
    Delete a specified interest
    ---
    tags:
        - interests
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: interest_id
            in: path
            description: Unique interest ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Interest deleted
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Interest not found
        500:
            description: Internal Server Error
    """
    try:
        orgs_dto = OrganisationService.get_organisations_managed_by_user_as_dto(
            request.user.display_name
        )
        if len(orgs_dto.organisations) < 1:
            raise ValueError("User not a Org Manager")
    except ValueError as e:
        error_msg = f"InterestsRestAPI DELETE: {str(e)}"
        return {"Error": error_msg, "SubCode": "UserNotPermitted"}, 403

    InterestService.delete(interest_id)
    return {"Success": "Interest deleted"}, 200
