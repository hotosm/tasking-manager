import io
import json
from distutils.util import strtobool
from typing import Optional

import geojson
from databases import Database
from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse, JSONResponse
from loguru import logger

from backend.db import get_db
from backend.models.dtos.project_dto import (
    DraftProjectDTO,
    ProjectDTO,
    ProjectSearchBBoxDTO,
    ProjectSearchDTO,
)
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.organisation_service import OrganisationService
from backend.services.project_admin_service import (
    InvalidData,
    InvalidGeoJson,
    ProjectAdminService,
    ProjectAdminServiceError,
)
from backend.services.project_search_service import (
    BBoxTooBigError,
    ProjectSearchService,
    ProjectSearchServiceError,
)
from backend.services.project_service import (
    NotFound,
    ProjectService,
    ProjectServiceError,
)
from backend.services.recommendation_service import ProjectRecommendationService
from backend.services.users.authentication_service import (
    login_required,
    login_required_optional,
)
from backend.services.users.user_service import UserService

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    dependencies=[Depends(get_db)],
    responses={404: {"description": "Not found"}},
)


@router.get("/{project_id}/")
async def get_project(
    request: Request,
    project_id: int,
    as_file: str = "False",
    abbreviated: bool = False,
    db: Database = Depends(get_db),
    user: Optional[AuthUserDTO] = Depends(login_required_optional),
):
    """
    Get a specified project including it's area
    ---
    tags:
        - projects
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: false
            type: string
            default: Token sessionTokenHere==
        - in: header
            name: Accept-Language
            description: Language user is requesting
            type: string
            required: true
            default: en
        - name: project_id
            in: path
            description: Unique project ID
            required: true
            type: integer
            default: 1
        - in: query
            name: as_file
            type: boolean
            description: Set to true if file download is preferred
            default: False
        - in: query
            name: abbreviated
            type: boolean
            description: Set to true if only state information is desired
            default: False
    responses:
        200:
            description: Project found
        403:
            description: Forbidden
        404:
            description: Project not found
        500:
            description: Internal Server Error
    """
    try:
        user_id = user.id if user else None
        as_file = bool(strtobool(as_file) if as_file else False)
        abbreviated = bool(strtobool(abbreviated) if abbreviated else False)
        project_dto = await ProjectService.get_project_dto_for_mapper(
            project_id,
            user_id,
            db,
            request.headers.get("accept-language"),
            abbreviated,
        )
        if project_dto:
            if as_file:
                project_dto = json.dumps(project_dto, default=str)
                return FileResponse(
                    geojson.dumps(project_dto).encode("utf-8"),
                    media_type="application/json",
                    content_disposition_type="attachment",
                    filename=f"project_{str(project_id)}.json",
                )
            return project_dto

        else:
            return JSONResponse(
                content={
                    "Error": "User not permitted: Private Project",
                    "SubCode": "PrivateProject",
                },
                status_code=403,
            )

    except ProjectServiceError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )
    finally:
        # this will try to unlock tasks that have been locked too long
        try:
            # TODO
            await ProjectService.auto_unlock_tasks(project_id, db)
        except Exception as e:
            logger.critical(str(e))


@router.post("/")
async def post(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    draft_project_dto: DraftProjectDTO = None,
):
    """
    Creates a tasking-manager project
    ---
    tags:
        - projects
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
            description: JSON object for creating draft project
            schema:
            properties:
                cloneFromProjectId:
                    type: int
                    default: 1
                    description: Specify this value if you want to clone a project, otherwise avoid information
                projectName:
                    type: string
                    default: HOT Project
                areaOfInterest:
                    schema:
                        properties:
                            type:
                                type: string
                                default: FeatureCollection
                            features:
                                type: array
                                items:
                                    schema:
                                        $ref: "#/definitions/GeoJsonFeature"
                    tasks:
                        schema:
                            properties:
                                type:
                                    type: string
                                    default: FeatureCollection
                                features:
                                    type: array
                                    items:
                                        schema:
                                            $ref: "#/definitions/GeoJsonFeature"
                    arbitraryTasks:
                        type: boolean
                        default: false
    responses:
        201:
            description: Draft project created successfully
        400:
            description: Client Error - Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        500:
            description: Internal Server Error
    """
    try:
        draft_project_dto.user_id = user.id
    except Exception as e:
        logger.error(f"error validating request: {str(e)}")
        return JSONResponse(
            content={"Error": "Unable to create project", "SubCode": "InvalidData"},
            status_code=400,
        )

    try:
        async with db.transaction():
            draft_project_id = await ProjectAdminService.create_draft_project(
                draft_project_dto, db
            )
            return JSONResponse(
                content={"projectId": draft_project_id}, status_code=201
            )
    except ProjectAdminServiceError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )

    except (InvalidGeoJson, InvalidData) as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=400,
        )

    except Exception as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=400,
        )


