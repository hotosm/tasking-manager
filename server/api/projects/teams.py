from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.services.team_service import TeamService, TeamServiceError, NotFound
from server.services.users.authentication_service import token_auth, tm


class ProjectsTeamsAPI(Resource):
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
