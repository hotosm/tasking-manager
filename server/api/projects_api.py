from flask_restful import Resource


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
                      area:
                          type: object
                          properties:
                              name:
                                  type: string
                                  default: Project Area
        responses:
          201:
            description: Draft project created
        """
        return {"status": "healthy"}, 200
