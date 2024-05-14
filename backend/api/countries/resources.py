from flask_restful import Resource
from backend.services.tags_service import TagsService


class CountriesRestAPI(Resource):
    def get(self):
        """
        Fetch all Country tags
        ---
        tags:
          - countries
        produces:
          - application/json
        responses:
            200:
                description: All Country tags returned
            500:
                description: Internal Server Error
        """
        tags = TagsService.get_all_countries()
        return tags.to_primitive(), 200
