from flask_restful import Resource, current_app, request
from dateutil.parser import parse as date_parse

from backend.services.users.authentication_service import token_auth
from backend.services.users.user_service import UserService, NotFound


class UsersTasksAPI(Resource):
    @token_auth.login_required
    def get(self, user_id):
        """
        Get a list of tasks a user has interacted with
        ---
        tags:
          - users
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: user_id
              in: path
              description: Mapper's OpenStreetMap ID
              required: true
              type: integer
            - in: query
              name: status
              description: Task Status filter
              required: false
              type: string
              default: null
            - in: query
              name: project_status
              description: Project Status filter
              required: false
              type: string
              default: null
            - in: query
              name: project_id
              description: Project id
              required: false
              type: integer
              default: null
            - in: query
              name: start_date
              description: Date to filter as minimum
              required: false
              type: string
              default: null
            - in: query
              name: end_date
              description: Date to filter as maximum
              required: false
              type: string
              default: null
            - in: query
              name: sort_by
              description: field to sort by, supported fields action_date, -action_date
              required: false
              type: string
              default: null
            - in: query
              name: page
              description: Page of results user requested
              type: integer
            - in: query
              name: pageSize
              description: Size of page, defaults to 10
              type: integer
        responses:
            200:
                description: Mapped projects found
            404:
                description: No mapped projects found
            500:
                description: Internal Server Error
        """
        try:
            user = UserService.get_user_by_id(user_id)
            status = request.args.get("status")
            project_status = request.args.get("project_status")
            project_id = int(request.args.get("project_id", 0))
            start_date = (
                date_parse(request.args.get("start_date"))
                if request.args.get("start_date")
                else None
            )
            end_date = (
                date_parse(request.args.get("end_date"))
                if request.args.get("end_date")
                else None
            )
            sort_by = request.args.get("sort_by")

            tasks = UserService.get_tasks_dto(
                user.id,
                project_id=project_id,
                project_status=project_status,
                task_status=status,
                start_date=start_date,
                end_date=end_date,
                page=request.args.get("page", None, type=int),
                page_size=request.args.get("pageSize", 10, type=int),
                sort_by=sort_by,
            )
            return tasks.to_primitive(), 200
        except ValueError:
            return {"tasks": [], "pagination": {"total": 0}}, 200
        except NotFound:
            return {"Error": "User or tasks not found"}, 404
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
