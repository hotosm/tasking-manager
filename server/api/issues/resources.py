from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from server.models.dtos.mapping_issues_dto import MappingIssueCategoryDTO
from server.models.postgis.utils import NotFound
from server.services.mapping_issues_service import MappingIssueCategoryService
from server.services.users.authentication_service import token_auth, tm


class IssuesRestAPI(Resource):
    def get(self, category_id):
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
        try:
            category_dto = MappingIssueCategoryService.get_category_as_dto(category_id)
            return category_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "Mapping-issue category Not Found"}, 404
        except Exception as e:
            error_msg = f"Mapping-issue category PUT - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch mapping issue category"}, 500

    @tm.pm_only()
    @token_auth.login_required
    def patch(self, category_id):
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
            500:
                description: Internal Server Error
        """
        try:
            category_dto = MappingIssueCategoryDTO(request.get_json())
            category_dto.category_id = category_id
            category_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to update mapping issue category"}, 400

        try:
            updated_category = MappingIssueCategoryService.update_mapping_issue_category(
                category_dto
            )
            return updated_category.to_primitive(), 200
        except NotFound:
            return {"Error": "Mapping-issue category Not Found"}, 404
        except Exception as e:
            error_msg = f"Mapping-issue category PUT - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to update mapping issue category"}, 500

    @tm.pm_only()
    @token_auth.login_required
    def delete(self, category_id):
        """
        Delete the specified mapping-issue category. Note that categories can
        be deleted only if they have never been associated with a task. To
        instead archive a used category that is no longer needed, update the
        category with its archived flag set to true.
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
        try:
            MappingIssueCategoryService.delete_mapping_issue_category(category_id)
            return {"Success": "Mapping-issue category deleted"}, 200
        except NotFound:
            return {"Error": "Mapping-issue category Not Found"}, 404
        except Exception as e:
            error_msg = f"Mapping-issue category DELETE - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to delete mapping issue category"}, 500


class IssuesAllAPI(Resource):
    def get(self):
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
        try:
            include_archived = request.args.get("includeArchived") == "true"
            categories = MappingIssueCategoryService.get_all_mapping_issue_categories(
                include_archived
            )
            return categories.to_primitive(), 200
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch mapping issue categories"}, 500

    @tm.pm_only()
    @token_auth.login_required
    def post(self):
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
            category_dto = MappingIssueCategoryDTO(request.get_json())
            category_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to create a new mapping issue category"}, 400

        try:
            new_category_id = MappingIssueCategoryService.create_mapping_issue_category(
                category_dto
            )
            return {"categoryId": new_category_id}, 200
        except Exception as e:
            error_msg = f"Mapping-issue category POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to create a new mapping issue category"}, 500
