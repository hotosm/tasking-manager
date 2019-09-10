from flask_restful import Resource, current_app
from server.services.tags_service import TagsService


class CountriesRestAPI(Resource):
    def get(self):
        """
        Gets all country tags
        ---
        tags:
          - countries
        produces:
          - application/json
        responses:
            200:
                description: Country tags
            500:
                description: Internal Server Error
        """
        try:
            tags = TagsService.get_all_countries()
            return tags.to_primitive(), 200
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
