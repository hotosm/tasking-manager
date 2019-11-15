from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.services.team_service import TeamService, NotFound
from server.services.users.authentication_service import token_auth, tm


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
              description: JSON object for creating draft project
              schema:
                properties:
                    user:
                        type: string
                        default: Tasking Manager
                        required: true
                    type:
                        type: string
                        default: join
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
              description: JSON object for creating draft project
              schema:
                properties:
                    user_id:
                        type: integer
                        default: 1
                        required: true
                    type:
                        type: string
                        default: join-response
                        required: true
                    function:
                        type: string
                        default:
                        required: true
                    response:
                        type: string
                        default:
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
            user_id = int(request.get_json(force=True)["user_id"])
            request_type = request.get_json(force=True)["type"]
            response = request.get_json(force=True)["response"]
            function = request.get_json(force=True)["function"]
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
            - in: body
              name: body
              required: true
              description: JSON object for creating draft project
              schema:
                properties:
                    user_id:
                        type: integer
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