# @router.head("/{project_id}", response_model=ProjectDTO)
# @requires('authenticated')
def head(request: Request, project_id):
    """
    Retrieves a Tasking-Manager project
    ---
    tags:
        - projects
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
    responses:
        200:
            description: Project found
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Project not found
        500:
            description: Internal Server Error
    """
    try:
        ProjectAdminService.is_user_action_permitted_on_project(
            request.user.display_name, project_id
        )
    except ValueError:
        return {
            "Error": "User is not a manager of the project",
            "SubCode": "UserPermissionError",
        }, 403

    project_dto = ProjectAdminService.get_project_dto_for_admin(project_id)
    return project_dto.model_dump(by_alias=True), 200


@router.patch("/{project_id}/")
async def patch(
    request: Request,
    project_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    project_dto: dict = None,
):
    """
    Updates a Tasking-Manager project
    ---
    tags:
        - projects
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
        - in: body
            name: body
            required: true
            description: JSON object for updating an existing project
            schema:
            properties:
                projectStatus:
                    type: string
                    default: DRAFT
                projectPriority:
                    type: string
                    default: MEDIUM
                defaultLocale:
                    type: string
                    default: en
                difficulty:
                    type: string
                    default: EASY
                validation_permission:
                    type: string
                    default: ANY
                mapping_permission:
                    type: string
                    default: ANY
                private:
                    type: boolean
                    default: false
                changesetComment:
                    type: string
                    default: hotosm-project-1
                dueDate:
                    type: date
                    default: "2017-04-11T12:38:49"
                imagery:
                    type: string
                    default: http//www.bing.com/maps/
                josmPreset:
                    type: string
                    default: josm preset goes here
                mappingTypes:
                    type: array
                    items:
                        type: string
                    default: [BUILDINGS, ROADS]
                mappingEditors:
                    type: array
                    items:
                        type: string
                    default: [ID, JOSM, POTLATCH_2, FIELD_PAPERS]
                validationEditors:
                    type: array
                    items:
                        type: string
                    default: [ID, JOSM, POTLATCH_2, FIELD_PAPERS]
                campaign:
                    type: string
                    default: malaria
                organisation:
                    type: integer
                    default: 1
                countryTag:
                        type: array
                        items:
                            type: string
                        default: []
                licenseId:
                    type: integer
                    default: 1
                    description: Id of imagery license associated with the project
                allowedUsernames:
                    type: array
                    items:
                        type: string
                    default: ["Iain Hunter", LindaA1]
                priorityAreas:
                    type: array
                    items:
                        schema:
                            $ref: "#/definitions/GeoJsonPolygon"
                projectInfoLocales:
                    type: array
                    items:
                        schema:
                            $ref: "#/definitions/ProjectInfo"
                taskCreationMode:
                    type: integer
                    default: GRID
    responses:
        200:
            description: Project updated
        400:
            description: Client Error - Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Project not found
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
    project_dto = ProjectDTO(**project_dto)
    project_dto.project_id = project_id

    try:
        async with db.transaction():
            await ProjectAdminService.update_project(project_dto, user.id, db)
            return JSONResponse(content={"Status": "Updated"}, status_code=200)
    except InvalidGeoJson as e:
        return JSONResponse(content={"Invalid GeoJson": str(e)}, status_code=400)
    except ProjectAdminServiceError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )


@router.delete("/{project_id}/")
async def delete(
    request: Request,
    project_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Deletes a Tasking-Manager project
    ---
    tags:
        - projects
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
    responses:
        200:
            description: Project deleted
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Project not found
        500:
            description: Internal Server Error
    """
    try:
        if not await ProjectAdminService.is_user_action_permitted_on_project(
            user.id, project_id, db
        ):
            raise ValueError()
    except ValueError:
        return JSONResponse(
            content={
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            },
            status_code=403,
        )
    try:
        async with db.transaction():
            await ProjectAdminService.delete_project(project_id, user.id, db)
            return JSONResponse(content={"Success": "Project deleted"}, status_code=200)
    except ProjectAdminServiceError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )


