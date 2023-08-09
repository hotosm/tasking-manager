from flask_restful import Resource

from backend.services.project_service import ProjectService
from backend.services.stats_service import StatsService


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
        ProjectService.exists(project_id)
        contributions = StatsService.get_user_contributions(project_id)
        return contributions.to_primitive(), 200


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
        contribs = ProjectService.get_contribs_by_day(project_id)
        return contribs.to_primitive(), 200
