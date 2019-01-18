import os
from flask_restful import Resource, current_app, request
from werkzeug.utils import secure_filename
from schematics.exceptions import DataError

from server.models.postgis.project_files import ProjectFiles
from server.models.dtos.project_dto import ProjectFileDTO
from server.services.project_admin_service import ProjectAdminService
from server.models.postgis.utils import NotFound
from server.models.postgis.statuses import UploadPolicy
from server.services.mapillary_service import MapillaryService


class MapillaryTasksAPI(Resource):

    def get(self):
        """
        Get Mapillary sequences and return tasks
        ---
        tags:
            - project-admin
        produces:
            - application/json
        parameters:
            - name: bbox
              in: query
              description: Bounding Box of query
              required: true
              type: string
              default: 23.921654915861897,37.87224805696286,23.953491461967605,37.89270203032973
            - name: start_date
              in: query
              description: The start date of the query
              required: true
              type: string
              default: 2018-01-01
            - name: end_date
              in: query
              description: The end date of the query
              required: true
              type: string
              default: 2019-01-01
        responses:
            200:
                description: Tasks made from sequences
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            tasks = MapillaryService.getMapillarySequences(request.args['bbox'], request.args['start_date'], request.args['end_date'])
            return tasks, 200
        except NotFound:
            return {"Error": "No Mapillary Sequences found with query"}, 404
        except Exception as e:
            error_msg = f'Mapillary GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500