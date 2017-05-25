import io
from distutils.util import strtobool

from flask import send_file, Response
from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from server.models.dtos.mapping_dto import MappedTaskDTO, LockTaskDTO, StopMappingTaskDTO
from server.services.mapping_service import MappingService, MappingServiceError, NotFound, UserLicenseError
from server.services.users.authentication_service import token_auth, tm


class MappingTaskAPI(Resource):

    def get(self, project_id, task_id):
        """
        Get task for mapping
        ---
        tags:
            - mapping
        produces:
            - application/json
        parameters:
            - name: project_id
              in: path
              description: The ID of the project the task is associated with
              required: true
              type: integer
              default: 1
            - name: task_id
              in: path
              description: The unique task ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Task found
            404:
                description: Task not found
            500:
                description: Internal Server Error
        """
        try:
            task = MappingService.get_task_as_dto(task_id, project_id)
            return task.to_primitive(), 200
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except Exception as e:
            error_msg = f'Task GET API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class LockTaskForMappingAPI(Resource):

    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id, task_id):
        """
        Locks the task for mapping
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
            - name: project_id
              in: path
              description: The ID of the project the task is associated with
              required: true
              type: integer
              default: 1
            - name: task_id
              in: path
              description: The unique task ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Task locked
            400:
                description: Client Error
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            404:
                description: Task not found
            409:
                description: User has not accepted license terms of project
            500:
                description: Internal Server Error
        """
        try:
            lock_task_dto = LockTaskDTO()
            lock_task_dto.user_id = tm.authenticated_user_id
            lock_task_dto.project_id = project_id
            lock_task_dto.task_id = task_id
            lock_task_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            task = MappingService.lock_task_for_mapping(lock_task_dto)
            return task.to_primitive(), 200
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except MappingServiceError as e:
            return {"Error": str(e)}, 403
        except UserLicenseError:
            return {"Error": "User not accepted license terms"}, 409
        except Exception as e:
            error_msg = f'Task Lock API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

class StopMappingAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id, task_id):
        """
        Unlock task that is locked for mapping resetting it to it's last status
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
            - name: project_id
              in: path
              description: The ID of the project the task is associated with
              required: true
              type: integer
              default: 1
            - name: task_id
              in: path
              description: The unique task ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object for unlocking a task
              schema:
                  id: TaskUpdate
                  properties:
                      comment:
                          type: string
                          description: Optional user comment about the task
                          default: Mapping makes me feel good!
        responses:
            200:
                description: Task unlocked
            400:
                description: Client Error
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            404:
                description: Task not found
            500:
                description: Internal Server Error
        """
        try:
            stop_task = StopMappingTaskDTO(request.get_json())
            stop_task.user_id = tm.authenticated_user_id
            stop_task.task_id = task_id
            stop_task.project_id = project_id
            stop_task.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            task = MappingService.stop_mapping_task(stop_task)
            return task.to_primitive(), 200
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except MappingServiceError as e:
            return {"Error": str(e)}, 403
        except Exception as e:
            error_msg = f'Task Lock API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

class UnlockTaskForMappingAPI(Resource):

    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, project_id, task_id):
        """
        Unlocks the task after mapping completed
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
            - name: project_id
              in: path
              description: The ID of the project the task is associated with
              required: true
              type: integer
              default: 1
            - name: task_id
              in: path
              description: The unique task ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object for unlocking a task
              schema:
                  id: TaskUpdate
                  required:
                      - status
                  properties:
                      status:
                          type: string
                          description: The new status for the task
                          default: MAPPED
                      comment:
                          type: string
                          description: Optional user comment about the task
                          default: Mapping makes me feel good!
        responses:
            200:
                description: Task unlocked
            400:
                description: Client Error
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            404:
                description: Task not found
            500:
                description: Internal Server Error
        """
        try:
            mapped_task = MappedTaskDTO(request.get_json())
            mapped_task.user_id = tm.authenticated_user_id
            mapped_task.task_id = task_id
            mapped_task.project_id = project_id
            mapped_task.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            task = MappingService.unlock_task_after_mapping(mapped_task)
            return task.to_primitive(), 200
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except MappingServiceError as e:
            return {"Error": str(e)}, 403
        except Exception as e:
            error_msg = f'Task Lock API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class TasksAsGPX(Resource):

    def get(self, project_id):
        """
        Get tasks as GPX
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
              required: true
              description: List of tasks required
              default: 1,2
            - in: query
              name: as_file
              type: boolean
              description: Set to true if file download preferred
              default: False 
        responses:
            200:
                description: GPX XML
            400:
                description: Client error
            404:
                description: No mapped tasks
            500:
                description: Internal Server Error
        """
        try:
            current_app.logger.debug('GPX Called')
            tasks = request.args.get('tasks')
            as_file = strtobool(request.args.get('as_file')) if request.args.get('as_file') else False
            if tasks is None:
                return {"Error": 'No tasks supplied in querystring'}, 400

            xml = MappingService.generate_gpx(project_id, tasks)

            if as_file:
                return send_file(io.BytesIO(xml), mimetype='text.xml', as_attachment=True,
                                 attachment_filename=f'HOT-project-{project_id}.gpx')

            return Response(xml, mimetype='text/xml', status=200)
        except NotFound:
            return {"Error": "No mapped tasks"}, 404
        except Exception as e:
            error_msg = f'Task Lock API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class TasksAsOSM(Resource):

    def get(self, project_id):
        """
        Get tasks as OSM XML
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
              required: true
              description: List of tasks required
              default: 1,2
        responses:
            200:
                description: OSM XML
            400:
                description: Client Error
            404:
                description: No mapped tasks
            500:
                description: Internal Server Error
        """
        xml = MappingService.generate_osm_xml()
        return Response(xml, mimetype='text/xml', status=200)
