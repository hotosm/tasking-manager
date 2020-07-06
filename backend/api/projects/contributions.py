from flask_restful import Resource, current_app

from backend.services.project_service import ProjectService
from backend.services.stats_service import StatsService, NotFound


class ProjectsContributionsAPI(Resource):
    def get(self, project_id):
        """
        Get all user contributions on a project
        ---
        tags:
          - projects
        produces:
          - application/json
        parameters:
            - name: project_id
              in: path
              description: Unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: User contributions
            404:
                description: No contributions
            500:
                description: Internal Server Error
        """
        try:
            ProjectService.exists(project_id)
        except NotFound as e:
            current_app.logger.error(f"Error validating project: {str(e)}")
            return {"Error": "Project not found"}, 404

        try:
            contributions = StatsService.get_user_contributions(project_id)
            return contributions.to_primitive(), 200
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch user contributions"}, 500


class ProjectsContributionsQueriesDayAPI(Resource):
    def get(self, project_id):
        """
        Get contributions by day for a project
        ---
        tags:
          - projects
        produces:
          - application/json
        parameters:
            - name: project_id
              in: path
              description: Unique project ID
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
            return {"Error": "Unable to fetch per day user contribution"}, 500
