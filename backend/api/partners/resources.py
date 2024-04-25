from flask_restful import Resource, request
from backend.models.dtos.partner_dto import PartnerDTO, UpdatePartnerDTO
from backend.services.partner_service import PartnerService
from backend.services.users.authentication_service import token_auth, tm


class PartnersAllRestAPI(Resource):
    def get(self):
        partners_dto = PartnerService.get_all_partners()
        return partners_dto.to_primitive(), 200

    def post(self):
        try: 
            data = request.json
            link_descriptions = []
            link_urls = []

            for i in range(1, 6):
                description_key = f'link_description_{i}'
                url_key = f'link_url_{i}'
                if description_key in data and url_key in data:
                    link_descriptions.append(data[description_key])
                    link_urls.append(data[url_key])

            website_links = []
            for description, url in zip(link_descriptions, link_urls):
                link = {'description': description, 'url': url}
                website_links.append(link)

            partner_dto = PartnerDTO(data)
            partner_dto.website_links = website_links
    
            partner_id = PartnerService.create_partner(partner_dto)
    
            return {'partner_id': partner_id}, 200
        
        except Exception as e:
            return {'error': str(e)}, 500


class PartnerRestAPI(Resource):

    def get(self, partner_id):
        authenticated_user_id = token_auth.current_user()

        if authenticated_user_id:
            partner_dto = PartnerService.get_partner_as_dto(
                partner_id, authenticated_user_id
            )
        else:
            partner_dto = PartnerService.get_partner_as_dto(partner_id, 0)
        
        website_links_str = []
        for link in partner_dto.website_links:
            link_str = f"{{'description': '{link['description']}', 'url': '{link['url']}'}}"
            website_links_str.append(link_str)
        partner_dto.website_links = "[" + ", ".join(website_links_str) + "]"
        
        return partner_dto.to_primitive(), 200

    def patch(self, partner_id):
        try:
            partner_dto = UpdatePartnerDTO(request.get_json())
            PartnerService.update_partner(partner_dto, partner_id)
            return {'message': 'Partner updated successfully'}, 200
        except ValueError as e:
            return {'message': str(e)}, 400
     
    @token_auth.login_required
    def delete(self, partner_id):
        try:
            PartnerService.delete_partner(partner_id)
            return {'message': 'Partner deleted successfully'}, 200
        except ValueError as e:
            return {'message': str(e)}, 400