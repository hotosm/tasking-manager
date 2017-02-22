from flask_restful import Resource
from server import db


class HealthCheck(Resource):
    """
    /health-check
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
        db.create_all()
        return {"status": "healthy"}, 200
