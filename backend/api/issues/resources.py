from databases import Database
from fastapi import APIRouter, Depends, Request, Body
from fastapi.responses import JSONResponse
from loguru import logger

from backend.models.dtos.mapping_issues_dto import MappingIssueCategoryDTO
from backend.services.mapping_issues_service import MappingIssueCategoryService
from backend.services.users.authentication_service import tm
from backend.db import get_session
from starlette.authentication import requires
from backend.db import get_db
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/tasks",
    tags=["issues"],
    dependencies=[Depends(get_session)],
    responses={404: {"description": "Not found"}},
)

ISSUE_NOT_FOUND = "Mapping-issue category not found"


# class IssuesRestAPI(Resource):
@router.get("/issues/categories/{category_id}/")
async def get(category_id: int, db: Database = Depends(get_db)):
    """
    Get specified mapping-issue category
    ---
    tags:
        - issues
    produces:
        - application/json
    parameters:
        - name: category_id
            in: path
            description: The unique mapping-issue category ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Mapping-issue category found
        404:
            description: Mapping-issue category not found
        500:
            description: Internal Server Error
    """
    category_dto = await MappingIssueCategoryService.get_mapping_issue_category_as_dto(
        category_id, db
    )
    return category_dto.model_dump(by_alias=True)


@router.patch("/issues/categories/{category_id}/")
# @tm.pm_only()
async def patch(
    request: Request,
    category_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    data: MappingIssueCategoryDTO = Body(...),
):
    """
    Update an existing mapping-issue category
    ---
    tags:
        - issues
    produces:
        - application/json
    parameters:
        - in: header
          name: Authorization
          description: Base64 encoded session token
          required: true
          type: string
          default: Token sessionTokenHere==
        - name: category_id
          in: path
          description: The unique mapping-issue category ID
          required: true
          type: integer
          default: 1
        - in: body
          name: body
          required: true
          description: JSON object for updating a mapping-issue category
          schema:
              properties:
                  name:
                      type: string
                  description:
                      type: string
    responses:
        200:
            description: Mapping-issue category updated
        400:
            description: Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: Mapping-issue category not found
        500:
            description: Internal Server Error
    """
    try:
        category_dto = data
        category_dto.category_id = category_id
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return JSONResponse(
            content={
                "Error": "Unable to update mapping issue category",
                "SubCode": "InvalidData",
            },
            status_code=400,
        )

    updated_category = await MappingIssueCategoryService.update_mapping_issue_category(
        category_dto, db
    )
    return updated_category.model_dump(by_alias=True)


@router.delete("/issues/categories/{category_id}/")
# @tm.pm_only()
async def delete(
    request: Request,
    category_id: int,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
):
    """
    Delete the specified mapping-issue category.
    Note that categories can be deleted only if they have never been associated with a task.\
    To instead archive a used category that is no longer needed, \
    update the category with its archived flag set to true.
    ---
    tags:
        - issues
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: category_id
            in: path
            description: The unique mapping-issue category ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Mapping-issue category deleted
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: Mapping-issue category not found
        500:
            description: Internal Server Error
    """
    await MappingIssueCategoryService.delete_mapping_issue_category(category_id, db)
    return JSONResponse(
        content={"Success": "Mapping-issue category deleted"}, status_code=200
    )


@router.get("/issues/categories/")
async def get(request: Request, db: Database = Depends(get_db)):
    """
    Gets all mapping issue categories
    ---
    tags:
        - issues
    produces:
        - application/json
    parameters:
        - in: query
            name: includeArchived
            description: Optional filter to include archived categories
            type: boolean
            default: false
    responses:
        200:
            description: Mapping issue categories
        500:
            description: Internal Server Error
    """
    include_archived = request.query_params.get("includeArchived") == "true"
    categories = await MappingIssueCategoryService.get_all_mapping_issue_categories(
        include_archived, db
    )
    return categories.model_dump(by_alias=True)


@router.post("/issues/categories/", response_model=MappingIssueCategoryDTO)
# @tm.pm_only()
async def post(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    db: Database = Depends(get_db),
    data: dict = Body(...),
):
    """
    Creates a new mapping-issue category
    ---
    tags:
        - issues
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
          description: JSON object for creating a new mapping-issue category
          schema:
              properties:
                  name:
                      type: string
                      required: true
                  description:
                      type: string
    responses:
        200:
            description: New mapping-issue category created
        400:
            description: Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        500:
            description: Internal Server Error
    """
    try:
        category_dto = MappingIssueCategoryDTO(**data)
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return JSONResponse(
            content={
                "Error": "Unable to create a new mapping issue category",
                "SubCode": "InvalidData",
            },
            status_code=400,
        )

    new_category_id = await MappingIssueCategoryService.create_mapping_issue_category(
        category_dto, db
    )
    return JSONResponse(content={"categoryId": new_category_id}, status_code=200)
