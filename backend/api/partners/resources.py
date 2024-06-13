from flask_restful import Resource, request

from backend.services.partner_service import PartnerService, PartnerServiceError
from backend.services.users.authentication_service import token_auth
from backend.models.postgis.user import User


class PartnerRestAPI(Resource):
    @token_auth.login_required
    def get(self, partner_id):
        """
        Get partner by id
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
        if request_user.role != 1:
            return {
                "Error": "Only admin users can manage partners.",
                "SubCode": "OnlyAdminAccess",
            }, 403

        partner = PartnerService.get_partner_by_id(partner_id)
        if partner:
            partner_dict = partner.as_dto().to_primitive()
            website_links = partner_dict.pop("website_links", [])
            for i, link in enumerate(website_links, start=1):
                partner_dict[f"name_{i}"] = link["name"]
                partner_dict[f"url_{i}"] = link["url"]
            return partner_dict, 200
        else:
            return {"message": "Partner not found"}, 404

    @token_auth.login_required
    def delete(self, partner_id):
        """
        Deletes an existing partner
        ---
        tags:
          - partners
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              type: string
              required: true
              default: Token sessionTokenHere==
            - in: header
              name: Accept-Language
              description: Language partner is requesting
              type: string
              required: true
              default: en
            - name: partner_id
              in: path
              description: Partner ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Partner deleted successfully
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            404:
                description: Partner not found
            500:
                description: Internal Server Error
        """
        request_user = User.get_by_id(token_auth.current_user())
        if request_user.role != 1:
            return {
                "Error": "Only admin users can manage partners.",
                "SubCode": "OnlyAdminAccess",
            }, 403

        try:
            PartnerService.delete_partner(partner_id)
            return {"Success": "Partner deleted"}, 200
        except PartnerServiceError as e:
            return {"message": str(e)}, 404

    @token_auth.login_required
    def put(self, partner_id):
        """
        Updates an existing partner
        ---
        tags:
          - partners
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              type: string
              required: true
              default: Token sessionTokenHere==
            - in: header
              name: Accept-Language
              description: Language partner is requesting
              type: string
              required: true
              default: en
            - name: partner_id
              in: path
              description: Partner ID
              required: true
              type: integer
            - in: body
              name: body
              required: true
              description: JSON object for updating a Partner
              schema:
                properties:
                    logo:
                        type: string
                        example: https://tasks.hotosm.org/assets/img/hot-tm-logo.svg
                    url:
                        type: string
                        example: https://hotosm.org
                    website_links:
                        type: array
                        items:
                            type: string
        responses:
            200:
                description: Partner updated successfully
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            404:
                description: Partner not found
            409:
                description: Resource duplication
            500:
                description: Internal Server Error
        """

        request_user = User.get_by_id(token_auth.current_user())
        if request_user.role != 1:
            return {
                "Error": "Only admin users can manage partners.",
                "SubCode": "OnlyAdminAccess",
            }, 403

        try:
            data = request.json
            updated_partner = PartnerService.update_partner(partner_id, data)
            updated_partner_dict = updated_partner.as_dto().to_primitive()
            return updated_partner_dict, 200
        except PartnerServiceError as e:
            return {"message": str(e)}, 404


class PartnersAllRestAPI(Resource):
    @token_auth.login_required
    def get(self):
        """
        Get all active partners
        ---
        tags:
          - partners
        produces:
          - application/json
        responses:
            200:
                description: All Partners returned successfully
            500:
                description: Internal Server Error
        """

        request_user = User.get_by_id(token_auth.current_user())
        if request_user.role != 1:
            return {
                "Error": "Only admin users can manage partners.",
                "SubCode": "OnlyAdminAccess",
            }, 403

        partner_ids = PartnerService.get_all_partners()
        partners = []
        for partner_id in partner_ids:
            partner = PartnerService.get_partner_by_id(partner_id)
            partner_dict = partner.as_dto().to_primitive()
            website_links = partner_dict.pop("website_links", [])
            for i, link in enumerate(website_links, start=1):
                partner_dict[f"name_{i}"] = link["name"]
                partner_dict[f"url_{i}"] = link["url"]
            partners.append(partner_dict)
        return partners, 200

    @token_auth.login_required
    def post(self):
        """
        Creates a new partner
        ---
        tags:
          - partners
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              type: string
              required: true
              default: Token sessionTokenHere==
            - in: header
              name: Accept-Language
              description: Language partner is requesting
              type: string
              required: true
              default: en
            - in: body
              name: body
              required: true
              description: JSON object for creating a new Partner
              schema:
                properties:
                    logo:
                        type: string
                        example: https://tasks.hotosm.org/assets/img/hot-tm-logo.svg
                    url:
                        type: string
                        example: https://hotosm.org
                    website_links:
                        type: array
                        items:
                            type: string
                        default: [
                        ]
        responses:
            201:
                description: New partner created successfully
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            409:
                description: Resource duplication
            500:
                description: Internal Server Error
        """

        request_user = User.get_by_id(token_auth.current_user())
        if request_user.role != 1:
            return {
                "Error": "Only admin users can manage partners.",
                "SubCode": "OnlyAdminAccess",
            }, 403

        try:
            data = request.json
            if data:
                new_partner = PartnerService.create_partner(data)
                partner_dict = new_partner.as_dto().to_primitive()
                return partner_dict, 201
            else:
                return {"message": "Data not provided"}, 400
        except PartnerServiceError as e:
            return {"message": str(e)}, 500


class PartnerPermalinkRestAPI(Resource):
    def get(self, permalink):
        """
        Get partner by permalink
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
            - name: permalink
              in: path
              description: The permalink of the partner
              required: true
              type: string
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
        partner = PartnerService.get_partner_by_permalink(permalink)
        if partner:
            partner_dict = partner.as_dto().to_primitive()
            website_links = partner_dict.pop("website_links", [])
            for i, link in enumerate(website_links, start=1):
                partner_dict[f"name_{i}"] = link["name"]
                partner_dict[f"url_{i}"] = link["url"]
            return partner_dict, 200
        else:
            return {"message": "Partner not found"}, 404
