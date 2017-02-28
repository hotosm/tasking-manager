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
                id: Point
                properties:
                    type:
                        type: string
                        default: Point
                    coordinates:
                        type: array
                        items:
                            type: number
                            default: [100.1, 0.1]
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
                                  centroid:
                                      schema:
                                          $ref: "#/definitions/Point"


        responses:
          201:
            description: Draft project created
        """
        project_service = ProjectService()
        project_service.create_draft_project(request.get_json())
        return {"status": "healthy"}, 200
