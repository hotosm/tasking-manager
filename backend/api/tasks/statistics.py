from datetime import date, timedelta
from flask_restful import Resource, request

from backend.services.users.authentication_service import token_auth
from backend.services.stats_service import StatsService
from backend.api.utils import validate_date_input


class TasksStatisticsAPI(Resource):
    @token_auth.login_required
    def get(self):
        """
        Get Task Stats
        ---
        tags:
          - tasks
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              type: string
              required: true
              default: Token sessionTokenHere==
            - in: query
              name: startDate
              description: Date to filter as minimum
              required: true
              type: string
            - in: query
              name: endDate
              description: Date to filter as maximum. Default value is the current date.
              required: false
              type: string
            - in: query
              name: organisationName
              description: Organisation name to filter by
              required: false
            - in: query
              name: organisationId
              description: Organisation ID to filter by
              required: false
            - in: query
              name: campaign
              description: Campaign name to filter by
              required: false
            - in: query
              name: projectId
              description: Project IDs to filter by
              required: false
            - in: query
              name: country
              description: Country name to filter by
              required: false
        responses:
            200:
                description: Task statistics
            400:
                description: Bad Request
            401:
                description: Request is not authenticated
            500:
                description: Internal Server Error
        """
        try:
            if request.args.get("startDate"):
                start_date = validate_date_input(request.args.get("startDate"))
            else:
                return {
                    "Error": "Start date is required",
                    "SubCode": "MissingDate",
                }, 400
            end_date = validate_date_input(request.args.get("endDate", date.today()))
            if end_date < start_date:
                raise ValueError(
                    "InvalidDateRange- Start date must be earlier than end date"
                )
            if (end_date - start_date) > timedelta(days=366):
                raise ValueError(
                    "InvalidDateRange- Date range can not be bigger than 1 year"
                )
            organisation_id = request.args.get("organisationId", None, int)
            organisation_name = request.args.get("organisationName", None, str)
            campaign = request.args.get("campaign", None, str)
            project_id = request.args.get("projectId")
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
        except (KeyError, ValueError) as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 400
