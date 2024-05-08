from flask_restful import Resource, request
import json
from backend.services.partner_service import PartnerService
from backend.services.users.authentication_service import token_auth, tm
from backend.services.partner_service import PartnerServiceError


class PartnerRestAPI(Resource):
    def get(self, partner_id): 
        """
        Validate partner
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
              description: Unique partner ID
              required: true
              type: integer
        responses:
            200:
                description: Partner
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        partner = PartnerService.get_partner_by_id(partner_id)
        if partner:
            partner_dict = partner.as_dto().to_primitive()
            return partner_dict, 200
        else:
            return {"message": "Partner not found"}, 404
        
    def delete(self, partner_id):
        """
        Delete a partner
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
              description: Unique partner ID
              required: true
              type: integer
        responses:
            200:
                description: New partner deleted
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            PartnerService.delete_partner(partner_id)
            return {"Success": "Partner deleted"}, 200
        
        except PartnerServiceError as e:
            return {"message": str(e)}, 500
        
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
              description: Language user is requesting
              type: string
              required: true
              default: en
            - name: partner_id
              in: path
              description: Partner ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
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
        try:
            PartnerService.update_partner(partner_id)
            return {"Success": "Partner deleted"}, 200
        
        except PartnerServiceError as e:
            return {"message": str(e)}, 500
   
  
class PartnersAllRestAPI(Resource):
    def get(self):
        """
        Get all partners
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
            - in: header
              type: string
              required: true
              default: en
        responses:
            200:
                description: All partners validated
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            404:
                description: None partners
            500:
                description: Internal Server Error
        """
        partner_ids = PartnerService.get_all_partners()
        partners = []
        for partner_id in partner_ids:
            partner = PartnerService.get_partner_by_id(partner_id)
            partner_dict = partner.as_dto().to_primitive() 
            partners.append(partner_dict)
        return partners, 200
    
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
              required: true
              type: string
              default: Token sessionTokenHere==
            - in: body
              name: body
              required: true
              description: JSON object for creating partner
        responses:
            201:
                description: Partner created successfully
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Unauthorized - Forbidden
            500:
                description: Internal Server Error
        """
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
    