import io
import os

from flask import send_file, Response
from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from server.services.ml_enabler_service import MLEnablerService 
from server.services.users.authentication_service import tm, token_auth


class PredictionAPI(Resource):

    @tm.pm_only(True)
    @token_auth.login_required
    def post(self):
        """
        Submits a new prediction to ml-enabler 
        ---
        tags:
            - mapping
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - in: body
              name: body
              required: true
              description: JSON object for creating a new prediction 
              schema:
                  properties:
                      cloneFromProjectId:
                          type: array 
                          description: the bounding box of the area of interest 
        responses:
            200:
                description: Prediction made 
            400:
                description: Client Error
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        body_content = request.get_json()
        bounding_box = body_content.get('bbox')
        if type(bounding_box) == list:
            bounding_box = ','.join([str(a) for a in bounding_box])
        zoom = body_content.get('zoom', 18)
        zoom = int(zoom)
        if zoom > 19:
            zoom = 19    

        if not bounding_box:
            return {"error": 'bounding box not found'}, 404
        else:
            #TODO: send this to celery?
            err_file = f'/tmp/ml_{tm.authenticated_user_id}_err.json'
            out_file = f'/tmp/ml_{tm.authenticated_user_id}.json'
            agg_file = f'/tmp/ml_{tm.authenticated_user_id}_agg.json'
            try: 
                MLEnablerService.send_prediction_job(bounding_box, zoom, out_file, err_file)
                MLEnablerService.send_aggregation_job(zoom, out_file, agg_file)
                MLEnablerService.upload_prediction(agg_file)
            except Exception as e:
                return {'error': f'Error on ml-enabler service: {e}'}, 500

            for f in (err_file, out_file, agg_file):
                try:
                    os.remove(f)
                except:
                    pass
            return {'status': "sucess"}, 200
            
    @tm.pm_only(True)
    @token_auth.login_required
    def get(self):
        bbox = request.args.get('bbox')
        try:
            zoom = int(request.args.get('zoom', 18).split('.')[0])
            if zoom > 19:
                zoom = 19
        except:
            return {"error": "Invalid zoom value"}, 500
        
        if not bbox:
            return {"error": 'bounding box not found'}, 404
        else:
            try:
                response = MLEnablerService.get_prediction_from_bbox('looking_glass', bbox, zoom)
                return response, 200
            except:
                return {"error": 'error fetching prediction'}, 500 
            
