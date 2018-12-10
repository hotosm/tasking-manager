from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError
from server.models.postgis.utils import NotFound
from server.models.dtos.priority_dto import PriorityDTO, PriorityListDTO
from server.services.priority_service import PriorityService
from server.models.postgis.utils import InvalidGeoJson, ST_GeomFromGeoJSON, ST_SetSRID, ST_Collect, ST_CollectionHomogenize, ST_AsText, ST_MakeValid
from server.services.users.authentication_service import token_auth, tm
from sqlalchemy.dialects.postgresql import array
import json
import geojson

class PriorityUploadApi(Resource):

    @tm.pm_only()
    @token_auth.login_required
    def post(self):
        """
        Saves the uploaded Priority geospatial data to the priorities table
        ---
        tags:
            - priority
        produces
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - in: body
              name: body
              required: true
              description: Geospatial priority data

        responses:
            200:
                description: priority data Saved
            400:
                description: Client Error
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            for key, f in request.files.items():
                if key.startswith('file'):
                    priority = PriorityDTO()
                    priority.name = f.filename

                    # TODO: Check if CSV or GEOJSON and handle CSV
                    json_data = json.load(request.files[key])
                    if 'name' in json_data:
                        priority.name = json_data['name']

                    priority.filesize = len(json.dumps(json_data))
                    priority.uploaded_by = tm.authenticated_user_id
                    priority_geometry = geojson.loads(json.dumps(json_data))

                    if type(priority_geometry) not in [geojson.MultiPoint, geojson.MultiLineString,
                                                       geojson.MultiPolygon, geojson.Point, geojson.Feature,
                                                       geojson.FeatureCollection, geojson.Polygon]:
                        raise InvalidGeoJson('Uploaded data is not geojson')
                    features = []
                    for feature in priority_geometry['features']:
                        features.append(ST_SetSRID(ST_MakeValid(ST_AsText(ST_GeomFromGeoJSON(geojson.dumps(feature.geometry)))), 4326))

                    priority.geometry = ST_CollectionHomogenize(ST_Collect((array(tuple(features)))))

                    PriorityService.save_priority(priority)

            return {"success": True}
        except Exception as e:
            error_msg = f'Upload Priority API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    @tm.pm_only()
    @token_auth.login_required
    def delete(self, priority_id):
        """
       Deletes a Priority dataset
       ---
       tags:
           - priority
       produces:
           - application/json
       parameters:
           - in: header
             name: Authorization
             description: Base64 encoded session token
             required: true
             type: string
             default: Token sessionTokenHere==
           - name: priority_id
             in: path
             description: The unique project ID
             required: true
             type: integer
             default: 1
       responses:
           200:
               description: Priority deleted
           401:
               description: Unauthorized - Invalid credentials
           403:
               description: Forbidden
           404:
               description: Priority not found
           500:
               description: Internal Server Error
       """
        try:
            PriorityService.delete_priority(priority_id)
            return {"Success": "Priority deleted"}, 200
        except NotFound:
            return {"Error": "Priority Not Found"}, 404
        except Exception as e:
            error_msg = f'Priority DELETE - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class PriorityListAPI(Resource):

    @tm.pm_only()
    @token_auth.login_required
    def get(self):
        """
        Get all Priority datasets
        ---
        tags:
            - priorities
        produces:
            - application/json
        responses:
            200:
                description: Priorities found
            404:
                description: Priorities not found
            500:
                description: Internal Server Error
        """
        try:
            priorities_dto = PriorityService.get_all_priorities()
            return priorities_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "Priorities Not Found"}, 404
        except Exception as e:
            error_msg = f'Priorities GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500