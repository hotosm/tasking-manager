from flask_restful import Resource


class HealthCheckAPI(Resource):
    """
    /api/health-check
    """

    def get(self):
        """
        Simple health-check, if this is unreachable load balancers should be configures to raise an alert
        ---
        tags:
          - health-check
        produces:
          - application/json
        responses:
          200:
            description: Service is Healthy
        """
        return {"status": "healthy"}, 200
