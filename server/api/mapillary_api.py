import io
from flask import Response, send_file
from distutils.util import strtobool
from flask_restful import Resource, current_app, request


from server.models.postgis.utils import NotFound
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
            if len(tasks) > 0:
                return tasks, 200
            else:
                raise NotFound
        except NotFound:
            return {"Error": "No Mapillary Sequences found with parameters"}, 404
        except Exception as e:
            error_msg = f'Mapillary GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class SequencesAsGPX(Resource):

    def get(self, project_id):
        """
        Return Mapillary GPX
        ---
        tags:
            - mapping
        produces:
            - application/xml
        parameters:
            - name: project_id
              in: path
              description: The ID of the project the task is associated with
              required: true
              type: integer
              default: 1
            - in: query
              name: tasks
              type: string
              description: List of tasks; leave blank for all
              default: 1,2
            - in: query
              name: as_file
              type: boolean
              description: Set to true if file download preferred
              default: False
        responses:
            200:
                description: Tasks made from sequences
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            tasks = request.args.get('tasks')
            as_file = strtobool(request.args.get('as_file')) if request.args.get('as_file') else False

            gpx = MapillaryService.getSequencesAsGPX(project_id, tasks)

            if as_file:
                return send_file(io.BytesIO(gpx), mimetype='text.xml', as_attachment=True,
                                 attachment_filename=f'Kaart-project-{project_id}-task-{tasks}.gpx')

            return Response(gpx, mimetype='text/xml', status=200)
        except NotFound:
            return {"Error": "No Mapillary Sequences found with parameters"}, 404
        except Exception as e:
            error_msg = f'Mapillary GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
