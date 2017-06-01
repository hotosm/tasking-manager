from flask_restful import Resource, current_app
from server.services.settings_service import SettingsService


class LanguagesAPI(Resource):

    def get(self):
        """
        Gets all supported languages
        ---
        tags:
          - settings
        produces:
          - application/json
        responses:
            200:
                description: Supported Languages
            500:
                description: Internal Server Error
        """
        try:
            languages = SettingsService.get_settings()
            return languages.to_primitive(), 200
        except Exception as e:
            error_msg = f'Languages GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
