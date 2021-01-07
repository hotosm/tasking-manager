from flask_restful import Resource, current_app
from backend.services.stats_service import NotFound, StatsService


class TasksStatisticsAPI(Resource):
    def get(self, project_id):
        """
        Get Task Stats
        ---
        tags:
          - tasks
        produces:
          - application/json
        parameters:
            - in: query
              name: start_date
              description: Date to filter as minimum
              required: false
              type: string
              default: null
            - in: query
              name: end_date
              description: Date to filter as maximum
              required: false
              type: string
              default: null
            - in: query
              name: organisationName
              description: Organisation name to filter by
              required: false
              default: null
            - in: query
              name: organisationID
              description: Organisation ID to filter by
              required: false
              default: null
            - in: query
              name: campaigns
              description: Campaign name to filter by
              required: false
              default: null
            - in: query
              name: country
              description: Country name to filter by
              required: false
              default: null
            - in: query
              name: country
              description: Country name to filter by
              required: false
              default: null
            - in: query
              name: project_id
              description: Project IDs to filter by
              required: false
              default: null
        responses:
            200:
                description: Task statistics
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        try:
            task_stats = StatsService.get_task_stats()
            return task_stats.to_primitive(), 200
        except NotFound:
            return {"Error": "Not found"}, 404
        except Exception as e:
            error_msg = f"Task Statistics GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch task statistics"}, 500
