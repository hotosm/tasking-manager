from flask_restful import Resource
from backend.services.project_partnership_service import ProjectPartnershipService

class ProjectPartnershipsRestApi(Resource):
    def get(self, partnership_id):
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
                description: Team found
            404:
                description: Partnership not found
            500:
                description: Internal Server Error
        """

        partnership_dto = ProjectPartnershipService.get_partnership_as_dto(partnership_id)
        return partnership_dto.to_primitive(), 200