def setup_search_dto(request) -> ProjectSearchDTO:
    search_dto = ProjectSearchDTO()
    search_dto.preferred_locale = request.headers.get("accept-language")
    search_dto.difficulty = request.query_params.get("difficulty")
    search_dto.action = request.query_params.get("action")
    search_dto.organisation_name = request.query_params.get("organisationName")
    search_dto.organisation_id = request.query_params.get("organisationId")
    search_dto.team_id = request.query_params.get("teamId")
    search_dto.campaign = request.query_params.get("campaign")
    search_dto.order_by = request.query_params.get("orderBy", "priority")
    search_dto.country = request.query_params.get("country")
    search_dto.order_by_type = request.query_params.get("orderByType", "ASC")
    search_dto.page = (
        int(request.query_params.get("page")) if request.query_params.get("page") else 1
    )
    search_dto.text_search = request.query_params.get("textSearch")
    search_dto.omit_map_results = strtobool(
        request.query_params.get("omitMapResults", "false")
    )
    search_dto.last_updated_gte = request.query_params.get("lastUpdatedFrom")
    search_dto.last_updated_lte = request.query_params.get("lastUpdatedTo")
    search_dto.created_gte = request.query_params.get("createdFrom")
    search_dto.created_lte = request.query_params.get("createdTo")

    # See https://github.com/hotosm/tasking-manager/pull/922 for more info
    try:
        authenticated_user_id = request.user.display_name if request.user else None
        if request.query_params.get("createdByMe") == "true":
            search_dto.created_by = authenticated_user_id

        if request.query_params.get("mappedByMe") == "true":
            search_dto.mapped_by = authenticated_user_id

        if request.query_params.get("favoritedByMe") == "true":
            search_dto.favorited_by = authenticated_user_id

        if request.query_params.get("managedByMe") == "true":
            search_dto.managed_by = authenticated_user_id
        if request.query_params.get("basedOnMyInterests") == "true":
            search_dto.based_on_user_interests = authenticated_user_id

    except Exception:
        pass

    mapping_types_str = request.query_params.get("mappingTypes")
    if mapping_types_str:
        search_dto.mapping_types = list(
            map(str, mapping_types_str.split(","))
        )  # Extract list from string
    search_dto.mapping_types_exact = strtobool(
        request.query_params.get("mappingTypesExact", "false")
    )
    project_statuses_str = request.query_params.get("projectStatuses")
    if project_statuses_str:
        search_dto.project_statuses = list(map(str, project_statuses_str.split(",")))
    interests_str = request.query_params.get("interests")
    if interests_str:
        search_dto.interests = map(int, interests_str.split(","))

    return search_dto


