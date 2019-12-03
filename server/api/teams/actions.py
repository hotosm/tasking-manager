from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.services.team_service import TeamService, NotFound, TeamJoinNotAllowed
from server.services.users.authentication_service import token_auth, tm
from server.models.postgis.user import User


class TeamsActionsJoinAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, team_id):
        """
        Request to join a team
        ---
        tags:
          - teams
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
              description: JSON object to join team
              schema:
                properties:
                    username:
                        type: string
                        required: true
                    role:
                        type: string
                        required: false
        responses:
            200:
                description: Member added
            403:
                description: Forbidden
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        try:
            post_data = request.get_json(force=True)
            username = post_data["username"]
            role = post_data.get("role", None)
        except (DataError, KeyError) as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            TeamService.join_team(team_id, tm.authenticated_user_id, username, role)
            return {"Success": "User joined to team"}, 200
        except TeamJoinNotAllowed as e:
            return {"Error": str(e)}, 403
        except Exception as e:
            error_msg = f"User POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    @tm.pm_only(True)
    @token_auth.login_required
    def put(self, team_id):
        """
        Take action on a team invite
        ---
        tags:
          - teams
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
              description: JSON object to accept or deny request to join team
              schema:
                properties:
                    user_id:
                        type: string
                        required: true
                    type:
                        type: string
                        default: join-response
                        required: true
                    role:
                        type: string
                        default: member
                        required: false
                    response:
                        type: string
                        require: true
        responses:
            200:
                description: Member added
            403:
                description: Forbidden
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        try:
            json_data = request.get_json(force=True)
            user_id = int(json_data["user_id"])
            request_type = json_data.get("type", "join-response")
            response = json_data["response"]
            role = json_data.get("role", "member")
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            if request_type == "join-response":
                TeamService.accept_reject_join_request(
                    team_id, user_id, tm.authenticated_user_id, role, response
                )
                return {"Success": "True"}, 200
            elif request_type == "invite-response":
                TeamService.accept_reject_invitation_request(
                    team_id, tm.authenticated_user_id, user_id, role, response
                )
                return {"Success": "True"}, 200
        except Exception as e:
            raise
            error_msg = f"Team Join PUT - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class TeamsActionsLeaveAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, team_id):
        """
        Deletes the user from team
        ---
        tags:
          - teams
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
              description: JSON object for creating draft project
              schema:
                properties:
                    username:
                        type: string
                        default: 1
                        required: true
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
            username = request.get_json(force=True)["username"]
            request_user = User().get_by_id(tm.authenticated_user_id)
            operation_allowed = False
            if request_user.role == 1 or request_user.username == username:
                TeamService.leave_team(team_id, username)
                operation_allowed = True
            else:
                team_dto = TeamService.get_team_as_dto(
                    team_id, tm.authenticated_user_id
                )
                managers = [
                    member
                    for member in team_dto.members
                    if member.function == "MANAGER"
                ]
                if request_user.username in [manager.username for manager in managers]:
                    TeamService.leave_team(team_id, username)
                    operation_allowed = True
            if operation_allowed:
                return {"Success": "User removed from the team"}, 200
            else:
                return (
                    {
                        "Error": "You don't have permissions to remove {} from this team.".format(
                            username
                        )
                    },
                    404,
                )
        except NotFound:
            return {"Error": "No team member found"}, 404
        except Exception as e:
            error_msg = f"TeamMembers DELETE - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500
