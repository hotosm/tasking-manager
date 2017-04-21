from flask_restful import Resource, current_app, request
from server.services.grid_service import GridService
from server.services.authentication_service import token_auth, tm
from server.models.dtos.grid_dto import GridDTO
from schematics.exceptions import DataError


class IntersectingTilesAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def put(self):
        """
        Gets the tiles intersecting the aoi
        ---
        tags:
            - grid
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
              description: JSON object containing aoi and tasks
              schema:
                  properties:
                      areaOfInterest:
                          schema:
                              $ref: "#/definitions/GeoJsonMultiPolygon"
                      grid:
                          schema:
                              properties:
                                  type:
                                      type: string
                                      default: FeatureCollection
                                  features:
                                      type: array
                                      items:
                                          schema:
                                              $ref: "#/definitions/GeoJsonFeature"
        responses:
            200:
                description: Intersecting tasks found successfully
            400:
                description: Client Error - Invalid Request
            500:
                description: Internal Server Error
        """
        try:
            json = request.get_json()
            grid_dto = GridDTO(json)
            grid_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            grid = GridService.trim_grid_to_aoi(grid_dto)
            return grid, 200
        except Exception as e:
            error_msg = f'IntersectingTiles GET API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500
