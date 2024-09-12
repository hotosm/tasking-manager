from distutils.util import strtobool
# from flask_restful import , current_app, request
# from schematics.exceptions import DataError

from backend.models.dtos.user_dto import UserSearchQuery

# from backend.services.users.authentication_service import token_auth
from backend.services.users.user_service import UserService
from backend.services.project_service import ProjectService
from backend.services.users.authentication_service import login_required
from backend.models.dtos.user_dto import AuthUserDTO
from fastapi import APIRouter, Depends, Request
from backend.db import get_session
from starlette.authentication import requires
from databases import Database
from backend.db import get_db


router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)


# class UsersRestAPI():
# @token_auth.login_required
@router.get("/{user_id}/")
async def get(
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


# class UsersAllAPI():
@router.get("/")
async def get(request: Request, db: Database = Depends(get_db)):
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
        query = UserSearchQuery()
        query.pagination = strtobool(request.query_params.get("pagination", "True"))
        if query.pagination:
            query.page = (
                int(request.query_params.get("page"))
                if request.query_params.get("page")
                else 1
            )
        query.per_page = int(request.query_params.get("perPage", 20))
        query.username = request.query_params.get("username")
        query.mapping_level = request.query_params.get("level")
        query.role = request.query_params.get("role")
    except Exception:
        # logger.error(f"Error validating request: {str(e)}")
        return {"Error": "Unable to fetch user list", "SubCode": "InvalidData"}, 400

    users_dto = await UserService.get_all_users(query, db)
    return users_dto


@router.get("/queries/favorites/")
async def get(
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


# class UsersQueriesUsernameAPI():
# @token_auth.login_required
@router.get("/queries/{username}/")
@requires("authenticated")
async def get(request: Request, username):
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
    user_dto = UserService.get_user_dto_by_username(username, request.user.display_name)
    return user_dto.model_dump(by_alias=True), 200


# class UsersQueriesUsernameFilterAPI():
# @token_auth.login_required
@router.get("/queries/filter/{username}/")
@requires("authenticated")
async def get(request: Request, username):
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
    page = (
        int(request.query_params.get("page")) if request.query_params.get("page") else 1
    )
    project_id = request.query_params.get("projectId", None)
    users_dto = UserService.filter_users(username, project_id, page)
    return users_dto.model_dump(by_alias=True), 200


# class UsersQueriesOwnLockedAPI():
# @token_auth.login_required
@router.get("/queries/tasks/locked/")
@requires("authenticated")
async def get(request: Request):
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
    locked_tasks = ProjectService.get_task_for_logged_in_user(request.user.display_name)
    return locked_tasks.model_dump(by_alias=True), 200


# class UsersQueriesOwnLockedDetailsAPI():
# @token_auth.login_required
@router.get("/queries/tasks/locked/details/")
@requires("authenticated")
async def get(request: Request):
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
    locked_tasks = ProjectService.get_task_details_for_logged_in_user(
        request.user.display_name, preferred_locale
    )
    return locked_tasks.model_dump(by_alias=True), 200


@router.get("/{username}/queries/interests/")
async def get(
    request: Request,
    username: str,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
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


# class UsersRecommendedProjectsAPI():
# @token_auth.login_required
@router.get("/{username}/recommended-projects/")
@requires("authenticated")
async def get(request: Request, username):
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
    user_dto = UserService.get_recommended_projects(username, locale)
    return user_dto.model_dump(by_alias=True), 200
