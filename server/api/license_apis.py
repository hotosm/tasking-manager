from flask_restful import Resource, current_app
from server.services.license_service import LicenseService


class LicenseAPI(Resource):

    def put(self):
        """
        Creates a new mapping license
        ---
        tags:
            - licenses
        produces:
            - application/json
        parameters:
            - in: body
              name: body
              required: true
              description: JSON object for creating a new mapping license
              schema:
                  properties:
                      name:
                          type: string
                          default: Public Domain
                      description:
                          type: string
                          default: This imagery is in the public domain.
                      plainText:
                          type: string
                          default: This imagery is in the public domain.  
        responses:
            200:
                description: New license created
            500:
                description: Internal Server Error
        """
        try:
            LicenseService.create_licence()
            return {"Success": "License created"}, 200
        except Exception as e:
            error_msg = f'License PUT - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
