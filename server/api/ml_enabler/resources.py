from flask_restful import Resource, request

from server.services.ml_enabler_service import MLEnablerService
from server.services.users.authentication_service import tm, token_auth

VALID_AGGREGATORS = ["looking_glass", "building_api"]


class PredictionsRestAPI(Resource):
    @tm.pm_only(True)
    @token_auth.login_required
    def get(self):
        bbox = request.args.get("bbox")

        aggregator = request.args.get("aggregator", "looking_glass")

        if aggregator not in VALID_AGGREGATORS:
            return {"status": "error "}, 404

        max_zoom = 15 if aggregator == "building_api" else 18

        try:
            zoom = int(request.args.get("zoom", max_zoom).split(".")[0])
            if zoom > max_zoom:
                zoom = max_zoom
        except (ValueError, IndexError):
            return {"error": "Invalid zoom value"}, 500

        if not bbox:
            return {"error": "bounding box not found"}, 404
        else:
            try:
                response = MLEnablerService.get_prediction_from_bbox(
                    aggregator, bbox, zoom
                )
                return response, 200
            except (ValueError, IndexError):
                return {"error": "error fetching prediction"}, 500
