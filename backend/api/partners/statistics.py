from flask_restful import Resource, request

from backend.services.users.authentication_service import token_auth
from backend.models.postgis.user import User
from backend.services.partner_service import PartnerService
from backend.services.users.user_service import UserRole
from backend.exceptions import BadRequest

# Replaceable by another service which implements the method:
# fetch_partner_stats(id_inside_service, from_date, to_date) -> PartnerStatsDTO
from backend.services.mapswipe_service import MapswipeService


class PartnerStatisticsAPI(Resource):
    @token_auth.login_required
    def get(self, partner_id):
        """
        Get partner statistics by id
        ---
        tags:
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
            - in: query
              name: fromDate
              type: string
              example: 2024-01-01
            - in: query
              name: toDate
              type: string
              example: 2024-09-01
            - name: partner_id
              in: path
              description: The id of the partner
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Partner found
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: Partner not found
            500:
                description: Internal Server Error
        """

        request_user = User.get_by_id(token_auth.current_user())
        if request_user.role != UserRole.ADMIN.value:
            return {
                "Error": "Only admin users can manage partners.",
                "SubCode": "OnlyAdminAccess",
            }, 403

        mapswipe = MapswipeService()
        from_date = request.args.get("fromDate")
        to_date = request.args.get("toDate")

        if from_date is not None and to_date is not None and from_date > to_date:
            raise BadRequest(
                sub_code="INVALID_TIME_RANGE",
                message="fromDate should be less than toDate",
                from_date=from_date,
                to_date=to_date,
            )

        partner = PartnerService.get_partner_by_id(partner_id)

        return mapswipe.fetch_partner_stats(
            partner.mapswipe_group_id, from_date, to_date
        ).to_primitive(), 200
