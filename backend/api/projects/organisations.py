from databases import Database
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from backend.db import get_db
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.project_admin_service import ProjectAdminService
from backend.services.project_organisation_service import ProjectOrganisationService
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    responses={404: {"description": "Not found"}},
)


@router.post("/{project_id}/organisations/{organisation_id}/")
async def create_project_organisation(
    project_id: int,
    organisation_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Assign a supporting organisation to a project
    ---
    tags:
        - projects
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
        - name: project_id
            in: path
            description: Unique project ID
            required: true
            type: integer
            default: 1
        - name: organisation_id
            in: path
            description: Unique organisation ID
            required: true
            type: integer
            default: 1
    responses:
        201:
            description: Organisation assigned successfully
        400:
            description: Client Error - Organisation already leads or supports the project
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Project or organisation not found
        500:
            description: Internal Server Error
    """
    if not await ProjectAdminService.is_user_action_permitted_on_project(
        user.id, project_id, db
    ):
        return JSONResponse(
            content={
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            },
            status_code=403,
        )

    async with db.transaction():
        await ProjectOrganisationService.create_project_organisation(
            project_id, organisation_id, db
        )
    return JSONResponse(content={"Success": "Organisation Assigned"}, status_code=201)


@router.get("/{project_id}/organisations/")
async def get_project_organisations(project_id: int, db: Database = Depends(get_db)):
    """
    Gets the lead and supporting organisations of a project
    ---
    tags:
        - projects
        - organisations
    produces:
        - application/json
    parameters:
        - name: project_id
            in: path
            description: Unique project ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Organisation list returned successfully
        404:
            description: Project not found
        500:
            description: Internal Server Error
    """
    return await ProjectOrganisationService.get_project_organisations_as_dto(
        project_id, db
    )


@router.delete("/{project_id}/organisations/{organisation_id}/")
async def delete_project_organisation(
    project_id: int,
    organisation_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Remove a supporting organisation from a project
    ---
    tags:
        - projects
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
        - name: project_id
            in: path
            description: Unique project ID
            required: true
            type: integer
            default: 1
        - name: organisation_id
            in: path
            description: Unique organisation ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Organisation removed successfully
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Project organisation link not found
        500:
            description: Internal Server Error
    """
    if not await ProjectAdminService.is_user_action_permitted_on_project(
        user.id, project_id, db
    ):
        return JSONResponse(
            content={
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            },
            status_code=403,
        )

    async with db.transaction():
        await ProjectOrganisationService.delete_project_organisation(
            project_id, organisation_id, db
        )
    return JSONResponse(content={"Success": "Organisation Deleted"}, status_code=200)
