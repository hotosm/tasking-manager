from databases import Database
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse, Response
from loguru import logger

from backend.db import get_db
from backend.models.dtos.organisation_dto import (
    ListOrganisationsDTO,
    NewOrganisationDTO,
    OrganisationDTO,
    UpdateOrganisationDTO,
)
from backend.models.dtos.stats_dto import OrganizationStatsDTO
from backend.models.dtos.user_dto import AuthUserDTO
from backend.models.postgis.user import User
from backend.services.organisation_service import (
    OrganisationService,
    OrganisationServiceError,
)
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/organisations",
    tags=["organisations"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{organisation_id:int}/", response_model=OrganisationDTO)
async def retrieve_organisation(
    request: Request,
    organisation_id: int,
    db: Database = Depends(get_db),
    omit_managers: bool = Query(
        False,
        alias="omitManagerList",
        description="Omit organization managers list from the response.",
    ),
):
    """
    Retrieves an organisation
    ---
    tags:
        - organisations
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            type: string
            default: Token sessionTokenHere==
        - name: organisation_id
            in: path
            description: The unique organisation ID
            required: true
            type: integer
            default: 1
        - in: query
            name: omitManagerList
            type: boolean
            description: Set it to true if you don't want the managers list on the response.
            default: False
    responses:
        200:
            description: Organisation found
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: Organisation not found
        500:
            description: Internal Server Error
    """
    authenticated_user_id = (
        request.user.display_name
        if request.user and request.user.display_name
        else None
    )
    if authenticated_user_id is None:
        user_id = 0
    else:
        user_id = authenticated_user_id
    # Validate abbreviated.
    organisation_dto = await OrganisationService.get_organisation_by_id_as_dto(
        organisation_id, user_id, omit_managers, db
    )
    return organisation_dto


@router.get("/{slug:str}/", response_model=OrganisationDTO)
async def retrieve_organisation_by_slug(
    request: Request,
    slug: str,
    db: Database = Depends(get_db),
    omit_managers: bool = Query(
        True,
        alias="omitManagerList",
        description="Omit organization managers list from the response.",
    ),
):
    """
    Retrieves an organisation
    ---
    tags:
        - organisations
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            type: string
            default: Token sessionTokenHere==
        - name: slug
            in: path
            description: The unique organisation slug
            required: true
            type: string
            default: hot
        - in: query
            name: omitManagerList
            type: boolean
            description: Set it to true if you don't want the managers list on the response.
            default: False
    responses:
        200:
            description: Organisation found
        404:
            description: Organisation not found
        500:
            description: Internal Server Error
    """
    authenticated_user_id = (
        request.user.display_name
        if request.user and request.user.display_name
        else None
    )
    if authenticated_user_id is None:
        user_id = 0
    else:
        user_id = authenticated_user_id
    organisation_dto = await OrganisationService.get_organisation_by_slug_as_dto(
        slug, user_id, omit_managers, db
    )
    return organisation_dto


@router.post("/")
async def create_organisation(
    organisation_dto: NewOrganisationDTO,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Creates a new organisation
    ---
    tags:
        - organisations
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
            description: JSON object for creating organisation
            schema:
            properties:
                name:
                    type: string
                    default: HOT
                slug:
                    type: string
                    default: hot
                logo:
                    type: string
                    default: https://cdn.hotosm.org/tasking-manager/uploads/1588741335578_hot-logo.png
                url:
                    type: string
                    default: https://hotosm.org
                managers:
                    type: array
                    items:
                        type: string
                    default: [
                        user_1,
                        user_2
                    ]
    responses:
        201:
            description: Organisation created successfully
        400:
            description: Client Error - Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        402:
            description: Duplicate Name - Organisation name already exists
        500:
            description: Internal Server Error
    """
    request_user = await User.get_by_id(user.id, db)
    if request_user.role != 1:
        return JSONResponse(
            content={
                "Error": "Only admin users can create organisations.",
                "SubCode": "OnlyAdminAccess",
            },
            status_code=403,
        )
    try:
        if request_user.username not in organisation_dto.managers:
            organisation_dto.managers.append(request_user.username)

    except Exception as e:
        logger.error(f"error validating request: {str(e)}")
        return JSONResponse(
            content={"Error": str(e), "SubCode": "InvalidData"}, status_code=400
        )

    try:
        async with db.transaction():
            org_id = await OrganisationService.create_organisation(organisation_dto, db)
            return JSONResponse(content={"organisationId": org_id}, status_code=201)
    except OrganisationServiceError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=400,
        )


@router.delete("/{organisation_id}/")
async def delete_organisation(
    request: Request,
    organisation_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Deletes an organisation
    ---
    tags:
        - organisations
    produces:
        - application/json
    parameters:
        - in: header
          name: Authorization
          description: Base64 encoded session token
          required: true
          type: string
          default: Token sessionTokenHere==
        - name: organisation_id
          in: path
          description: The unique organisation ID
          required: true
          type: integer
          default: 1
    responses:
        200:
            description: Organisation deleted
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Organisation not found
        500:
            description: Internal Server Error
    """
    if not await OrganisationService.can_user_manage_organisation(
        organisation_id, user.id, db
    ):
        return JSONResponse(
            content={
                "Error": "User is not an admin for the org",
                "SubCode": "UserNotOrgAdmin",
            },
            status_code=403,
        )
    try:
        async with db.transaction():
            await OrganisationService.delete_organisation(organisation_id, db)
            return JSONResponse(
                content={"Success": "Organisation deleted"}, status_code=200
            )

    except OrganisationServiceError:
        return JSONResponse(
            content={
                "Error": "Organisation has some projects",
                "SubCode": "OrgHasProjects",
            },
            status_code=403,
        )


@router.patch("/{organisation_id}/")
async def update_organisation(
    organisation_dto: UpdateOrganisationDTO,
    request: Request,
    organisation_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Updates an organisation
    ---
    tags:
        - organisations
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: organisation_id
            in: path
            description: The unique organisation ID
            required: true
            type: integer
            default: 1
        - in: body
            name: body
            required: true
            description: JSON object for updating an organisation
            schema:
            properties:
                name:
                    type: string
                    default: HOT
                slug:
                    type: string
                    default: HOT
                logo:
                    type: string
                    default: https://tasks.hotosm.org/assets/img/hot-tm-logo.svg
                url:
                    type: string
                    default: https://hotosm.org
                managers:
                    type: array
                    items:
                        type: string
                    default: [
                        user_1,
                        user_2
                    ]
    responses:
        201:
            description: Organisation updated successfully
        400:
            description: Client Error - Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        500:
            description: Internal Server Error
    """
    if not await OrganisationService.can_user_manage_organisation(
        organisation_id, user.id, db
    ):
        return JSONResponse(
            content={
                "Error": "User is not an admin for the org",
                "SubCode": "UserNotOrgAdmin",
            },
            status_code=403,
        )
    try:
        organisation_dto.organisation_id = organisation_id
        # Don't update organisation type and subscription_tier if request user is not an admin
        user = await User.get_by_id(user.id, db)
        if user.role != 1:
            org = await OrganisationService.get_organisation_by_id(organisation_id, db)
            organisation_dto.type = org.type
            organisation_dto.subscription_tier = org.subscription_tier
    except Exception as e:
        logger.error(f"error validating request: {str(e)}")
        return JSONResponse(
            content={"Error": str(e), "SubCode": "InvalidData"}, status_code=400
        )
    try:
        async with db.transaction():
            await OrganisationService.update_organisation(organisation_dto, db)
            return JSONResponse(content={"Status": "Updated"}, status_code=200)
    except OrganisationServiceError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=402,
        )


@router.get("/{organisation_id}/statistics/", response_model=OrganizationStatsDTO)
async def get_organisation_with_statistics(
    request: Request,
    organisation_id: int,
    db: Database = Depends(get_db),
):
    """
    Return statistics about projects and active tasks of an organisation
    ---
    tags:
        - organisations
    produces:
        - application/json
    parameters:
        - name: organisation_id
            in: path
            description: The unique organisation ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Organisation found
        404:
            description: Organisation not found
        500:
            description: Internal Server Error
    """
    await OrganisationService.get_organisation_by_id(organisation_id, db)
    organisation_dto = await OrganisationService.get_organisation_stats(
        organisation_id, db, None
    )
    return organisation_dto


@router.get("/", response_model=ListOrganisationsDTO)
async def list_organisation(
    request: Request,
    db: Database = Depends(get_db),
    omit_stats: bool = Query(
        True,
        alias="omitOrgStats",
        description="Omit organization stats from the response.",
    ),
    omit_managers: bool = Query(
        False,
        alias="omitManagerList",
        description="Omit organization managers list from the response.",
    ),
    manager_user_id: int = Query(
        None, alias="manager_user_id", description="ID of the manager user."
    ),
):
    """
    List all organisations
    ---
    tags:
        - organisations
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            type: string
            default: Token sessionTokenHere==
        - name: manager_user_id
            in: query
            description: Filter projects on managers with this user_id
            required: false
            type: integer
        - in: query
            name: omitManagerList
            type: boolean
            description: Set it to true if you don't want the managers list on the response.
            default: False
        - in: query
            name: omitOrgStats
            type: boolean
            description: Set it to true if you don't want organisation stats on the response. \n
            \n
            Adds year to date organisation stats to response if set false.
            default: True

    responses:
        200:
            description: Organisations found
        400:
            description: Client Error - Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Unauthorized - Not allowed
        404:
            description: Organisations not found
        500:
            description: Internal Server Error
    """
    authenticated_user_id = (
        request.user.display_name
        if request.user and request.user.display_name
        else None
    )

    if manager_user_id is not None and not authenticated_user_id:
        return Response(
            content={
                "Error": "Unauthorized - Filter by manager_user_id is not allowed to unauthenticated requests",
                "SubCode": "LoginToFilterManager",
            },
            status_code=403,
        )
    results_dto = await OrganisationService.get_organisations_as_dto(
        manager_user_id, authenticated_user_id, omit_managers, omit_stats, db
    )
    return results_dto
