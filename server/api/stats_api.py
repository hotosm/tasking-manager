from flask_restful import Resource, current_app
from server.services.stats_service import StatsService, NotFound
from server.services.project_service import ProjectService
from server.services.users.user_service import UserService


class StatsContributionsByDayAPI(Resource):
    def get(self, project_id):
        """
        Get contributions by day of a project
        ---
        tags:
          - stats
        produces:
          - application/json
        parameters:
            - name: project_id
              in: path
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Project contributions by day
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        try:
            contribs = ProjectService.get_contribs_by_day(project_id)
            return contribs.to_primitive(), 200
        except NotFound:
            return {"Error": "Project not found"}, 404
        except Exception as e:
            error_msg = f"Project contributions GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class HomePageStatsAPI(Resource):
    def get(self):
        """
        Get HomePage Stats
        ---
        tags:
          - stats
        produces:
          - application/json
        responses:
            200:
                description: Project stats
            500:
                description: Internal Server Error
        """
        try:
            stats = StatsService.get_homepage_stats()
            return stats.to_primitive(), 200
        except Exception as e:
            error_msg = f"Unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class StatsUserAPI(Resource):
    def get(self, username):
        """
        Get detailed stats about user
        ---
        tags:
          - user
        produces:
          - application/json
        parameters:
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
            stats_dto = UserService.get_detailed_stats(username)
            return stats_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class StatsProjectUserAPI(Resource):
    def get(self, project_id, username):
        """
        Get detailed stats about user
        ---
        tags:
          - user
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
            return {"error": error_msg}, 500
