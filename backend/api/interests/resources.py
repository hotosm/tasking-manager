from backend.models.dtos.interests_dto import InterestDTO
from backend.services.interests_service import InterestService
from backend.services.organisation_service import OrganisationService
from backend.services.users.authentication_service import login_required

from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, Depends, Request
from backend.db import get_session
from starlette.authentication import requires
from backend.models.dtos.user_dto import AuthUserDTO
from databases import Database
from backend.db import get_db
from loguru import logger
from asyncpg.exceptions import UniqueViolationError


router = APIRouter(
    prefix="/interests",
    tags=["interests"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)

INTEREST_NOT_FOUND = "Interest Not Found"


@router.post("/")
async def post(
    interest_dto: InterestDTO,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        orgs_dto = await OrganisationService.get_organisations_managed_by_user_as_dto(
            user_id=user.id, db=db
        )
        if len(orgs_dto.organisations) < 1:
            raise ValueError("User not a Org Manager")
    except ValueError as e:
        error_msg = f"InterestsAllAPI POST: {str(e)}"
        return {"Error": error_msg, "SubCode": "UserNotPermitted"}, 403

    try:
        new_interest_dto = await InterestService.create(interest_dto.name, db)
        return new_interest_dto

    except UniqueViolationError:
        return (
            {
                "Error": "Value '{0}' already exists".format(interest_dto.name),
                "SubCode": "NameExists",
            },
            400,
        )


@router.get("/")
async def get(db: Database = Depends(get_db)):
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
    interests_dto = await InterestService.get_all_interests(db)
    return interests_dto


@router.get("/{interest_id}/")
async def get(
    interest_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        orgs_dto = await OrganisationService.get_organisations_managed_by_user_as_dto(
            user_id=user.id, db=db
        )
        if len(orgs_dto.organisations) < 1:
            raise ValueError("User not a Org Manager")
    except ValueError as e:
        error_msg = f"InterestsRestAPI GET: {str(e)}"
        return {"Error": error_msg, "SubCode": "UserNotPermitted"}, 403

    interest_dto = await InterestService.get(interest_id, db)
    return interest_dto


@router.patch("/{interest_id}/")
async def patch(
    interest_id: int,
    interest_dto: InterestDTO,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        orgs_dto = await OrganisationService.get_organisations_managed_by_user_as_dto(
            user_id=user.id, db=db
        )
        if len(orgs_dto.organisations) < 1:
            raise ValueError("User not a Org Manager")
    except ValueError as e:
        error_msg = f"InterestsRestAPI PATCH: {str(e)}"
        return {"Error": error_msg, "SubCode": "UserNotPermitted"}, 403

    update_interest = await InterestService.update(interest_id, interest_dto, db)
    return update_interest


@router.delete("/{interest_id}/")
async def delete(
    interest_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
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
        orgs_dto = await OrganisationService.get_organisations_managed_by_user_as_dto(
            user_id=user.id, db=db
        )
        if len(orgs_dto.organisations) < 1:
            raise ValueError("User not a Org Manager")
    except ValueError as e:
        error_msg = f"InterestsRestAPI DELETE: {str(e)}"
        return {"Error": error_msg, "SubCode": "UserNotPermitted"}, 403

    await InterestService.delete(interest_id, db)
    return {"Success": "Interest deleted"}, 200
