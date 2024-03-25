from backend.models.dtos.mapping_issues_dto import MappingIssueCategoryDTO
from backend.services.mapping_issues_service import MappingIssueCategoryService
from backend.services.users.authentication_service import tm
from fastapi import APIRouter, Depends, Request
from backend.db.database import get_db
from starlette.authentication import requires
from loguru import logger

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
    dependencies=[Depends(get_db)],
    responses={404: {"description": "Not found"}},
)

ISSUE_NOT_FOUND = "Mapping-issue category not found"


# class IssuesRestAPI(Resource):
@router.get("/issues/categories/{category_id}/")
async def get(category_id: int):
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
    category_dto = MappingIssueCategoryService.get_mapping_issue_category_as_dto(
        category_id
    )
    return category_dto.model_dump(by_alias=True), 200

@router.patch("/issues/categories/{category_id}/")
@requires("authenticated")
@tm.pm_only()
async def patch(request: Request, category_id: int):
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
            category_dto = MappingIssueCategoryDTO(request.get_json())
            category_dto.category_id = category_id
            category_dto.validate()
        except Exception as e:
            logger.error(f"Error validating request: {str(e)}")
            return {
                "Error": "Unable to update mapping issue category",
                "SubCode": "InvalidData",
            }, 400

        updated_category = MappingIssueCategoryService.update_mapping_issue_category(
            category_dto
        )
        return updated_category.model_dump(by_alias=True), 200

@router.delete("/issues/categories/{category_id}/")
@requires("authenticated")
@tm.pm_only()
def delete(request: Request, category_id: int):
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
    MappingIssueCategoryService.delete_mapping_issue_category(category_id)
    return {"Success": "Mapping-issue category deleted"}, 200


# class IssuesAllAPI(Resource):
@router.get("/issues/categories/")
async def get(request: Request):
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
    categories = MappingIssueCategoryService.get_all_mapping_issue_categories(
        include_archived
    )
    return categories.model_dump(by_alias=True), 200

@router.post("/issues/categories/")
@requires("authenticated")
@tm.pm_only()
def post(request: Request):
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
            category_dto = MappingIssueCategoryDTO(request.json())
            category_dto.validate()
        except Exception as e:
            logger.error(f"Error validating request: {str(e)}")
            return {
                "Error": "Unable to create a new mapping issue category",
                "SubCode": "InvalidData",
            }, 400

        new_category_id = MappingIssueCategoryService.create_mapping_issue_category(
            category_dto
        )
        return {"categoryId": new_category_id}, 200
