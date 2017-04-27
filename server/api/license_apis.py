from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError
from server.services.authentication_service import token_auth, tm
from server.models.dtos.licenses_dto import LicenseDTO
from server.models.postgis.utils import NotFound
from server.services.license_service import LicenseService


class LicenseAPI(Resource):

    @tm.pm_only()
    @token_auth.login_required
    def put(self):
        """
        Creates a new mapping license
        ---
        tags:
            - licenses
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
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
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
            new_license_id = LicenseService.create_licence(license_dto)
            return {"licenseId": new_license_id}, 200
        except Exception as e:
            error_msg = f'License PUT - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    def get(self, license_id):
        """
        Get specified mapping license
        ---
        tags:
            - licenses
        produces:
            - application/json
        parameters:
            - name: license_id
              in: path
              description: The unique license ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: License found
            404:
                description: License not found
            500:
                description: Internal Server Error
        """
        try:
            license_dto = LicenseService.get_license_as_dto(license_id)
            return license_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "License Not Found"}, 404
        except Exception as e:
            error_msg = f'License PUT - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @tm.pm_only()
    @token_auth.login_required
    def post(self, license_id):
        """
        Update  a new mapping license
        ---
        tags:
            - licenses
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: license_id
              in: path
              description: The unique license ID
              required: true
              type: integer
              default: 1
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
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            license_dto = LicenseDTO(request.get_json())
            license_dto.license_id = license_id
            license_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            updated_license = LicenseService.update_licence(license_dto)
            return updated_license.to_primitive(), 200
        except NotFound:
            return {"Error": "License Not Found"}, 404
        except Exception as e:
            error_msg = f'License POST - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @tm.pm_only()
    @token_auth.login_required
    def delete(self, license_id):
        """
        Delete the specified mapping license
        ---
        tags:
            - licenses
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: license_id
              in: path
              description: The unique license ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: License deleted
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: License not found
            500:
                description: Internal Server Error
        """
        try:
            LicenseService.delete_license(license_id)
            return {"Success": "License deleted"}, 200
        except NotFound:
            return {"Error": "License Not Found"}, 404
        except Exception as e:
            error_msg = f'License DELETE - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class LicenceListAPI(Resource):

    def get(self):
        """
        Get all imagery licenses
        ---
        tags:
            - licenses
        produces:
            - application/json
        responses:
            200:
                description: Licenses found
            404:
                description: Licenses not found
            500:
                description: Internal Server Error
        """
        try:
            licenses_dto = LicenseService.get_all_licenses()
            return licenses_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "License Not Found"}, 404
        except Exception as e:
            error_msg = f'License PUT - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
