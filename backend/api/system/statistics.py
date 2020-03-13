from flask_restful import Resource, current_app
from backend.services.stats_service import StatsService
from flask_restful import request
from distutils.util import strtobool


class SystemStatisticsAPI(Resource):
    def get(self):
        """
        Get HomePage Stats
        ---
        tags:
          - system
        produces:
          - application/json
        parameters:
        - in: query
          name: abbreviated
          type: boolean
          description: Set to false if complete details on projects including total area, campaigns, orgs are required
          default: True
        responses:
            200:
                description: Project stats
            500:
                description: Internal Server Error
        """
        try:
            abbreviated = (
                strtobool(request.args.get("abbreviated"))
                if request.args.get("abbreviated")
                else True
            )

            stats = StatsService.get_homepage_stats(abbreviated)
            return stats.to_primitive(), 200
        except Exception as e:
            error_msg = f"Unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch summary statistics"}, 500
