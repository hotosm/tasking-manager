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
        parameters:
            - in: body
              name: body
              required: true
              description: JSON object for creating draft project
              schema:
                  type: object
                  properties:
                      name:
                          type: string
                          default: HOT Project
                      area_of_interest:
                          type: object
                          properties:
                              geometry:
                                  type: object
                                  properties:
                                      type:
                                          type: string
                                          default: FeatureCollection
                                      features:
                                          type: array
                                          items

        responses:
          201:
            description: Draft project created
        """
        project_service = ProjectService()
        project_service.create_draft_project(request.get_json())
        return {"status": "healthy"}, 200
