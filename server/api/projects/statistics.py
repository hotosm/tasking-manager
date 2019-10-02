from flask_restful import Resource, current_app
from server.services.stats_service import NotFound, StatsService
from server.services.project_service import ProjectService


class ProjectsStatisticsQueriesPopularAPI(Resource):
    def get(self):
        """
        Get Popular project Stats
        ---
        tags:
          - projects
        produces:
          - application/json
        responses:
            200:
                description: Popular Projects stats
            500:
                description: Internal Server Error
        """
        try:
            stats = StatsService.get_popular_projects()
            return stats.to_primitive(), 200
        except Exception as e:
            error_msg = f"Unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


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
            return {"Error": "Unable to fetch project statistics"}, 500


class ProjectsStatisticsQueriesUsernameAPI(Resource):
    def get(self, project_id, username):
        """
        Get detailed stats about user
        ---
        tags:
          - projects
        produces:
          - application/json
        parameters:
            - name: project_id
              in: path
              required: true
              type: integer
              default: 1
            - name: username
              in: path
              description: The users username
              required: true
              type: string
              default: Thinkwhere
        responses:
            200:
                description: User found
            404:
                description: User not found
            500:
                description: Internal Server Error
        """
        try:
            stats_dto = ProjectService.get_project_user_stats(project_id, username)
            return stats_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch user statistics for project"}, 500
