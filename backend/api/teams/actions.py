from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError
import threading

from backend.models.dtos.message_dto import MessageDTO
from backend.services.team_service import (
    TeamService,
    TeamJoinNotAllowed,
    TeamServiceError,
)
from backend.services.users.authentication_service import token_auth, tm
from backend.models.postgis.user import User

TEAM_NOT_FOUND = "Team not found"


class TeamsActionsJoinAPI(Resource):
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
              description: Unique team ID
              required: true
              type: integer
              default: 1
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
        authenticated_user_id = token_auth.current_user()
        try:
            TeamService.request_to_join_team(team_id, authenticated_user_id)
            return {"Success": "Join request successful"}, 200
        except TeamServiceError as e:
            return {"Error": str(e), "SubCode": "InvalidRequest"}, 400

    @tm.pm_only(False)
    @token_auth.login_required
    def patch(self, team_id):
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
              description: Unique team ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object to accept or reject a request to join team
              schema:
                properties:
                    username:
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
                    action:
                        type: string
                        default: accept
                        required: true
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
            username = json_data["username"]
            request_type = json_data.get("type", "join-response")
            action = json_data["action"]
            role = json_data.get("role", "member")
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return {
                "Error": str(e),
                "SubCode": "InvalidData",
            }, 400

        authenticated_user_id = token_auth.current_user()
        if request_type == "join-response":
            if TeamService.is_user_team_manager(team_id, authenticated_user_id):
                TeamService.accept_reject_join_request(
                    team_id, authenticated_user_id, username, role, action
                )
                return {"Success": "True"}, 200
            else:
                return (
                    {
                        "Error": "You don't have permissions to approve this join team request",
                        "SubCode": "ApproveJoinError",
                    },
                    403,
                )
        elif request_type == "invite-response":
            TeamService.accept_reject_invitation_request(
                team_id, authenticated_user_id, username, role, action
            )
            return {"Success": "True"}, 200


class TeamsActionsAddAPI(Resource):
    @token_auth.login_required
    def post(self, team_id):
        """
        Add members to the team
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
              description: Unique team ID
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
            return {
                "Error": str(e),
                "SubCode": "InvalidData",
            }, 400

        try:
            authenticated_user_id = token_auth.current_user()
            TeamService.add_user_to_team(team_id, authenticated_user_id, username, role)
            return {"Success": "User added to the team"}, 200
        except TeamJoinNotAllowed as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 403


class TeamsActionsLeaveAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, team_id):
        """
        Removes a user from a team
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
              description: Unique team ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object to remove user from team
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
        authenticated_user_id = token_auth.current_user()
        username = request.get_json(force=True)["username"]
        request_user = User.get_by_id(authenticated_user_id)
        if (
            TeamService.is_user_team_manager(team_id, authenticated_user_id)
            or request_user.username == username
        ):
            TeamService.leave_team(team_id, username)
            return {"Success": "User removed from the team"}, 200
        else:
            return (
                {
                    "Error": "You don't have permissions to remove {} from this team.".format(
                        username
                    ),
                    "SubCode": "RemoveUserError",
                },
                403,
            )


class TeamsActionsMessageMembersAPI(Resource):
    @token_auth.login_required
    def post(self, team_id):
        """
        Message all team members
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
              description: Unique team ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object for creating message
              schema:
                properties:
                    subject:
                        type: string
                        default: Thanks
                        required: true
                    message:
                        type: string
                        default: Thanks for your contribution
                        required: true
        responses:
            200:
                description: Message sent successfully
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            authenticated_user_id = token_auth.current_user()
            message_dto = MessageDTO(request.get_json())
            # Validate if team is present
            team = TeamService.get_team_by_id(team_id)

            is_manager = TeamService.is_user_team_manager(
                team_id, authenticated_user_id
            )
            if not is_manager:
                raise ValueError
            message_dto.from_user_id = authenticated_user_id
            message_dto.validate()
            if not message_dto.message.strip() or not message_dto.subject.strip():
                raise DataError(
                    {"Error": "Empty message not allowed", "SubCode": "EmptyMessage"}
                )
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {
                "Error": "Request payload did not match validation",
                "SubCode": "InvalidData",
            }, 400
        except ValueError:
            return {
                "Error": "Unauthorised to send message to team members",
                "SubCode": "UserNotPermitted",
            }, 403

        try:
            threading.Thread(
                target=TeamService.send_message_to_all_team_members,
                args=(team_id, team.name, message_dto),
            ).start()

            return {"Success": "Message sent successfully"}, 200
        except ValueError as e:
            return {"Error": str(e)}, 403
