from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.organisation_dto import OrganisationDTO, NewOrganisationDTO
from server.services.organisation_service import OrganisationService, OrganisationServiceError, NotFound
from server.services.users.authentication_service import token_auth, tm


class OrganisationAPI(Resource):

    @token_auth.login_required
    def put(self):
        """
        Creates a new organisation
        ---
        tags:
            - organisation
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
                    logo:
                        type: string
                        default: https://tasks.hotosm.org/assets/img/hot-tm-logo.svg
                    url:
                        type: string
                        default: https://hotosm.org
                    visibility:
                        type: string
                        default: PUBLIC
        responses:
            201:
                description: Organisation created successfully
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            402:
                description: Duplicate Name - Organisation name already exists
            500:
                description: Internal Server Error
        """
        try:
            org_dto = NewOrganisationDTO(request.get_json())
            org_dto.admins = [tm.authenticated_user_id]
            org_dto.validate()
        except DataError as e:
            current_app.logger.error(f'error validating request: {str(e)}')
            return str(e), 400

        try:
            org_id = OrganisationService.create_organisation(org_dto)
            return {"organisationId": org_id}, 201
        except OrganisationServiceError as e:
            return str(e), 402
        except Exception as e:
            error_msg = f'Organisation PUT - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @token_auth.login_required
    def delete(self, organisation_id):
        """
        Deletes an Organisation
        ---
        tags:
            - organisation
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
                description: Forbidden - Organisation has associated projects
            404:
                description: Organisation not found
            500:
                description: Internal Server Error
        """
        if not OrganisationService.user_is_admin(organisation_id, tm.authenticated_user_id):
            return {"Error": "User is not an admin for the org"}, 401
        try:
            OrganisationService.delete_organisation(organisation_id)
            return {"Success": "Organisation deleted"}, 200
        except OrganisationServiceError:
            return {"Error": "Organisation has some projects"}, 403
        except NotFound:
            return {"Error": "Organisation Not Found"}, 404
        except Exception as e:
            error_msg = f'Organisation DELETE - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @token_auth.login_required
    def get(self, organisation_name):
        """
        Retrieves a Organisation
        ---
        tags:
            - organisation
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: organisation_name
              in: path
              description: The unique organisation ID
              required: true
              type: string
              default: HOT
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
        try:
            org_dto = OrganisationService.get_organisation_dto_by_name(organisation_name)
            return org_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "Organisation Not Found"}, 404
        except Exception as e:
            error_msg = f'Organisation GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @token_auth.login_required
    def post(self, organisation_id):
        """
        Updates an organisation
        ---
        tags:
            - organisation
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
                    logo:
                        type: string
                        default: https://tasks.hotosm.org/assets/img/hot-tm-logo.svg
                    url:
                        type: string
                        default: https://hotosm.org
                    visibility:
                        type: string
                        default: PUBLIC
                    admins:
                        type: array
                        items:
                            type: string
                        default: [
                            the_node_less_traveled,
                            the_node_less_traveled_import
                        ]
        responses:
            201:
                description: Organisation updated successfully
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        if not OrganisationService.user_is_admin(organisation_id, tm.authenticated_user_id):
            return {"Error": "User is not an admin for the org"}, 401
        try:
            org_dto = OrganisationDTO(request.get_json())
            org_dto.organisation_id = organisation_id
            org_dto.validate()
        except DataError as e:
            current_app.logger.error(f'error validating request: {str(e)}')
            return str(e), 400

        try:
            OrganisationService.update_organisation(org_dto)
            return {"Status": "Updated"}, 200
        except NotFound as e:
            return {"Error": str(e)}, 404
        except OrganisationServiceError as e:
            return str(e), 402
        except Exception as e:
            error_msg = f'Organisation POST - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
