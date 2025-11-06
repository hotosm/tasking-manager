import json
from typing import Any, Iterable, Optional, AsyncGenerator

from backend.models.postgis.user import User
from databases import Database
from fastapi import APIRouter, Depends, Request, Query, Path, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from loguru import logger
from backend.db import get_db
from backend.models.dtos.user_dto import AuthUserDTO, UserSearchQuery
from backend.services.project_service import ProjectService
from backend.services.users.authentication_service import login_required
from backend.services.users.user_service import UserService
from backend.services.users.osm_service import OSMService, OSMServiceError
from backend.db import db_connection

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{user_id}/")
async def get_user(
    request: Request,
    user_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Get user information by id
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
          description: The id of the user
          required: true
          type: integer
          default: 1
    responses:
        200:
            description: User found
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: User not found
        500:
            description: Internal Server Error
    """
    user_dto = await UserService.get_user_dto_by_id(user_id, user.id, db)
    return user_dto


@router.delete("/{user_id}/", tags=["users"])
async def delete_user(
    user_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Delete user information by id.

    - **user_id**: The id of the user to delete.
    - Returns the deleted user object (primitive form) and HTTP 200 on success.

    Responses:
        200: User deleted
        401: Unauthorized - insufficient permissions
        404: User not found
        500: Internal Server Error
    """
    # Only the user themself or an admin may delete
    is_admin = await UserService.is_user_an_admin(user.id, db)

    if user_id != user.id and not is_admin:

        return JSONResponse(
            content={
                "Error": "User not permitted",
                "SubCode": "UserPermissionError",
            },
            status_code=401,
        )

    try:
        deleted_dto = await UserService.delete_user_by_id(user_id, user.id, db)
        if deleted_dto is None:
            return JSONResponse(
                content={
                    "Error": "User not found",
                    "SubCode": "UserNotFound",
                },
                status_code=400,
            )

        return deleted_dto

    except Exception as exc:
        logger.exception("Failed to delete user %s: %s", user_id, exc)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/")
async def list_users(
    page: int = Query(1, description="Page of results user requested"),
    pagination: bool = Query(True, description="Whether to return paginated results"),
    sort: Optional[str] = Query(None, description="sort by this metric"),
    sort_dir: str = Query(default="asc", description="sort direction"),
    per_page: int = Query(
        20, alias="perPage", description="Number of results per page"
    ),
    username: str | None = Query(None, description="Full or part username"),
    role: str | None = Query(
        None, description="Role of User, e.g. ADMIN, PROJECT_MANAGER"
    ),
    level: str | None = Query(None, description="Level of User, e.g. BEGINNER"),
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Get paged list of all usernames
    ---
    tags:
      - users
    produces:
      - application/json
    parameters:
        - in: header
          name: Authorization
          description: Base64 encoded sesesion token
          required: true
          type: string
          default: Token sessionTokenHere==
        - in: query
          name: page
          description: Page of results user requested
          type: integer
        - in: query
          name: pagination
          description: Whether to return paginated results
          type: boolean
          default: true
        - in: query
          name: per_page
          description: Number of results per page
          type: integer
          default: 20
        - in: query
          name: username
          description: Full or part username
          type: string
        - in: query
          name: role
          description: Role of User, eg ADMIN, PROJECT_MANAGER
          type: string
        - in: query
          name: level
          description: Level of User, eg BEGINNER
          type: string
    responses:
        200:
            description: Users found
        401:
            description: Unauthorized - Invalid credentials
        500:
            description: Internal Server Error
    """
    try:
        query = UserSearchQuery(
            pagination=pagination,
            page=page if pagination else None,
            per_page=per_page,
            sort=sort,
            sort_dir=sort_dir,
            username=username,
            mapping_level=level,
            role=role,
            voter_id=user.id,
        )
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return JSONResponse(
            content={"Error": "Unable to fetch user list", "SubCode": "InvalidData"},
            status_code=400,
        )
    users_dto = await UserService.get_all_users(query, db)
    return users_dto


async def _aiter_from_sync_iterable(
    iterable: Iterable[Any],
) -> AsyncGenerator[Any, None]:
    for item in iterable:
        yield item


# @router.delete("/", tags=["users"])
async def delete_users(
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
) -> StreamingResponse:
    # permission check remains the same
    is_admin = await UserService.is_user_an_admin(user.id, db)
    if not is_admin:
        return JSONResponse(
            content={"Error": "User not permitted", "SubCode": "UserPermissionError"},
            status_code=401,
        )

    async def _delete_users_gen() -> AsyncGenerator[bytes, None]:
        """
        Acquire a DB connection for the lifetime of this generator so fetches
        and iterations don't fail with "Connection is not acquired".
        """
        deleted_users_gen = OSMService.get_deleted_users()

        async with db_connection.database.connection() as conn:

            users_iterable_or_aiter = await User.get_all_users_not_paginated(conn)
            if hasattr(users_iterable_or_aiter, "__aiter__"):
                users_async_iter = users_iterable_or_aiter  # type: ignore
            else:
                users_async_iter = _aiter_from_sync_iterable(users_iterable_or_aiter)

            if deleted_users_gen is not None:
                last_deleted = 0
                try:
                    async for user_rec in users_async_iter:
                        user_id = (
                            user_rec.get("id")
                            if isinstance(user_rec, dict)
                            else getattr(user_rec, "id", None)
                        )
                        if user_id is None:
                            continue

                        try:
                            while last_deleted < user_id:
                                last_deleted = await deleted_users_gen.__anext__()
                        except StopAsyncIteration:
                            return

                        if last_deleted == user_id:
                            deleted_dto = await UserService.delete_user_by_id(
                                user_id, user, conn
                            )
                            primitive = (
                                deleted_dto.to_primitive()
                                if hasattr(deleted_dto, "to_primitive")
                                else deleted_dto
                            )
                            yield (f"\u001e{json.dumps(primitive)}\n").encode("utf-8")
                finally:
                    if hasattr(deleted_users_gen, "aclose"):
                        await deleted_users_gen.aclose()

                return

            async for user_rec in users_async_iter:
                user_id = (
                    user_rec.get("id")
                    if isinstance(user_rec, dict)
                    else getattr(user_rec, "id", None)
                )
                if user_id is None:
                    continue
                try:
                    gone = await OSMService.is_osm_user_gone(user_id)
                except OSMServiceError:
                    continue

                if gone:
                    deleted_dto = await UserService.delete_user_by_id(
                        user_id, user, conn
                    )
                    primitive = (
                        deleted_dto.to_primitive()
                        if hasattr(deleted_dto, "to_primitive")
                        else deleted_dto
                    )
                    yield (f"\u001e{json.dumps(primitive)}\n").encode("utf-8")

    return StreamingResponse(_delete_users_gen(), media_type="application/json-seq")


@router.get("/queries/favorites/")
async def get_user_favorite_projects(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Get projects favorited by a user
    ---
    tags:
      - favorites
    produces:
      - application/json
    parameters:
        - in: header
          name: Authorization
          description: Base64 encoded session token
          required: true
          type: string
          default: Token sessionTokenHere==
    responses:
        200:
            description: Projects favorited by user
        404:
            description: User not found
        500:
            description: Internal Server Error
    """
    favs_dto = await UserService.get_projects_favorited(user.id, db)
    return favs_dto


@router.get("/queries/{username}/")
async def get_osm_user_info(
    request: Request,
    username: str,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Get user information by OpenStreetMap username
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
        - name: username
          in: path
          description: Mapper's OpenStreetMap username
          required: true
          type: string
          default: Thinkwhere
    responses:
        200:
            description: User found
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: User not found
        500:
            description: Internal Server Error
    """
    user_dto = await UserService.get_user_dto_by_username(username, user.id, db)
    return user_dto


@router.get("/queries/filter/{username}/")
async def get_paginated_osm_user_info(
    username: str = Path(
        ..., description="Mapper's partial or full OpenStreetMap username"
    ),
    page: int = Query(1, description="Page of results user requested"),
    project_id: int | None = Query(
        None,
        alias="projectId",
        description="Optional, promote project participants to head of results",
    ),
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Get paged lists of users matching OpenStreetMap username filter
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
        - name: username
          in: path
          description: Mapper's partial or full OpenStreetMap username
          type: string
          default: ab
        - in: query
          name: page
          description: Page of results user requested
          type: integer
        - in: query
          name: projectId
          description: Optional, promote project participants to head of results
          type: integer
    responses:
        200:
            description: Users found
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: User not found
        500:
            description: Internal Server Error
    """
    users_dto = await UserService.filter_users(username, project_id, page, db)
    return users_dto


@router.get("/queries/tasks/locked/")
async def get_task_locked_by_user(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Gets any locked task on the project for the logged in user
    ---
    tags:
        - mapping
    produces:
        - application/json
    parameters:
        - in: header
          name: Authorization
          description: Base64 encoded session token
          required: true
          type: string
          default: Token sessionTokenHere==
    responses:
        200:
            description: Task user is working on
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: User is not working on any tasks
        500:
            description: Internal Server Error
    """
    locked_tasks = await ProjectService.get_task_for_logged_in_user(user.id, db)
    return locked_tasks.model_dump(by_alias=True)


@router.get("/queries/tasks/locked/details/")
async def get_task_details_locked_by_user(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Gets details of any locked task for the logged in user
    ---
    tags:
        - mapping
    produces:
        - application/json
    parameters:
        - in: header
          name: Authorization
          description: Base64 encoded session token
          required: true
          type: string
          default: Token sessionTokenHere==
        - in: header
          name: Accept-Language
          description: Language user is requesting
          type: string
          required: true
          default: en
    responses:
        200:
            description: Task user is working on
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: User is not working on any tasks
        500:
            description: Internal Server Error
    """
    preferred_locale = request.headers.get("accept-language")
    locked_tasks = await ProjectService.get_task_details_for_logged_in_user(
        user.id, preferred_locale, db
    )
    return locked_tasks.model_dump(by_alias=True)


@router.get("/{username}/queries/interests/")
async def get_user_interests(
    request: Request,
    username: str,
    db: Database = Depends(get_db),
    request_user: AuthUserDTO = Depends(login_required),
):
    """
    Get interests by username
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
        - name: username
          in: path
          description: Mapper's OpenStreetMap username
          required: true
          type: string
    responses:
        200:
            description: User interests returned
        404:
            description: User not found
        500:
            description: Internal Server Error
    """
    query = """
            SELECT u.id, u.username, array_agg(i.name) AS interests
            FROM users u
            LEFT JOIN user_interests ui ON u.id = ui.user_id
            LEFT JOIN interests i ON ui.interest_id = i.id
            WHERE u.username = :username
            GROUP BY u.id, u.username
        """
    user = await db.fetch_one(query, {"username": username})
    interests_dto = await UserService.get_interests(user, db)
    return interests_dto


@router.get("/{username}/recommended-projects/")
async def get_recommended_projects(
    request: Request,
    username,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Get recommended projects for a user
    ---
    tags:
      - users
    produces:
      - application/json
    parameters:
        - in: header
          name: Accept-Language
          description: Language user is requesting
          type: string
          required: true
          default: en
        - in: header
          name: Authorization
          description: Base64 encoded session token
          required: true
          type: string
          default: Token sessionTokenHere==
        - name: username
          in: path
          description: Mapper's OpenStreetMap username
          required: true
          type: string
          default: Thinkwhere
    responses:
        200:
            description: Recommended projects found
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: No recommended projects found
        500:
            description: Internal Server Error
    """
    locale = (
        request.headers.get("accept-language")
        if request.headers.get("accept-language")
        else "en"
    )
    user_dto = await UserService.get_recommended_projects(username, locale, db)
    return user_dto.model_dump(by_alias=True)
