from flask_restful import Resource, current_app
from server.services.stats_service import NotFound
from server.services.project_service import ProjectService


class ProjectsStatisticsAPI(Resource):
    def get(self, project_id):
        """
        Get Project Stats
        ---
        tags:
          - projects
        produces:
          - application/json
        parameters:
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
            - name: project_id
              in: path
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Project stats
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        try:
            # preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            summary = ProjectService.get_project_stats(project_id)
            return summary.to_primitive(), 200
        except NotFound:
            return {"Error": "Project not found"}, 404
        except Exception as e:
            error_msg = f"Project Summary GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
