import io
from distutils.util import strtobool

from flask import send_file, Response
from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from backend.services.mapping_service import MappingService
from backend.models.dtos.grid_dto import GridDTO

from backend.services.users.authentication_service import token_auth, tm
from backend.services.users.user_service import UserService
from backend.services.validator_service import ValidatorService

from backend.services.project_service import ProjectService, ProjectServiceError
from backend.services.grid.grid_service import GridService
from backend.models.postgis.statuses import UserRole
from backend.models.postgis.utils import InvalidGeoJson


class TasksRestAPI(Resource):
    def get(self, project_id, task_id):
        """
        Get a task's metadata
        ---
        tags:
            - tasks
        produces:
            - application/json
        parameters:
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
            - name: project_id
              in: path
              description: Project ID the task is associated with
              required: true
              type: integer
              default: 1
            - name: task_id
              in: path
              description: Unique task ID
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
        preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")

        task = MappingService.get_task_as_dto(task_id, project_id, preferred_locale)
        return task.to_primitive(), 200


class TasksQueriesJsonAPI(Resource):
    def get(self, project_id):
        """
        Get all tasks for a project as JSON
        ---
        tags:
            - tasks
        produces:
            - application/json
        parameters:
            - name: project_id
              in: path
              description: Project ID the task is associated with
              required: true
              type: integer
              default: 1
            - in: query
              name: tasks
              type: string
              description: List of tasks; leave blank to retrieve all
              default: 1,2
            - in: query
              name: as_file
              type: boolean
              description: Set to true if file download preferred
              default: True
        responses:
            200:
                description: Project found
            403:
                description: Forbidden
            404:
                description: Project not found
            500:
                description: Internal Server Error
        """
        try:
            tasks = request.args.get("tasks") if request.args.get("tasks") else None
            as_file = (
                strtobool(request.args.get("as_file"))
                if request.args.get("as_file")
                else True
            )

            tasks_json = ProjectService.get_project_tasks(int(project_id), tasks)

            if as_file:
                tasks_json = str(tasks_json).encode("utf-8")
                return send_file(
                    io.BytesIO(tasks_json),
                    mimetype="application/json",
                    as_attachment=True,
                    download_name=f"{str(project_id)}-tasks.geojson",
                )

            return tasks_json, 200
        except ProjectServiceError as e:
            return {"Error": str(e)}, 403

    @token_auth.login_required
    def delete(self, project_id):
        """
        Delete a list of tasks from a project
        ---
        tags:
            - tasks
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
              description: Project ID the task is associated with
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object with a list of tasks to delete
              schema:
                  properties:
                      tasks:
                          type: array
                          items:
                              type: integer
                          default: [ 1, 2 ]
        responses:
            200:
                description: Task(s) deleted
            400:
                description: Bad request
            403:
                description: Forbidden
            404:
                description: Project or Task Not Found
            500:
                description: Internal Server Error
        """
        user_id = token_auth.current_user()
        user = UserService.get_user_by_id(user_id)
        if user.role != UserRole.ADMIN.value:
            return {
                "Error": "This endpoint action is restricted to ADMIN users.",
                "SubCode": "OnlyAdminAccess",
            }, 403

        tasks_ids = request.get_json().get("tasks")
        if tasks_ids is None:
            return {"Error": "Tasks ids not provided", "SubCode": "InvalidData"}, 400
        if isinstance(tasks_ids, list) is False:
            return {
                "Error": "Tasks were not provided as a list",
                "SubCode": "InvalidData",
            }, 400

        try:
            ProjectService.delete_tasks(project_id, tasks_ids)
            return {"Success": "Task(s) deleted"}, 200
        except ProjectServiceError as e:
            return {"Error": str(e)}, 403


class TasksQueriesXmlAPI(Resource):
    def get(self, project_id):
        """
        Get all tasks for a project as OSM XML
        ---
        tags:
            - tasks
        produces:
            - application/xml
        parameters:
            - name: project_id
              in: path
              description: Project ID the task is associated with
              required: true
              type: integer
              default: 1
            - in: query
              name: tasks
              type: string
              description: List of tasks; leave blank to retrieve all
              default: 1,2
            - in: query
              name: as_file
              type: boolean
              description: Set to true if file download preferred
              default: False
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
        tasks = request.args.get("tasks") if request.args.get("tasks") else None
        as_file = (
            strtobool(request.args.get("as_file"))
            if request.args.get("as_file")
            else False
        )

        xml = MappingService.generate_osm_xml(project_id, tasks)

        if as_file:
            return send_file(
                io.BytesIO(xml),
                mimetype="text.xml",
                as_attachment=True,
                download_name=f"HOT-project-{project_id}.osm",
            )

        return Response(xml, mimetype="text/xml", status=200)


