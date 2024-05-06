from flask_restful import Resource, request
import json
from backend.services.partner_service import PartnerService
from backend.services.users.authentication_service import token_auth, tm
from backend.models.new_models.partner.partner_dto import (UpdatePartnerDTO)
from backend.models.new_models.partner.partner import Partner
from backend.services.partner_service import PartnerServiceError


class PartnerRestAPI(Resource):
    def get(self, partner_id): 
        partner = PartnerService.get_partner_by_id(partner_id)
        if partner:
            partner_dict = partner.as_dto().to_primitive()
            return partner_dict, 200
        else:
            return {"message": "Partner not found"}, 404
        

    def put(self, partner_id):
        try:
            data = request.json
            PartnerService.update_partner(partner_id, data)
            return {"message": "Partner updated successfully"}, 200
        except PartnerServiceError as e:
            return {"message": str(e)}, 500
        

    def delete(self, partner_id):
        partner = PartnerService.get_partner_by_id(partner_id)
        if partner:
            partner.delete()
            return {"message": "Partner deleted successfully"}, 200
        else:
            return {"message": "Partner not found"}, 404
  
class PartnersAllAPI(Resource):
    def get(self):
        partner_ids = PartnerService.get_all_partners()
        partners = []
        for partner_id in partner_ids:
            partner = PartnerService.get_partner_by_id(partner_id)
            partner_dict = partner.as_dto().to_primitive() 
            partners.append(partner_dict)
        return partners, 200
    
    def post(self):
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
    