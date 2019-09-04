import io
from distutils.util import strtobool

from flask import send_file, Response
from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from server.models.dtos.grid_dto import GridDTO
from server.services.grid.grid_service import GridService
from server.services.project_admin_service import InvalidGeoJson
from server.services.users.authentication_service import token_auth, tm, verify_token
from server.services.validator_service import ValidatorService

from server.services.mapping_service import MappingService, NotFound
from server.services.project_service import ProjectService, ProjectServiceError


class TasksRestAPI(Resource):
    def get(self, project_id, task_id):
        """
        Get task for mapping
        ---
        tags:
            - tasks
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: false
              type: string
              default: Token sessionTokenHere==
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
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
            preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            token = request.environ.get("HTTP_AUTHORIZATION")

            # Login isn't required here, but if we have a token we can find out if the user can undo the task
            if token:
                verify_token(token[6:])

            user_id = tm.authenticated_user_id

            task = MappingService.get_task_as_dto(
                task_id, project_id, preferred_locale, user_id
            )
            return task.to_primitive(), 200
        except NotFound:
            return {"Error": "Task Not Found"}, 404
        except Exception as e:
            error_msg = f"Task GET API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch task"}, 500


class TasksQueriesJsonAPI(Resource):
    def get(self, project_id):
        """
        Get tasks as JSON
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
            as_file = (
                strtobool(request.args.get("as_file"))
                if request.args.get("as_file")
                else True
            )

            tasks = ProjectService.get_project_tasks(int(project_id))

            if as_file:
                tasks = str(tasks).encode("utf-8")
                return send_file(
                    io.BytesIO(tasks),
                    mimetype="application/json",
                    as_attachment=True,
                    attachment_filename=f"{str(project_id)}-tasks.geoJSON",
                )

            return tasks, 200
        except NotFound:
            return {"Error": "Project or Task Not Found"}, 404
        except ProjectServiceError as e:
            return {"Error": str(e)}, 403
        except Exception as e:
            current_app.logger.critical(e)
            return {"Error": "Unable to fetch task JSON"}, 500


class TasksQueriesXmlAPI(Resource):
    def get(self, project_id):
        """
        Get tasks as OSM XML
        ---
        tags:
            - tasks
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
        try:
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
                    attachment_filename=f"HOT-project-{project_id}.osm",
                )

            return Response(xml, mimetype="text/xml", status=200)
        except NotFound:
            return (
                {"Error": "Not found; please check the project and task numbers."},
                404,
            )
        except Exception as e:
            error_msg = f"Task as OSM API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch task XML"}, 500


class TasksQueriesGpxAPI(Resource):
    def get(self, project_id):
        """
        Get tasks as GPX
        ---
        tags:
            - tasks
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
                description: GPX XML
            400:
                description: Client error
            404:
                description: No mapped tasks
            500:
                description: Internal Server Error
        """
        try:
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
                    attachment_filename=f"HOT-project-{project_id}.gpx",
                )

            return Response(xml, mimetype="text/xml", status=200)
        except NotFound:
            return (
                {"Error": "Not found; please check the project and task numbers."},
                404,
            )
        except Exception as e:
            error_msg = f"Task as GPX API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch task GPX"}, 500


class TasksQueriesAoiAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def put(self):
        """
        Gets the tiles intersecting the aoi
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
            return {"Error": "Unable to fetch tiles interesecting AOI"}, 400

        try:
            grid = GridService.trim_grid_to_aoi(grid_dto)
            return grid, 200
        except InvalidGeoJson as e:
            return {"error": f"{str(e)}"}, 400
        except Exception as e:
            error_msg = f"IntersectingTiles GET API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch tiles intersecting AOI"}, 500


class TasksQueriesOwnLockedAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def get(self, project_id):
        """
        Gets any locked task on the project from logged in user
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
              description: The ID of the project the task is associated with
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Task user is working on
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: User is not working on any tasks
            500:
                description: Internal Server Error
        """
        try:
            locked_tasks = ProjectService.get_task_for_logged_in_user(
                project_id, tm.authenticated_user_id
            )
            return locked_tasks.to_primitive(), 200
        except NotFound:
            return {"Error": "User has no locked tasks"}, 404
        except Exception as e:
            error_msg = f"HasUserTaskOnProject - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch locked tasks for user"}, 500


class TasksQueriesOwnLockedDetailsAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def get(self, project_id):
        """
        Gets details of any locked task on the project from logged in user
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
            - name: project_id
              in: path
              description: The ID of the project the task is associated with
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Task user is working on
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: User is not working on any tasks
            500:
                description: Internal Server Error
        """
        try:
            preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            locked_tasks = ProjectService.get_task_details_for_logged_in_user(
                project_id, tm.authenticated_user_id, preferred_locale
            )
            return locked_tasks.to_primitive(), 200
        except NotFound:
            return {"Error": "User has no locked tasks"}, 404
        except Exception as e:
            error_msg = f"HasUserTaskOnProject - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch task details for user"}, 500


class TasksQueriesOwnMappedAPI(Resource):
    def get(self, project_id):
        """
        Get mapped tasks grouped by user
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
        responses:
            200:
                description: Task user is working on
            404:
                description: No mapped tasks
            500:
                description: Internal Server Error
        """
        try:
            mapped_tasks = ValidatorService.get_mapped_tasks_by_user(project_id)
            return mapped_tasks.to_primitive(), 200
        except NotFound:
            return {"Error": "No mapped tasks"}, 404
        except Exception as e:
            error_msg = f"Task Lock API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch mapped tasks"}, 500


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
        try:
            sort_column = {"updatedDate": "updated_date", "projectId": "project_id"}
            if request.args.get("sortBy", "updatedDate") in sort_column:
                sort_column = sort_column[request.args.get("SortBy", "updatedDate")]
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
        except NotFound:
            return {"Error": "No invalidated tasks"}, 404
        except Exception as e:
            error_msg = f"Invalidated Tasks API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch invalidated tasks for user"}, 500
