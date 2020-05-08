from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from backend.models.dtos.organisation_dto import (
    NewOrganisationDTO,
    UpdateOrganisationDTO,
)
from backend.models.postgis.user import User
from backend.services.organisation_service import (
    OrganisationService,
    OrganisationServiceError,
    NotFound,
)

from backend.services.users.user_service import UserService
from backend.services.users.authentication_service import token_auth, tm, verify_token


class OrganisationsRestAPI(Resource):
    @token_auth.login_required
    def post(self):
        """
        Creates a new organisation
        ---
        tags:
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
                    managers:
                        type: array
                        items:
                            type: string
                        default: [
                            the_node_less_traveled,
                            the_node_less_traveled_import
                        ]
        responses:
            201:
                description: Organisation created successfully
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            402:
                description: Duplicate Name - Organisation name already exists
            500:
                description: Internal Server Error
        """
        request_user = User.get_by_id(tm.authenticated_user_id)
        if request_user.role != 1:
            return {"Error": "Only admin users can create organisations."}, 403

        try:
            organisation_dto = NewOrganisationDTO(request.get_json())
            if request_user.username not in organisation_dto.managers:
                organisation_dto.managers.append(request_user.username)
            organisation_dto.validate()
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            org_id = OrganisationService.create_organisation(organisation_dto)
            return {"organisationId": org_id}, 201
        except OrganisationServiceError as e:
            return str(e), 400
        except Exception as e:
            error_msg = f"Organisation PUT - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    @token_auth.login_required
    def delete(self, organisation_id):
        """
        Deletes an organisation
        ---
        tags:
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
                description: Forbidden
            404:
                description: Organisation not found
            500:
                description: Internal Server Error
        """
        if not OrganisationService.can_user_manage_organisation(
            organisation_id, tm.authenticated_user_id
        ):
            return {"Error": "User is not an admin for the org"}, 403
        try:
            OrganisationService.delete_organisation(organisation_id)
            return {"Success": "Organisation deleted"}, 200
        except OrganisationServiceError:
            return {"Error": "Organisation has some projects"}, 403
        except NotFound:
            return {"Error": "Organisation Not Found"}, 404
        except Exception as e:
            error_msg = f"Organisation DELETE - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    def get(self, organisation_id):
        """
        Retrieves an organisation
        ---
        tags:
            - organisations
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
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
                description: Organisation found
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: Organisation not found
            500:
                description: Internal Server Error
        """
        try:
            authenticated_user_id = tm.authenticated_user_id
            if authenticated_user_id is None:
                user_id = 0
            else:
                user_id = authenticated_user_id
            organisation_dto = OrganisationService.get_organisation_by_id_as_dto(
                organisation_id, user_id
            )
            return organisation_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "Organisation Not Found"}, 404
        except Exception as e:
            error_msg = f"Organisation GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    @token_auth.login_required
    def patch(self, organisation_id):
        """
        Updates an organisation
        ---
        tags:
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
                    managers:
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
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        if not OrganisationService.can_user_manage_organisation(
            organisation_id, tm.authenticated_user_id
        ):
            return {"Error": "User is not an admin for the org"}, 403
        try:
            organisation_dto = UpdateOrganisationDTO(request.get_json())
            organisation_dto.organisation_id = organisation_id
            organisation_dto.validate()
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            OrganisationService.update_organisation(organisation_dto)
            return {"Status": "Updated"}, 200
        except NotFound as e:
            return {"Error": str(e)}, 404
        except OrganisationServiceError as e:
            return str(e), 402
        except Exception as e:
            error_msg = f"Organisation PATCH - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class OrganisationsAllAPI(Resource):
    def get(self):
        """
        List all organisations
        ---
        tags:
          - organisations
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              type: string
              default: Token sessionTokenHere==
            - name: manager_user_id
              in: query
              description: Filter projects on managers with this user_id
              required: false
              type: integer
        responses:
            200:
                description: Organisations found
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Unauthorized - Not allowed
            404:
                description: Organisations not found
            500:
                description: Internal Server Error
        """

        # Restrict some of the parameters to some permissions
        authenticated_user_id = tm.authenticated_user_id
        try:
            manager_user_id = int(request.args.get("manager_user_id"))
        except Exception:
            manager_user_id = None

        if manager_user_id is not None:
            try:
                # Verify login
                verify_token(
                    request.environ.get("HTTP_AUTHORIZATION").split(None, 1)[1]
                )

                # Check whether user is admin (can do any query) or user is checking for own projects
                if (
                    not UserService.is_user_an_admin(authenticated_user_id)
                    and authenticated_user_id != manager_user_id
                ):
                    raise ValueError

            except Exception:
                return {"Error": "Unauthorized - Not allowed"}, 403

        # Obtain organisations
        try:
            results_dto = OrganisationService.get_organisations_as_dto(
                manager_user_id, authenticated_user_id
            )
            return results_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "No projects found"}, 404
        except Exception as e:
            error_msg = f"Organisations GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500