class TasksQueriesGpxAPI(Resource):
    def get(self, project_id):
        """
        Get all tasks for a project as GPX
        ---
        tags:
            - tasks
        produces:
            - application/xml
        parameters:
            - name: project_id
              in: path
              description: Project ID the task is associated with
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
                description: GPX XML
            400:
                description: Client error
            404:
                description: No mapped tasks
            500:
                description: Internal Server Error
        """
        current_app.logger.debug("GPX Called")
        tasks = request.args.get("tasks")
        as_file = (
            strtobool(request.args.get("as_file"))
            if request.args.get("as_file")
            else False
        )

        xml = MappingService.generate_gpx(project_id, tasks)

        if as_file:
            return send_file(
                io.BytesIO(xml),
                mimetype="text.xml",
                as_attachment=True,
                download_name=f"HOT-project-{project_id}.gpx",
            )

        return Response(xml, mimetype="text/xml", status=200)


class TasksQueriesAoiAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def put(self):
        """
        Get task tiles intersecting with the aoi provided
        ---
        tags:
            - tasks
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
              description: JSON object containing aoi and tasks and bool flag for controlling clip grid to aoi
              schema:
                  properties:
                      clipToAoi:
                        type: boolean
                        default: true
                      areaOfInterest:
                          schema:
                              properties:
                                  type:
                                      type: string
                                      default: FeatureCollection
                                  features:
                                      type: array
                                      items:
                                          schema:
                                              $ref: "#/definitions/GeoJsonFeature"
                      grid:
                          schema:
                              properties:
                                  type:
                                      type: string
                                      default: FeatureCollection
                                  features:
                                      type: array
                                      items:
                                          schema:
                                              $ref: "#/definitions/GeoJsonFeature"
        responses:
            200:
                description: Intersecting tasks found successfully
            400:
                description: Client Error - Invalid Request
            500:
                description: Internal Server Error
        """
        try:
            grid_dto = GridDTO(request.get_json())
            grid_dto.validate()
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return {
                "Error": "Unable to fetch tiles interesecting AOI",
                "SubCode": "InvalidData",
            }, 400

        try:
            grid = GridService.trim_grid_to_aoi(grid_dto)
            return grid, 200
        except InvalidGeoJson as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 400


class TasksQueriesMappedAPI(Resource):
    def get(self, project_id):
        """
        Get all mapped tasks for a project grouped by username
        ---
        tags:
            - tasks
        produces:
            - application/json
        parameters:
            - name: project_id
              in: path
              description: Unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Mapped tasks returned
            500:
                description: Internal Server Error
        """
        ProjectService.get_project_by_id(project_id)
        mapped_tasks = ValidatorService.get_mapped_tasks_by_user(project_id)
        return mapped_tasks.to_primitive(), 200


class TasksQueriesOwnInvalidatedAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def get(self, username):
        """
        Get invalidated tasks either mapped by user or invalidated by user
        ---
        tags:
            - tasks
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
            - name: username
              in: path
              description: The users username
              required: true
              type: string
            - in: query
              name: asValidator
              description: treats user as validator, rather than mapper, if true
              type: string
            - in: query
              name: sortBy
              description: field to sort by, defaults to action_date
              type: string
            - in: query
              name: sortDirection
              description: direction of sort, defaults to desc
              type: string
            - in: query
              name: page
              description: Page of results user requested
              type: integer
            - in: query
              name: pageSize
              description: Size of page, defaults to 10
              type: integer
            - in: query
              name: project
              description: Optional project filter
              type: integer
            - in: query
              name: closed
              description: Optional filter for open/closed invalidations
              type: boolean
        responses:
            200:
                description: Invalidated tasks user has invalidated
            404:
                description: No invalidated tasks
            500:
                description: Internal Server Error
        """
        sort_column = {"updatedDate": "updated_date", "projectId": "project_id"}
        if request.args.get("sortBy", "updatedDate") in sort_column:
            sort_column = sort_column[request.args.get("sortBy", "updatedDate")]
        else:
            sort_column = sort_column["updatedDate"]
        # closed needs to be set to True, False, or None
        closed = None
        if request.args.get("closed") == "true":
            closed = True
        elif request.args.get("closed") == "false":
            closed = False
        # sort direction should only be desc or asc
        if request.args.get("sortDirection") in ["asc", "desc"]:
            sort_direction = request.args.get("sortDirection")
        else:
            sort_direction = "desc"
        invalidated_tasks = ValidatorService.get_user_invalidated_tasks(
            request.args.get("asValidator") == "true",
            username,
            request.environ.get("HTTP_ACCEPT_LANGUAGE"),
            closed,
            request.args.get("project", None, type=int),
            request.args.get("page", None, type=int),
            request.args.get("pageSize", None, type=int),
            sort_column,
            sort_direction,
        )
        return invalidated_tasks.to_primitive(), 200
