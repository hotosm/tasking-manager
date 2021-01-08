import datetime
from flask_restful import Resource, current_app, request
from backend.services.stats_service import NotFound, StatsService


def validate_date_input(date):
    if date:
        date_format = "%Y-%m-%d"
        current_date = datetime.datetime.now()
        date = datetime.datetime.strptime(date, date_format)
        if date <= current_date:
            return date
        raise Exception("Error: Date out of range for task activity")


class TasksStatisticsAPI(Resource):
    def get(self):
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
              name: organisation_name
              description: Organisation name to filter by
              required: false
              default: null
            - in: query
              name: organisation_id
              description: Organisation ID to filter by
              required: false
              default: null
            - in: query
              name: campaign
              description: Campaign name to filter by
              required: false
              default: null
            - in: query
              name: project_id
              description: Project IDs to filter by
              required: false
              default: null
            - in: query
              name: country
              description: Country name to filter by
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
            start_date = validate_date_input(request.args.get("start_date"))
            end_date = validate_date_input(request.args.get("end_date"))
            organisation_id = request.args.get("organisation_id", None, int)
            organisation_name = request.args.get("organisation_name", None, str)
            campaign = request.args.get("campaign", None, int)
            project_id = request.args.get("project_id")
            if project_id:
                project_id = map(str, project_id.split(","))
            country = request.args.get("country", None, str)
            task_stats = StatsService.get_task_stats(
                start_date,
                end_date,
                organisation_id,
                organisation_name,
                campaign,
                project_id,
                country,
            )
            return task_stats.to_primitive(), 200
        except NotFound:
            return {"Error": "Not found"}, 404
        except Exception as e:
            error_msg = f"Task Statistics GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch task statistics"}, 500