@router.get("/")
async def get(
    request: Request,
    user: Optional[AuthUserDTO] = Depends(login_required_optional),
    db: Database = Depends(get_db),
):
    """
    List and search for projects
    ---
    tags:
        - projects
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            type: string
            default: Token sessionTokenHere==
        - in: header
            name: Accept-Language
            description: Language user is requesting
            type: string
            required: true
            default: en
        - in: query
            name: difficulty
            type: string
        - in: query
            name: orderBy
            type: string
            default: priority
            enum: [id,difficulty,priority,status,last_updated,due_date]
        - in: query
            name: orderByType
            type: string
            default: ASC
            enum: [ASC, DESC]
        - in: query
            name: mappingTypes
            type: string
        - in: query
            name: mappingTypesExact
            type: boolean
            default: false
            description: if true, limits projects to match the exact mapping types requested
        - in: query
            name: organisationName
            description: Organisation name to search for
            type: string
        - in: query
            name: organisationId
            description: Organisation ID to search for
            type: integer
        - in: query
            name: campaign
            description: Campaign name to search for
            type: string
        - in: query
            name: page
            description: Page of results user requested
            type: integer
            default: 1
        - in: query
            name: textSearch
            description: Text to search
            type: string
        - in: query
            name: country
            description: Project country
            type: string
        - in: query
            name: action
            description: Filter projects by possible actions
            enum: [map, validate, any]
            type: string
        - in: query
            name: projectStatuses
            description: Authenticated PMs can search for archived or draft statuses
            type: string
        - in: query
            name: lastUpdatedFrom
            description: Filter projects whose last update date is equal or greater than a date
            type: string
        - in: query
            name: lastUpdatedTo
            description: Filter projects whose last update date is equal or lower than a date
            type: string
        - in: query
            name: createdFrom
            description: Filter projects whose creation date is equal or greater than a date
            type: string
        - in: query
            name: createdTo
            description: Filter projects whose creation date is equal or lower than a date
            type: string
        - in: query
            name: interests
            type: string
            description: Filter by interest on project
            default: null
        - in: query
            name: createdByMe
            description: Limit to projects created by the authenticated user
            type: boolean
            default: false
        - in: query
            name: mappedByMe
            description: Limit to projects mapped/validated by the authenticated user
            type: boolean
            default: false
        - in: query
            name: favoritedByMe
            description: Limit to projects favorited by the authenticated user
            type: boolean
            default: false
        - in: query
            name: managedByMe
            description:
            Limit to projects that can be managed by the authenticated user,
            excluding the ones created by them
            type: boolean
            default: false
        - in: query
            name: basedOnMyInterests
            type: boolean
            description: Filter projects based on user interests
            default: false
        - in: query
            name: teamId
            type: string
            description: Filter by team on project
            default: null
            name: omitMapResults
            type: boolean
            description: If true, it will not return the project centroid's geometries.
            default: false
    responses:
        200:
            description: Projects found
        404:
            description: No projects found
        500:
            description: Internal Server Error
    """
    try:
        user_id = user.id if user else None
        user = None
        if user_id:
            user = await UserService.get_user_by_id(user_id, db)
        search_dto = setup_search_dto(request)
        results_dto = await ProjectSearchService.search_projects(search_dto, user, db)
        return results_dto
    except NotFound:
        return JSONResponse(content={"mapResults": {}, "results": []}, status_code=200)
    except (KeyError, ValueError) as e:
        error_msg = f"Projects GET - {str(e)}"
        return JSONResponse(content={"Error": error_msg}, status_code=400)


