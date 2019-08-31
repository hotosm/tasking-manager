from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.team_dto import TeamDTO, NewTeamDTO
from server.services.team_service import TeamService, TeamServiceError, NotFound
from server.services.users.authentication_service import token_auth, tm
from server.services.organisation_service import OrganisationService


class TeamAPI(Resource):
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


class ListTeamsAPI(Resource):
    def get(self):
        try:
            teams = TeamService.get_all_teams()
            return teams.to_primitive(), 200
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class TeamMembersAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, team_id):

        try:
            username = request.get_json(force=True)["user"]
            request_type = request.get_json(force=True)["type"]
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            if request_type == "join":
                TeamService.join_team(team_id, username)
                return {"Success": "Request Send"}, 200
            elif request_type == "invite":
                TeamService.send_invite(team_id, tm.authenticated_user_id, username)
                return {"Success": "Invite Send"}, 200
        except Exception as e:
            error_msg = f"User POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @tm.pm_only(False)
    @token_auth.login_required
    def put(self, team_id):

        try:
            user_id = int(request.get_json(force=True)["user_id"])
            request_type = request.get_json(force=True)["type"]
            response = request.get_json(force=True)["response"]
            function = request.get_json(force=True)["fuction"]
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            if request_type == "join-response":
                TeamService.accept_reject_join_request(
                    team_id, user_id, tm.authenticated_user_id, function, response
                )
                return {"Success": "True"}, 200
            elif request_type == "invite-response":
                TeamService.accept_reject_invitation_request(
                    team_id, tm.authenticated_user_id, user_id, function, response
                )
                return {"Success": "True"}, 200
        except Exception as e:
            error_msg = f"User POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @tm.pm_only(False)
    @token_auth.login_required
    def delete(self, team_id):
        """
        Deletes the user from team
        ---
        tags:
          - messaging
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: message_id
              in: path
              description: The unique message
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Member deleted
            403:
                description: Forbidden, if user attempting to ready other messages
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        try:
            username = request.get_json(force=True)["user"]
            TeamService.leave_team(team_id, username)
            team_dto = TeamService.get_team_as_dto(team_id, 9507979)
            return team_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "No team member found"}, 404
        except Exception as e:
            error_msg = f"TeamMembers DELETE - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class DeleteMultipleTeamMembersAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def delete(self, team_id):
        """
        Deletes the specified message
        ---
        tags:
          - messaging
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: message_id
              in: path
              description: The unique message
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Member deleted
            403:
                description: Forbidden, if user attempting to ready other messages
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        try:

            usernames = request.get_json(force=True)["usernames"]
            for username in usernames:
                TeamService.leave_team(team_id, username)
            return {"Success": True}, 200
        except NotFound:
            return {"Error": "No team member found"}, 404
        except Exception as e:
            error_msg = f"TeamMembers DELETE - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class TeamProjectsAPI(Resource):
    
    @tm.pm_only(False)
    def get(self, project_id):
        """ Get projects associated with the project"""
        try:
            teams_dto = TeamService.get_project_teams_as_dto(project_id)
            return teams_dto.to_primitive(), 200
        except Exception as e:
            error_msg = f"Team GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @tm.pm_only(False)
    @token_auth.login_required
    def put(self, team_id, project_id):
        """ Assign team to the project"""
        try:
            TeamService.add_team_project(team_id, project_id)
            return {"Success": "Project added"}, 200
        except Exception as e:
            error_msg = f"Team PUT - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @tm.pm_only(False)
    @token_auth.login_required
    def patch(self, team_id, project_id):
        """ Update role of the project-team"""
        try:
            role = request.get_json(force=True)["role"]

            if not TeamService.user_is_manager(team_id, tm.authenticated_user_id):
                return {"Error": "User is not a admin or a manager for the team"}, 401
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            TeamService.change_team_role(team_id, project_id, role)
            return {"Status": "Updated"}, 200
        except NotFound as e:
            return {"Error": str(e)}, 404
        except TeamServiceError as e:
            return str(e), 402
        except Exception as e:
            error_msg = f"Team PATCH - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @tm.pm_only(False)
    @token_auth.login_required
    def delete(self, team_id, project_id):
        """
        Deletes the specified team project
        ---
        tags:
          - messaging
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: message_id
              in: path
              description: The unique message
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Team project deleted
            403:
                description: Forbidden, if user attempting to ready other messages
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        try:

            TeamService.delete_team_project(team_id, project_id)
            return {"Success": True}, 200
        except NotFound:
            return {"Error": "No team found"}, 404
        except Exception as e:
            error_msg = f"TeamMembers DELETE - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
