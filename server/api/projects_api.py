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
                id: Multipolygon
                properties:
                    type:
                        type: string
                        default: MultiPolygon
                    coordinates:
                        type: array
                        items:
                            type: number
                            default: [[[-4.0237,56.0904],[-3.9111,56.1715],[-3.8122,56.0980],[-4.0237,56.0904]]]
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
                              properties:
                                  geometryGeoJSON:
                                      schema:
                                          $ref: "#/definitions/Multipolygon"


        responses:
            201:
                description: Draft project created
            400:
                description: Client Error - Invalid Request
        """
        try:
            # TODO this a little clunky but avoids DTO object, however DTOs may be cleaner - will decide later
            data = request.get_json()
            aoi_geometry_geojson = json.dumps(data['areaOfInterest']['geometryGeoJSON'])
        except KeyError as e:
            return {"error": f'Key {str(e)} not found in JSON, note parser is case sensitive'}, 400

        try:
            project_service = ProjectService()
            project_service.create_draft_project(data, aoi_geometry_geojson)
            return {"status": "success"}, 201
        except InvalidGeoJson as e:
            return {"error": f'{str(e)}'}, 400
