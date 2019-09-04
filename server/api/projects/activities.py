from flask_restful import Resource, current_app, request
from server.services.stats_service import StatsService, NotFound


class ProjectsActivitiesAPI(Resource):
    def get(self, project_id):
        """
        Get user actvity on a project
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
        try:
            page = int(request.args.get("page")) if request.args.get("page") else 1
            activity = StatsService.get_latest_activity(project_id, page)
            return activity.to_primitive(), 200
        except NotFound:
            return {"Error": "No activity on project"}, 404
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch user activity"}, 500
