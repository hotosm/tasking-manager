from flask_restful import Resource, request
from backend.services.project_partnership_service import ProjectPartnershipService
from backend.services.users.authentication_service import token_auth
from backend.services.users.user_service import UserService
from backend.models.dtos.project_partner_dto import ProjectPartnershipDTO
from backend.models.postgis.utils import timestamp


class ProjectPartnershipsRestApi(Resource):
    def get(self, partnership_id: int):
        """
        Retrieves a Partnership by id
        ---
        tags:
            - partnership
            - partners
        produces:
            - application/json
        parameters:
            - name: partnership_id
              in: path
              description: Unique partnership ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Partnership found
            404:
                description: Partnership not found
            500:
                description: Internal Server Error
        """

        partnership_dto = ProjectPartnershipService.get_partnership_as_dto(
            partnership_id
        )
        return partnership_dto.to_primitive(), 200

    @token_auth.login_required
    def post(self):
        """Assign a partner to a project
        ---
        tags:
          - projects
          - partners
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
              description: JSON object for creating a partnership
              schema:
                properties:
                    projectId:
                        required: true
                        type: int
                        description: Unique project ID
                        default: 1
                    partnerId:
                        required: true
                        type: int
                        description: Unique partner ID
                        default: 1
                    startedOn:
                        type: date
                        description: The timestamp when the partner is added to a project. Defaults to current time.
                        default: "2017-04-11T12:38:49"
                    endedOn:
                        type: date
                        description: The timestamp when the partner ended their work on a project.
                        default: "2018-04-11T12:38:49"
        responses:
            201:
                description: Partner project association created
            400:
                description: Ivalid dates or started_on was after ended_on
            401:
                description: Forbidden, if user is not a manager of the project
            403:
                description: Forbidden, if user is not authenticated
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        try:
            partnership_dto = ProjectPartnershipDTO(request.get_json())
            is_admin = UserService.is_user_an_admin(token_auth.current_user())

            if not is_admin:
                raise ValueError()

            if partnership_dto.started_on is None:
                partnership_dto.started_on = timestamp()

            partnership_dto = ProjectPartnershipDTO(request.get_json())
            partnership_id = ProjectPartnershipService.create_partnership(
                partnership_dto.project_id,
                partnership_dto.partner_id,
                partnership_dto.started_on,
                partnership_dto.ended_on,
            )
            return (
                {
                    "Success": "Partner {} assigned to project {}".format(
                        partnership_dto.partner_id, partnership_dto.project_id
                    ),
                    "partnershipId": partnership_id,
                },
                201,
            )
        except ValueError:
            return {
                "Error": "User is not an admin",
                "SubCode": "UserPermissionError",
            }, 401