@router.get("/queries/bbox/")
async def get(
    request: Request,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    List and search projects by bounding box
    ---
    tags:
        - projects
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
            default: en
        - in: query
            name: bbox
            description: comma separated list xmin, ymin, xmax, ymax
            type: string
            required: true
            default: 34.404,-1.034, 34.717,-0.624
        - in: query
            name: srid
            description: srid of bbox coords
            type: integer
            default: 4326
        - in: query
            name: createdByMe
            description: limit to projects created by authenticated user
            type: boolean
            required: true
            default: false

    responses:
        200:
            description: ok
        400:
            description: Client Error - Invalid Request
        403:
            description: Forbidden
        500:
            description: Internal Server Error
    """
    authenticated_user_id = request.user.display_name if request.user else None
    orgs_dto = await OrganisationService.get_organisations_managed_by_user_as_dto(
        authenticated_user_id, db
    )
    if len(orgs_dto.organisations) < 1:
        return JSONResponse(
            content={
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            },
            status_code=403,
        )

    try:
        bbox = map(float, request.query_params.get("bbox").split(","))
        input_srid = request.query_params.get("srid")
        search_dto = ProjectSearchBBoxDTO(
            bbox=bbox,
            input_srid=input_srid,
            preferred_locale=request.headers.get("accept-language", "en"),
        )
        created_by_me = (
            strtobool(request.query_params.get("createdByMe"))
            if request.query_params.get("createdByMe")
            else False
        )
        if created_by_me:
            search_dto.project_author = authenticated_user_id
        # search_dto.validate()
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return JSONResponse(
            content={
                "Error": f"Error validating request: {str(e)}",
                "SubCode": "InvalidData",
            },
            status_code=400,
        )
    try:
        geojson = await ProjectSearchService.get_projects_geojson(search_dto, db)
        return JSONResponse(content=geojson, status_code=200)
    except BBoxTooBigError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=400,
        )
    except ProjectSearchServiceError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=400,
        )


@router.get("/queries/myself/owner/")
async def get(
    request: Request,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Get all projects for logged in admin
    ---
    tags:
        - projects
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
            description: All mapped tasks validated
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Admin has no projects
        500:
            description: Internal Server Error
    """
    authenticated_user_id = request.user.display_name if request.user else None
    orgs_dto = await OrganisationService.get_organisations_managed_by_user_as_dto(
        authenticated_user_id, db
    )
    if len(orgs_dto.organisations) < 1:
        return JSONResponse(
            content={
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            },
            status_code=403,
        )

    search_dto = setup_search_dto(request)
    preferred_locale = request.headers.get("accept-language", "en")
    admin_projects = await ProjectAdminService.get_projects_for_admin(
        authenticated_user_id, preferred_locale, search_dto, db
    )
    return admin_projects


@router.get("/queries/{username}/touched/")
async def get(request: Request, username, db: Database = Depends(get_db)):
    """
    Gets projects user has mapped
    ---
    tags:
        - projects
    produces:
        - application/json
    parameters:
        - in: header
            name: Accept-Language
            description: Language user is requesting
            type: string
            required: true
            default: en
        - name: username
            in: path
            description: The users username
            required: true
            type: string
            default: Thinkwhere
    responses:
        200:
            description: Mapped projects found
        404:
            description: User not found
        500:
            description: Internal Server Error
    """
    locale = (
        request.headers.get("accept-language")
        if request.headers.get("accept-language")
        else "en"
    )
    user_dto = await UserService.get_mapped_projects(username, locale, db)
    return user_dto


@router.get("/{project_id}/queries/summary/")
async def get(request: Request, project_id: int, db: Database = Depends(get_db)):
    """
    Gets project summary
    ---
    tags:
        - projects
    produces:
        - application/json
    parameters:
        - in: header
            name: Accept-Language
            description: Language user is requesting
            type: string
            required: true
            default: en
        - name: project_id
            in: path
            description: The ID of the project
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Project Summary
        404:
            description: Project not found
        500:
            description: Internal Server Error
    """
    preferred_locale = request.headers.get("accept-language")
    summary = await ProjectService.get_project_summary(project_id, db, preferred_locale)
    return summary


@router.get("/{project_id}/queries/nogeometries/")
async def get(request: Request, project_id: int, db: Database = Depends(get_db)):
    """
    Get HOT Project for mapping
    ---
    tags:
        - projects
    produces:
        - application/json
    parameters:
        - in: header
            name: Accept-Language
            description: Language user is requesting
            type: string
            required: true
            default: en
        - name: project_id
            in: path
            description: Unique project ID
            required: true
            type: integer
            default: 1
        - in: query
            name: as_file
            type: boolean
            description: Set to true if file download is preferred
            default: False
    responses:
        200:
            description: Project found
        403:
            description: Forbidden
        404:
            description: Project not found
        500:
            description: Internal Server Error
    """
    try:
        as_file = (
            strtobool(request.query_params.get("as_file"))
            if request.query_params.get("as_file")
            else False
        )
        locale = request.headers.get("accept-language")
        project_dto = await ProjectService.get_project_dto_for_mapper(
            project_id, None, db, locale, True
        )
        # TODO Send file.
        if as_file:
            return send_file(
                io.BytesIO(geojson.dumps(project_dto).encode("utf-8")),
                mimetype="application/json",
                as_attachment=True,
                download_name=f"project_{str(project_id)}.json",
            )

        return project_dto
    except ProjectServiceError as e:
        return JSONResponse(
            content={"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]},
            status_code=403,
        )
    finally:
        # this will try to unlock tasks that have been locked too long
        try:
            ProjectService.auto_unlock_tasks(project_id)
        except Exception as e:
            logger.critical(str(e))


@router.get("/{project_id}/queries/notasks/")
async def get(
    request: Request,
    project_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Retrieves a Tasking-Manager project
    ---
    tags:
        - projects
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
    responses:
        200:
            description: Project found
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Project not found
        500:
            description: Internal Server Error
    """
    if not await ProjectAdminService.is_user_action_permitted_on_project(
        request.user.display_name, project_id, db
    ):
        return JSONResponse(
            content={
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            },
            status_code=403,
        )

    project_dto = await ProjectAdminService.get_project_dto_for_admin(project_id, db)
    return project_dto


@router.get("/{project_id}/queries/aoi/")
async def get(request: Request, project_id: int, db: Database = Depends(get_db)):
    """
    Get AOI of Project
    ---
    tags:
        - projects
    produces:
        - application/json
    parameters:
        - name: project_id
            in: path
            description: Unique project ID
            required: true
            type: integer
            default: 1
        - in: query
            name: as_file
            type: boolean
            description: Set to false if file download not preferred
            default: True
    responses:
        200:
            description: Project found
        403:
            description: Forbidden
        404:
            description: Project not found
        500:
            description: Internal Server Error
    """
    as_file = (
        strtobool(request.query_params.get("as_file"))
        if request.query_params.get("as_file")
        else False
    )

    project_aoi = await ProjectService.get_project_aoi(project_id, db)
    # TODO as file.
    if as_file:
        return send_file(
            io.BytesIO(geojson.dumps(project_aoi).encode("utf-8")),
            mimetype="application/json",
            as_attachment=True,
            download_name=f"{str(project_id)}.geojson",
        )

    return project_aoi


@router.get("/{project_id}/queries/priority-areas/")
async def get(project_id: int, db: Database = Depends(get_db)):
    """
    Get Priority Areas of a project
    ---
    tags:
        - projects
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
            description: Project found
        403:
            description: Forbidden
        404:
            description: Project not found
        500:
            description: Internal Server Error
    """
    try:
        priority_areas = await ProjectService.get_project_priority_areas(project_id, db)
        return priority_areas
    except ProjectServiceError:
        return JSONResponse(
            content={"Error": "Unable to fetch project"}, status_code=403
        )


@router.get("/queries/featured/")
async def get(request: Request, db: Database = Depends(get_db)):
    """
    Get featured projects
    ---
    tags:
        - projects
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: false
            type: string
            default: Token sessionTokenHere==
    responses:
        200:
            description: Featured projects
        500:
            description: Internal Server Error
    """
    preferred_locale = request.headers.get("accept-language")
    projects_dto = await ProjectService.get_featured_projects(preferred_locale, db)
    return projects_dto


@router.get("/queries/{project_id}/similar-projects/")
async def get(request: Request, project_id: int, db: Database = Depends(get_db)):
    """
    Get similar projects
    ---
    tags:
        - projects
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: false
            type: string
            default: Token sessionTokenHere==
        - name: project_id
            in: path
            description: Project ID to get similar projects for
            required: true
            type: integer
            default: 1
        - in: query
            name: limit
            type: integer
            description: Number of similar projects to return
            default: 4
    responses:
        200:
            description: Similar projects
        404:
            description: Project not found or project is not published
        500:
            description: Internal Server Error
    """
    authenticated_user_id = request.user.display_name if request.user else None
    limit = int(request.query_params.get("limit", 4))
    preferred_locale = request.headers.get("accept-language", "en")
    projects_dto = await ProjectRecommendationService.get_similar_projects(
        db, project_id, authenticated_user_id, preferred_locale, limit
    )
    return projects_dto


@router.get("/queries/active/")
async def get(request: Request, db: Database = Depends(get_db)):
    """
    Get active projects
    ---
    tags:
        - projects
    produces:
        - application/json
    parameters:
        - in: header
          name: Authorization
          description: Base64 encoded session token
          required: false
          type: string
          default: Token sessionTokenHere==
        - name: interval
          in: path
          description: Time interval in hours to get active project
          required: false
          type: integer
          default: 24
    responses:
        200:
            description: Active projects geojson
        404:
            description: Project not found or project is not published
        500:
            description: Internal Server Error
    """
    interval = request.query_params.get("interval", "24")
    if not interval.isdigit():
        return JSONResponse(
            content={
                "Error": "Interval must be a number greater than 0 and less than or equal to 24"
            },
            status_code=400,
        )
    interval = int(interval)
    if interval <= 0 or interval > 24:
        return JSONResponse(
            content={
                "Error": "Interval must be a number greater than 0 and less than or equal to 24"
            },
            status_code=400,
        )
    projects_dto = await ProjectService.get_active_projects(interval, db)
    return projects_dto
