from flask_restful import Resource, request
import json
from backend.services.partner_service import PartnerService
from backend.services.users.authentication_service import token_auth, tm
from backend.services.partner_service import PartnerServiceError



class PartnerRestAPI(Resource):
    def get(self, partner_id): 
        partner = PartnerService.get_partner_by_id(partner_id)
        if partner:
            partner_dict = partner.as_dto().to_primitive()
            return partner_dict, 200
        else:
            return {"message": "Partner not found"}, 404
        

    def delete(self, partner_id):
        try:
            PartnerService.delete_partner(partner_id)
            return {"Success": "Comment deleted"}, 200
        
        except PartnerServiceError as e:
            return {"message": str(e)}, 500
   
  
class PartnersAllRestAPI(Resource):
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
    