from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from server.models.dtos.interests_dto import InterestDTO
from server.models.postgis.utils import NotFound
from server.services.interests_service import InterestService
from server.services.users.authentication_service import token_auth, tm


class InterestAPI(Resource):
    @token_auth.login_required
    def post(self):
        """
        Creates a new interest
        ---
        tags:
            - interests
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
              description: JSON object for creating a new interest
              schema:
                  properties:
                      name:
                          type: string
                          default: Public Domain
        responses:
            200:
                description: New interest created
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            interest_dto = InterestDTO(request.get_json())
            interest_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            new_interest = InterestService.create(interest_dto.name)
            return new_interest.to_primitive(), 200
        except Exception as e:
            error_msg = f'Interest POST - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @token_auth.login_required
    def get(self, license_id):
        """
        Get all interests
        ---
        tags:
            - interests
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
        responses:
            200:
                description: Interest found
            500:
                description: Internal Server Error
        """
        try:
            interests = InterestService.get_all_interests()
            return interests.to_primitive(), 200
        except Exception as e:
            error_msg = f'Interest GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @token_auth.login_required
    def put(self, interest_id):
        """
        Update interest
        ---
        tags:
            - interests
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
              description: JSON object for creating a new interest
              schema:
                  properties:
                      name:
                          type: string
                          default: Public Domain
        responses:
            200:
                description: interest updated
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            interest_dto = InterestDTO(request.get_json())
            interest_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            update_interest = InterestService.udpdate(interest_id, interest_dto)
            return update_interest.to_primitive(), 200
        except Exception as e:
            error_msg = f'Interest PUT - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @token_auth.login_required
    def delete(self, interest_id):
        """
        Delete the specified interest
        --
        tags:
            - interests
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: interest_id
              in: path
              description: The unique interest ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Interest deleted
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: Interest not found
            500:
                description: Internal Server Error
        """
        try:
            InterestService.delete(interest_id)
            return {"Success": "Interest deleted"}, 200
        except NotFound:
            return {"Error": "Interest Not Found"}, 404
        except Exception as e:
            error_msg = f'License DELETE - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class UserInterestRelationshipAPI(Resource):
    def post(self):
        """
        Creates a relationship between user and interests
        ---
        tags:
            - interests
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
              description: JSON object for creating/updating user and interests relationships
              schema:
                  properties:
                      user_id:
                          type: integer
                          default: Public Domain
                      :nterests:
                          type: array of integers
                          default: None
        responses:
            200:
                description: New user interest relationship created
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            data = request.get_json()
            user_interests = InterestService.create_or_update_user_interests(data['user_id'], data['interests'])
            return user_interests.to_primitive(), 200
        except NotFound:
            return {"Error": "User not Found"}, 404
        except Exception as e:
            error_msg = f'User relationship POST - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

class ProjectInterestRelationshipAPI(Resource):
    def post(self):
        """
        Creates a relationship between project and interests
        ---
        tags:
            - interests
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
              description: JSON object for creating/updating project and interests relationships
              schema:
                  properties:
                      project_id:
                          type: integer
                          default: Public Domain
                      :nterests:
                          type: array of integers
                          default: None
        responses:
            200:
                description: New project interest relationship created
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            data = request.get_json()
            project_interests = InterestService.create_or_update_project_interests(data['project_id'], data['interests'])
            return project_interests.to_primitive(), 200
        except NotFound:
            return {"Error": "project not Found"}, 404
        except Exception as e:
            error_msg = f'project relationship POST - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500