from flask_restful import Resource, request
from backend.services.project_partnership_service import ProjectPartnershipService
from backend.services.users.authentication_service import token_auth
from backend.services.project_admin_service import ProjectAdminService
from backend.models.dtos.project_partner_dto import (
    ProjectPartnershipDTO,
    ProjectPartnershipUpdateDTO,
)
from backend.models.postgis.utils import timestamp


class ProjectPartnershipsRestApi(Resource):
    def get(self, partnership_id: int):
        """
        Retrieves a Partnership by id
        ---
        tags:
            - projects
            - partners
            - partnerships
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
          - partnerships
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
                description: Forbidden, if user is not a manager of this project
            403:
                description: Forbidden, if user is not authenticated
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        partnership_dto = ProjectPartnershipDTO(request.get_json())

        if not ProjectAdminService.is_user_action_permitted_on_project(
            token_auth.current_user(), partnership_dto.project_id
        ):
            return {
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            }, 401

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

    @staticmethod
    @token_auth.login_required
    def patch(partnership_id: int):
        """Update the time range for a partner project link
        ---
        tags:
          - projects
          - partners
          - partnerships
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: partnership_id
              in: path
              description: Unique partnership ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object for creating a partnership
              schema:
                properties:
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
                description: Forbidden, if user is not a manager of this project
            403:
                description: Forbidden, if user is not authenticated
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        partnership_updates = ProjectPartnershipUpdateDTO(request.get_json())
        partnership_dto = ProjectPartnershipService.get_partnership_as_dto(
            partnership_id
        )

        if not ProjectAdminService.is_user_action_permitted_on_project(
            token_auth.current_user(), partnership_dto.project_id
        ):
            return {
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            }, 401

        partnership = ProjectPartnershipService.update_partnership_time_range(
            partnership_id,
            partnership_updates.started_on,
            partnership_updates.ended_on,
        )

        return (
            {
                "Success": "Updated time range. startedOn: {}, endedOn: {}".format(
                    partnership.started_on, partnership.ended_on
                ),
                "startedOn": f"{partnership.started_on}",
                "endedOn": f"{partnership.ended_on}",
            },
            200,
        )

    @staticmethod
    @token_auth.login_required
    def delete(partnership_id: int):
        """Deletes a link between a project and a partner
        ---
        tags:
          - projects
          - partners
          - partnerships
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: partnership_id
              in: path
              description: Unique partnership ID
              required: true
              type: integer
              default: 1
        responses:
            201:
                description: Partner project association created
            401:
                description: Forbidden, if user is not a manager of this project
            403:
                description: Forbidden, if user is not authenticated
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        partnership_dto = ProjectPartnershipService.get_partnership_as_dto(
            partnership_id
        )

        if not ProjectAdminService.is_user_action_permitted_on_project(
            token_auth.current_user(), partnership_dto.project_id
        ):
            return {
                "Error": "User is not a manager of the project",
                "SubCode": "UserPermissionError",
            }, 401

        ProjectPartnershipService.delete_partnership(partnership_id)
        return (
            {
                "Success": "Partnership ID {} deleted".format(partnership_id),
            },
            200,
        )


class PartnersByProjectAPI(Resource):
    @staticmethod
    def get(project_id: int):
        """
        Retrieves the list of partners associated with a project
        ---
        tags:
            - projects
            - partners
            - partnerships
        produces:
            - application/json
        parameters:
            - name: project_id
              in: path
              description: Unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: List (possibly empty) of partners associated with this project_id
            500:
                description: Internal Server Error
        """
        partnerships = ProjectPartnershipService.get_partnerships_by_project(project_id)
        return {"partnerships": partnerships}, 200
