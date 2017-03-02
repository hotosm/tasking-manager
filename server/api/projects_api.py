import json
from flask_restful import Resource, request
from server.services.project_service import ProjectService, InvalidGeoJson


class ProjectsAPI(Resource):
    """
    /api/projects
    """

    def put(self):
        """
        Inserts a project into database
        ---
        tags:
            - projects
        produces:
            - application/json
        definitions:
            - schema:
                id: GeoJsonMultiPolygon
                properties:
                    type:
                        type: string
                        default: MultiPolygon
                    coordinates:
                        type: array
                        items:
                            type: number
                            default: [[[-4.0237,56.0904],[-3.9111,56.1715],[-3.8122,56.0980],[-4.0237,56.0904]]]
            - schema:
                id: GeoJsonMultiPolygonWithProperties
                properties:
                    type:
                        type: string
                        default: MultiPolygon
                    coordinates:
                        type: array
                        items:
                            type: number
                            default: [[[-7.0237,56.0904],[-3.9111,56.1715],[-3.8122,56.0980],[-4.0237,56.0904]]]
                    properties:
                        type: object
                        properties:
                            x:
                                type: integer
                                default: 2402
                            y:
                                type: integer
                                default: 1736
                            zoom:
                                type: integer
                                default: 12
        parameters:
            - in: body
              name: body
              required: true
              description: JSON object for creating draft project
              schema:
                  properties:
                      name:
                          type: string
                          default: HOT Project
                      areaOfInterest:
                          schema:
                              $ref: "#/definitions/GeoJsonMultiPolygon"
                      tasks:
                          schema:
                              properties:
                                  type:
                                      type: string
                                      default: FeatureCollection
                                  features:
                                      type: array
                                      items:
                                          schema:
                                              $ref: "#/definitions/GeoJsonMultiPolygonWithProperties"
        responses:
            201:
                description: Draft project created
            400:
                description: Client Error - Invalid Request
        """
        try:
            # TODO this a little clunky but avoids DTO object, however DTOs may be cleaner - will decide later
            data = request.get_json()
            aoi_geometry_geojson = json.dumps(data['areaOfInterest'])
        except KeyError as e:
            return {"error": f'Key {str(e)} not found in JSON, note parser is case sensitive'}, 400

        try:
            project_service = ProjectService()
            project_service.create_draft_project(data, aoi_geometry_geojson)
            return {"status": "success"}, 201
        except InvalidGeoJson as e:
            return {"error": f'{str(e)}'}, 400
