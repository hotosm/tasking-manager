from flask_restful import Resource, request

from backend.services.stats_service import StatsService
from backend.services.project_service import ProjectService


class ProjectsActivitiesAPI(Resource):
    def get(self, project_id):
        """
        Get all user activity on a project
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
            - in: query
              name: page
              description: Page of results user requested
              type: integer
        responses:
            200:
                description: Project activity
            404:
                description: No activity
            500:
                description: Internal Server Error
        """
        ProjectService.exists(project_id)
        page = int(request.args.get("page")) if request.args.get("page") else 1
        activity = StatsService.get_latest_activity(project_id, page)
        return activity.to_primitive(), 200


class ProjectsLastActivitiesAPI(Resource):
    def get(self, project_id):
        """
        Get latest user activity on all of project task
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
        responses:
            200:
                description: Project activity
            404:
                description: No activity
            500:
                description: Internal Server Error
        """
        ProjectService.exists(project_id)
        activity = StatsService.get_last_activity(project_id)
        return activity.to_primitive(), 200
