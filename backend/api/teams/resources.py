from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from backend.models.dtos.team_dto import (
    NewTeamDTO,
    UpdateTeamDTO,
    TeamSearchDTO,
)
from backend.services.team_service import TeamService, TeamServiceError
from backend.services.users.authentication_service import token_auth
from backend.services.organisation_service import OrganisationService
from backend.services.users.user_service import UserService
from distutils.util import strtobool


class TeamsRestAPI(Resource):
    @token_auth.login_required
    def patch(self, team_id):
        """
        Updates a team
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
              description: JSON object for updating a team
              schema:
                properties:
                    name:
                        type: string
                        default: HOT - Mappers
                    logo:
                        type: string
                        default: https://tasks.hotosm.org/assets/img/hot-tm-logo.svg
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
            200:
                description: Team updated successfully
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            team = TeamService.get_team_by_id(team_id)
            team_dto = UpdateTeamDTO(request.get_json())
            team_dto.team_id = team_id
            team_dto.validate()

            authenticated_user_id = token_auth.current_user()
            if not TeamService.is_user_team_manager(
                team_id, authenticated_user_id
            ) and not OrganisationService.can_user_manage_organisation(
                team.organisation_id, authenticated_user_id
            ):
                return {
                    "Error": "User is not a admin or a manager for the team",
                    "SubCode": "UserNotTeamManager",
                }, 403
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return {"Error": str(e), "SubCode": "InvalidData"}, 400

        try:
            TeamService.update_team(team_dto)
            return {"Status": "Updated"}, 200
        except TeamServiceError as e:
            return str(e), 402

    def get(self, team_id):
        """
        Retrieves a Team
        ---
        tags:
            - teams
        produces:
            - application/json
        parameters:
            - name: team_id
              in: path
              description: Unique team ID
              required: true
              type: integer
              default: 1
            - in: query
              name: omitMemberList
              type: boolean
              description: Set it to true if you don't want the members list on the response.
              default: False
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
        authenticated_user_id = token_auth.current_user()
        omit_members = strtobool(request.args.get("omitMemberList", "false"))
        if authenticated_user_id is None:
            user_id = 0
        else:
            user_id = authenticated_user_id
        team_dto = TeamService.get_team_as_dto(team_id, user_id, omit_members)
        return team_dto.to_primitive(), 200

    # TODO: Add delete API then do front end services and ui work

    @token_auth.login_required
    def delete(self, team_id):
        """
        Deletes a Team
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
        if not TeamService.is_user_team_manager(team_id, token_auth.current_user()):
            return {
                "Error": "User is not a manager for the team",
                "SubCode": "UserNotTeamManager",
            }, 401

        return TeamService.delete_team(team_id)


class TeamsAllAPI(Resource):
    @token_auth.login_required
    def get(self):
        """
        Gets all teams
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
            - in: query
              name: team_name
              description: name of the team to filter by
              type: str
              default: null
            - in: query
              name: member
              description: user ID to filter teams that the users belongs to, user must be active.
              type: str
              default: null
            - in: query
              name: manager
              description: user ID to filter teams that the users has MANAGER role
              type: str
              default: null
            - in: query
              name: member_request
              description: user ID to filter teams that the user has send invite request to
              type: str
              default: null
            - in: query
              name: team_role
              description: team role for project
              type: str
              default: null
            - in: query
              name: organisation
              description: organisation ID to filter teams
              type: integer
              default: null
            - in: query
              name: omitMemberList
              type: boolean
              description: Set it to true if you don't want the members list on the response.
              default: False
            - in: query
              name: fullMemberList
              type: boolean
              description: Set it to true if you want full members list otherwise it will be limited to 10 per role.
              default: True
            - in: query
              name: paginate
              type: boolean
              description: Set it to true if you want to paginate the results.
              default: False
            - in: query
              name: page
              type: integer
              description: Page number to return.
              default: 1
            - in: query
              name: perPage
              type: integer
              description: Number of results per page.
              default: 10

        responses:
            201:
                description: Team list returned successfully
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        user_id = token_auth.current_user()
        search_dto = TeamSearchDTO()
        search_dto.team_name = request.args.get("team_name", None)
        search_dto.member = request.args.get("member", None)
        search_dto.manager = request.args.get("manager", None)
        search_dto.member_request = request.args.get("member_request", None)
        search_dto.team_role = request.args.get("team_role", None)
        search_dto.organisation = request.args.get("organisation", None)
        search_dto.omit_member_list = strtobool(
            request.args.get("omitMemberList", "false")
        )
        search_dto.full_member_list = strtobool(
            request.args.get("fullMemberList", "true")
        )
        search_dto.paginate = strtobool(request.args.get("paginate", "false"))
        search_dto.page = request.args.get("page", 1)
        search_dto.per_page = request.args.get("perPage", 10)
        search_dto.user_id = user_id
        search_dto.validate()

        teams = TeamService.get_all_teams(search_dto)
        return teams.to_primitive(), 200

    @token_auth.login_required
    def post(self):
        """
        Creates a new team
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
              description: JSON object for creating team
              schema:
                properties:
                    name:
                        type: string
                        default: HOT - Mappers
                    organisation_id:
                        type: integer
                        default: 1
                    description:
                        type: string
                    visibility:
                        type: string
                        enum:
                        - "PUBLIC"
                        - "PRIVATE"
                    joinMethod:
                        type: string
                        enum:
                        - "ANY"
                        - "BY_REQUEST"
                        - "BY_INVITE"
        responses:
            201:
                description: Team created successfully
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Unauthorized - Forbidden
            500:
                description: Internal Server Error
        """
        user_id = token_auth.current_user()

        try:
            team_dto = NewTeamDTO(request.get_json())
            team_dto.creator = user_id
            team_dto.validate()
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return {"Error": str(e), "SubCode": "InvalidData"}, 400

        try:
            organisation_id = team_dto.organisation_id

            is_org_manager = OrganisationService.is_user_an_org_manager(
                organisation_id, user_id
            )
            is_admin = UserService.is_user_an_admin(user_id)
            if is_admin or is_org_manager:
                team_id = TeamService.create_team(team_dto)
                return {"teamId": team_id}, 201
            else:
                error_msg = "User not permitted to create team for the Organisation"
                return {"Error": error_msg, "SubCode": "CreateTeamNotPermitted"}, 403
        except TeamServiceError as e:
            return str(e), 400
