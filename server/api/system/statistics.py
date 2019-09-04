from flask_restful import Resource, current_app
from server.services.stats_service import StatsService


class SystemStatisticsAPI(Resource):
    def get(self):
        """
        Get HomePage Stats
        ---
        tags:
          - system
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
            return {"Error": "Unable to fetch summary statistics"}, 500
