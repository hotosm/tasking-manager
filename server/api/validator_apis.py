from flask_restful import Resource, current_app, request
from server.services.mapping_service import MappingService, MappingServiceError, DatabaseError


class LockTasksForValidationAPI(Resource):

    def post(self, project_id):
        """
        Lock tasks for validation
        ---
        tags:
            - validation
        produces:
            - application/json
        parameters:
            - name: project_id
              in: path
              description: The ID of the project the task is associated with
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object for unlocking a task
              schema:
                  properties:
                      taskIds:
                          type: array
                          items:
                              type: integer
                          description: Array of taskIds for locking
                          default: [1,2]
        responses:
            200:
                description: Task locked
            403:
                description: Task already locked
            404:
                description: Task not found
            500:
                description: Internal Server Error
        """
        pass
        # try:
        #     task = MappingService().lock_task_for_mapping(task_id, project_id)
        #
        #     if task is None:
        #         return {"Error": "Task Not Found"}, 404
        #
        #     return task.to_primitive(), 200
        # except MappingServiceError as e:
        #     return {"Error": str(e)}, 403
        # except Exception as e:
        #     error_msg = f'Task Lock API - unhandled error: {str(e)}'
        #     current_app.logger.critical(error_msg)
        #     return {"Error": error_msg}, 500


class UnlockTasksForValidationAPI(Resource):

    def post(self, project_id):
        """
        Unlocks tasks after validation completed
        ---
        tags:
            - validation
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
                          default: DONE
                      comment:
                          type: string
                          description: Optional user comment about the task
                          default: Mapping makes me feel good!
        responses:
            200:
                description: Task unlocked
            400:
                description: Client Error
            404:
                description: Task not found
            500:
                description: Internal Server Error
        """
        pass
        # try:
        #     data = request.get_json()
        #     status = data['status']
        #     comment = data['comment'] if 'comment' in data else None
        #
        #     if status == '':
        #         return {"Error": "Status not supplied"}, 400
        #
        #     task = MappingService().unlock_task_after_mapping(task_id, project_id, status, comment)
        #
        #     if task is None:
        #         return {"Error": "Task Not Found"}, 404
        #
        #     return task.to_primitive(), 200
        # except MappingServiceError as e:
        #     return {"Error": str(e)}, 400
        # except Exception as e:
        #     error_msg = f'Task Lock API - unhandled error: {str(e)}'
        #     current_app.logger.critical(error_msg)
        #     return {"Error": error_msg}, 500
