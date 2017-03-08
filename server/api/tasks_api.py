from flask_restful import Resource


class LockTaskAPI(Resource):

    def post(self, task_id):
        """
        Locks the task
        ---
        tags:
            - tasks
        produces:
            - application/json
        parameters:
            - name: task_id
              in: path
              description: The unique task ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Task Locked
            404:
                description: Task not found
            500:
                description: Internal Server Error
        """
        pass


class UnlockTaskAPI(Resource):

    def post(self, task_id):
        """
        Unlocks the task
        ---
        tags:
            - tasks
        produces:
            - application/json
        parameters:
            - name: task_id
              in: path
              description: The unique task ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Task Unlocked
            404:
                description: Task not found
            500:
                description: Internal Server Error
        """
        pass