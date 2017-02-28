from flask_restful import Resource, request
from server.services.project_service import ProjectService


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
        """
        project_service = ProjectService()
        project_service.create_draft_project(request.get_json())
        return {"status": "healthy"}, 200
