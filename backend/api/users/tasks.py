from databases import Database
from datetime import datetime
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from backend.services.users.user_service import UserService
from backend.db import get_db
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_db)],
    responses={404: {"description": "Not found"}},
)


@router.get("/{user_id}/tasks/")
async def get(
    request: Request,
    user_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    status: str = None,
    project_status: str = None,
    project_id: int = None,
    start_date: datetime = None,
    end_date: datetime = None,
    sort_by: str = "-action_date",
):
    """
    Get a list of tasks a user has interacted with
    ---
    tags:
      - users
    produces:
      - application/json
    parameters:
        - in: header
          name: Authorization
          description: Base64 encoded session token
          required: true
          type: string
          default: Token sessionTokenHere==
        - name: user_id
          in: path
          description: Mapper's OpenStreetMap ID
          required: true
          type: integer
        - in: query
          name: status
          description: Task Status filter
          required: false
          type: string
          default: null
        - in: query
          name: project_status
          description: Project Status filter
          required: false
          type: string
          default: null
        - in: query
          name: project_id
          description: Project id
          required: false
          type: integer
          default: null
        - in: query
          name: start_date
          description: Date to filter as minimum
          required: false
          type: string
          default: null
        - in: query
          name: end_date
          description: Date to filter as maximum
          required: false
          type: string
          default: null
        - in: query
          name: sort_by
          description:
                criteria to sort by. The supported options are action_date, -action_date, project_id, -project_id.
                The default value is -action_date.
          required: false
          type: string
        - in: query
          name: page
          description: Page of results user requested
          type: integer
        - in: query
          name: page_size
          description: Size of page, defaults to 10
          type: integer
    responses:
        200:
            description: Mapped projects found
        404:
            description: No mapped projects found
        500:
            description: Internal Server Error
    """
    try:
        user = await UserService.get_user_by_id(user_id, db)
        status = request.query_params.get("status")
        project_status = request.query_params.get("project_status")
        project_id = int(request.query_params.get("project_id", 0))
        start_date = (
            date_parse(request.query_params.get("start_date"))
            if request.query_params.get("start_date")
            else None
        )
        end_date = (
            date_parse(request.query_params.get("end_date"))
            if request.query_params.get("end_date")
            else None
        )
        sort_by = request.query_params.get("sort_by", "-action_date")

        tasks = UserService.get_tasks_dto(
            user.id,
            project_id=project_id,
            project_status=project_status,
            task_status=status,
            start_date=start_date,
            end_date=end_date,
            page=request.query_params.get("page", 1),
            page_size=request.query_params.get("page_size", 10),
            sort_by=sort_by,
            db=db,
        )
        return tasks.model_dump(by_alias=True)
    except ValueError:
        print("InvalidDateRange- Date range can not be bigger than 1 year")
        return JSONResponse(
            content={"tasks": [], "pagination": {"total": 0}}, status_code=200
        )
