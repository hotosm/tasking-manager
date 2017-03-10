from flask_restful import Resource, current_app, request
from server.services.task_service import TaskService, TaskServiceError


class LockTaskAPI(Resource):

    def post(self, project_id, task_id):
        """
        Locks the task
        ---
        tags:
            - tasks
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
                description: Task locked
            403:
                description: Task already locked
            404:
                description: Task not found
            500:
                description: Internal Server Error
        """
        try:
            task = TaskService.set_locked_status(task_id=task_id, project_id=project_id, is_locked=True)

            if task is None:
                return {"Error": "Task Not Found"}, 404

            return {"Status": "Success"}, 200
        except TaskServiceError as e:
            return {"Error": str(e)}, 403
        except Exception as e:
            error_msg = f'Task Lock API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class UnlockTaskAPI(Resource):

    def post(self, project_id, task_id):
        """
        Unlocks the task
        ---
        tags:
            - tasks
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
        try:
            #task = TaskService.set_locked_status(task_id=task_id, project_id=project_id, is_locked=False)

            data = request.get_json()
            status = data['status']
            comment = data['comment']

            if status == '':
                return {"Error": "Status not supplied"}, 400

            task = TaskService.unlock_task(task_id, project_id, status, comment)

            if task is None:
                return {"Error": "Task Not Found"}, 404

            return {"Status": "Success"}, 200
        except Exception as e:
            error_msg = f'Task Lock API - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500
