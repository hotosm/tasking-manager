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
        responses:
          200:
            description: Project added
        """


        return {"status": "healthy"}, 200
