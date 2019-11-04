from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.team_dto import TeamDTO, NewTeamDTO
from server.services.team_service import TeamService, TeamServiceError, NotFound
from server.services.users.authentication_service import token_auth, tm
from server.services.organisation_service import OrganisationService


class TeamsRestAPI(Resource):
    @token_auth.login_required
    def put(self, team_id):
        """
        Updates a team
        ---
        tags:
            - team
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: team_id
              in: path
              description: The unique team ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object for updating a team
              schema:
                properties:
                    name:
                        type: string
                        default: HOT - Mappers
                    logo:
                        type: string
                        default: https://tasks.hotosm.org/assets/img/hot-tm-logo.svg
                    visibility:
                        type: string
                        default: PUBLIC
                    members:
                        type: array
                        items:
                            schema:
                                $ref: "#/definitions/TeamMembers"
                    organisation:
                        type: string
                        default: HOT
                    description:
                        type: string
                        default: HOT's mapping editors
                    inviteOnly:
                        type: boolean
                        default: false
        responses:
            201:
                description: Team updated successfully
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            team_dto = TeamDTO(request.get_json())
            team_dto.team_id = team_id
            team_dto.validate()

            team_details_dto = TeamService.get_team_as_dto(
                team_id, tm.authenticated_user_id
            )

            org = TeamService.assert_validate_organisation(team_dto.organisation_id)
            TeamService.assert_validate_members(team_details_dto)

            if not TeamService.user_is_manager(
                team_id, tm.authenticated_user_id
            ) and not OrganisationService.user_is_admin(
                org.id, tm.authenticated_user_id
            ):
                return {"Error": "User is not a admin or a manager for the team"}, 401
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            TeamService.update_team(team_dto)
            return {"Status": "Updated"}, 200
        except NotFound as e:
            return {"Error": str(e)}, 404
        except TeamServiceError as e:
            return str(e), 402
        except Exception as e:
            error_msg = f"Team POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    def get(self, team_id):
        """
        Retrieves a Team
        ---
        tags:
            - team
        produces:
            - application/json
        parameters:
            - name: team_id
              in: path
              description: The unique team ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Team found
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: Team not found
            500:
                description: Internal Server Error
        """
        try:
            if tm.authenticated_user_id is None:
                user_id = 0
            else:
                user_id = tm.authenticated_user_id
            team_dto = TeamService.get_team_as_dto(team_id, user_id)
            return team_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "Team Not Found"}, 404
        except Exception as e:
            error_msg = f"Team GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    # TODO: Add delete API then do front end services and ui work

    @token_auth.login_required
    def delete(self, team_id):
        """
        Deletes a Team
        ---
        tags:
            - team
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: team_id
              in: path
              description: The unique team ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Team deleted
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden - Team has associated projects
            404:
                description: Team not found
            500:
                description: Internal Server Error
        """
        if not TeamService.user_is_manager(team_id, tm.authenticated_user_id):
            return {"Error": "User is not a manager for the team"}, 401
        try:
            TeamService.delete_team(team_id)
            return {"Success": "Team deleted"}, 200
        except NotFound:
            return {"Error": "Team Not Found"}, 404
        except Exception as e:
            error_msg = f"Team DELETE - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class TeamsAllAPI(Resource):
    def get(self):
        try:
            teams = TeamService.get_all_teams()
            return teams.to_primitive(), 200
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @token_auth.login_required
    def post(self):
        """
        Creates a new team
        ---
        tags:
            - team
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
              description: JSON object for creating team
              schema:
                properties:
                    name:
                        type: string
                        default: HOT - Mappers
                    logo:
                        type: string
                        default: https://tasks.hotosm.org/assets/img/hot-tm-logo.svg
                    visibility:
                        type: string
                        default: PUBLIC
                    organisation:
                        type: string
                        default: HOT
                    description:
                        type: string
                        default: HOT's mapping editors
                    inviteOnly:
                        type: boolean
                        default: false
        responses:
            201:
                description: Team created successfully
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            team_dto = NewTeamDTO(request.get_json())
            team_dto.creator = tm.authenticated_user_id
            team_dto.validate()
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            team_id = TeamService.create_team(team_dto)
            return {"teamId": team_id}, 201
        except TeamServiceError as e:
            return str(e), 402
        except Exception as e:
            error_msg = f"Team PUT - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
