from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError
from server.models.dtos.licenses_dto import LicenseDTO
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
            license_dto = LicenseDTO(request.get_json())
            license_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            LicenseService.create_licence(license_dto)
            return {"Success": "License created"}, 200
        except Exception as e:
            error_msg = f'License PUT - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
