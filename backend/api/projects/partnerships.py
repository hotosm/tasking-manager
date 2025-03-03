from databases import Database
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from backend.db import get_db
from backend.models.dtos.project_partner_dto import ProjectPartnershipDTO, ProjectPartnershipUpdateDTO
from backend.models.dtos.user_dto import AuthUserDTO
from backend.models.postgis.utils import timestamp
from backend.services.project_admin_service import ProjectAdminService
from backend.services.project_partnership_service import ProjectPartnershipService
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    responses={404: {"description": "Not found"}},
)


@staticmethod
async def check_if_manager(partnership_dto: ProjectPartnershipDTO, user_id: int, db: Database):
    if not await ProjectAdminService.is_user_action_permitted_on_project(user_id, partnership_dto.project_id, db):
        return JSONResponse(
            content={
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            },
            status_code=401,
        )


@router.get("/partnerships/{partnership_id}/")
async def retrieve_partnership(
    request: Request,
    partnership_id: int,
    db: Database = Depends(get_db),
):
    """
    Retrieves a Partnership by id
    ---
    tags:
        - projects
        - partners
        - partnerships
    produces:
        - application/json
    parameters:
        - name: partnership_id
            in: path
            description: Unique partnership ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Partnership found
        404:
            description: Partnership not found
        500:
            description: Internal Server Error
    """

    partnership_dto = await ProjectPartnershipService.get_partnership_as_dto(partnership_id, db)
    return partnership_dto


@router.post("/partnerships/")
async def create_partnership(
    request: Request,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """Assign a partner to a project
    ---
    tags:
        - projects
        - partners
        - partnerships
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
            description: JSON object for creating a partnership
            schema:
            properties:
                projectId:
                    required: true
                    type: int
                    description: Unique project ID
                    default: 1
                partnerId:
                    required: true
                    type: int
                    description: Unique partner ID
                    default: 1
                startedOn:
                    type: date
                    description: The timestamp when the partner is added to a project. Defaults to current time.
                    default: "2017-04-11T12:38:49"
                endedOn:
                    type: date
                    description: The timestamp when the partner ended their work on a project.
                    default: "2018-04-11T12:38:49"
    responses:
        201:
            description: Partner project association created
        400:
            description: Ivalid dates or started_on was after ended_on
        401:
            description: Forbidden, if user is not a manager of this project
        403:
            description: Forbidden, if user is not authenticated
        404:
            description: Not found
        500:
            description: Internal Server Error
    """
    request_data = await request.json()

    partnership_dto = ProjectPartnershipDTO(**request_data)
    is_not_manager_error = await check_if_manager(partnership_dto, user.id, db)
    if is_not_manager_error is not None:
        return is_not_manager_error

    if partnership_dto.started_on is None:
        partnership_dto.started_on = timestamp()

    async with db.transaction():
        partnership_id = await ProjectPartnershipService.create_partnership(
            db,
            partnership_dto.project_id,
            partnership_dto.partner_id,
            partnership_dto.started_on,
            partnership_dto.ended_on,
        )
    return (
        JSONResponse(
            content={
                "Success": "Partner {} assigned to project {}".format(
                    partnership_dto.partner_id, partnership_dto.project_id
                ),
                "partnershipId": partnership_id,
            },
            status_code=201,
        ),
    )


@router.patch("/partnerships/{partnership_id}/")
async def patch_partnership(
    request: Request,
    partnership_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """Update the time range for a partner project link
    ---
    tags:
        - projects
        - partners
        - partnerships
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: partnership_id
            in: path
            description: Unique partnership ID
            required: true
            type: integer
            default: 1
        - in: body
            name: body
            required: true
            description: JSON object for creating a partnership
            schema:
            properties:
                startedOn:
                    type: date
                    description: The timestamp when the partner is added to a project. Defaults to current time.
                    default: "2017-04-11T12:38:49"
                endedOn:
                    type: date
                    description: The timestamp when the partner ended their work on a project.
                    default: "2018-04-11T12:38:49"
    responses:
        201:
            description: Partner project association created
        400:
            description: Ivalid dates or started_on was after ended_on
        401:
            description: Forbidden, if user is not a manager of this project
        403:
            description: Forbidden, if user is not authenticated
        404:
            description: Not found
        500:
            description: Internal Server Error
    """
    request_data = await request.json()
    partnership_updates = ProjectPartnershipUpdateDTO(**request_data)
    partnership_dto = await ProjectPartnershipService.get_partnership_as_dto(partnership_id, db)

    is_not_manager_error = await check_if_manager(partnership_dto, user.id, db)
    if is_not_manager_error is not None:
        return is_not_manager_error

    async with db.transaction():
        partnership = await ProjectPartnershipService.update_partnership_time_range(
            db,
            partnership_id,
            partnership_updates.started_on,
            partnership_updates.ended_on,
        )
    return (
        JSONResponse(
            content={
                "Success": "Updated time range. startedOn: {}, endedOn: {}".format(
                    partnership.started_on, partnership.ended_on
                ),
                "startedOn": f"{partnership.started_on}",
                "endedOn": f"{partnership.ended_on}",
            },
            status_code=200,
        ),
    )


@router.delete("/partnerships/{partnership_id}/")
async def delete_partnership(
    request: Request,
    partnership_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """Deletes a link between a project and a partner
    ---
    tags:
        - projects
        - partners
        - partnerships
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: partnership_id
            in: path
            description: Unique partnership ID
            required: true
            type: integer
            default: 1
    responses:
        201:
            description: Partner project association created
        401:
            description: Forbidden, if user is not a manager of this project
        403:
            description: Forbidden, if user is not authenticated
        404:
            description: Not found
        500:
            description: Internal Server Error
    """
    partnership_dto = await ProjectPartnershipService.get_partnership_as_dto(partnership_id, db)
    is_not_manager_error = await check_if_manager(partnership_dto, user.id, db)
    if is_not_manager_error is not None:
        return is_not_manager_error
    async with db.transaction():
        await ProjectPartnershipService.delete_partnership(partnership_id, db)
    return (
        JSONResponse(
            content={
                "Success": "Partnership ID {} deleted".format(partnership_id),
            },
            status_code=200,
        ),
    )


@router.get("/{project_id}/partners/")
async def get_partners(
    request: Request,
    project_id: int,
    db: Database = Depends(get_db),
):
    """
    Retrieves the list of partners associated with a project
    ---
    tags:
        - projects
        - partners
        - partnerships
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
            description: List (possibly empty) of partners associated with this project_id
        500:
            description: Internal Server Error
    """
    partnerships = await ProjectPartnershipService.get_partnerships_by_project(project_id, db)
    return {"partnerships": partnerships}
