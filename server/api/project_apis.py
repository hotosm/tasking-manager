import geojson, io
from flask import send_file
from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError
from distutils.util import strtobool
from server.models.dtos.project_dto import ProjectSearchDTO, ProjectSearchBBoxDTO
from server.models.postgis.task import Task
from server.models.postgis.task_annotation import TaskAnnotation
from server.services.project_search_service import ProjectSearchService, ProjectSearchServiceError, BBoxTooBigError
from server.services.project_service import ProjectService, ProjectServiceError, NotFound
from server.services.users.user_service import UserService
from server.services.users.authentication_service import token_auth, tm, verify_token
from server.services.task_annotations_service import TaskAnnotationsService


class ProjectAPI(Resource):
    def get(self, project_id):
        """
        Get HOT Project for mapping
        ---
        tags:
            - mapping
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
            - in: query
              name: as_file
              type: boolean
              description: Set to true if file download is preferred
              default: False
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
            as_file = strtobool(request.args.get('as_file')) if request.args.get('as_file') else False

            project_dto = ProjectService.get_project_dto_for_mapper(project_id,
                                                                    request.environ.get('HTTP_ACCEPT_LANGUAGE'))
            project_dto = project_dto.to_primitive()

            if as_file:
                return send_file(io.BytesIO(geojson.dumps(project_dto).encode('utf-8')), mimetype='application/json',
                                 as_attachment=True, attachment_filename=f'project_{str(project_id)}.json')

            return project_dto, 200
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except ProjectServiceError as e:
            return {"error": str(e)}, 403
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
        finally:
            # this will try to unlock tasks older than 2 hours
            try:
                ProjectService.auto_unlock_tasks(project_id)
            except Exception as e:
                current_app.logger.critical(str(e))


class ProjectAOIAPI(Resource):
    def get(self, project_id):
        """
        Get AOI of Project
        ---
        tags:
            - mapping
        produces:
            - application/json
        parameters:
            - name: project_id
              in: path
              description: The unique project ID
              required: true
              type: integer
              default: 1
            - in: query
              name: as_file
              type: boolean
              description: Set to false if file download not preferred
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
            as_file = strtobool(request.args.get('as_file')) if request.args.get('as_file') else True

            project_aoi = ProjectService.get_project_aoi(project_id)

            if as_file:
                return send_file(io.BytesIO(geojson.dumps(project_aoi).encode('utf-8')), mimetype='application/json',
                                 as_attachment=True, attachment_filename=f'{str(project_id)}.geoJSON')

            return project_aoi, 200
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except ProjectServiceError as e:
            return {"Error": str(e)}, 403
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class ProjectSearchBBoxAPI(Resource):

    @tm.pm_only(True)
    @token_auth.login_required
    def get(self):
        """
        Search for projects by bbox projects
        ---
        tags:
            - search
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
            - in: query
              name: bbox
              description: comma separated list xmin, ymin, xmax, ymax
              type: string
              default: 34.404,-1.034, 34.717,-0.624
            - in: query
              name: srid
              description: srid of bbox coords
              type: integer
              default: 4326
            - in: query
              name: createdByMe
              description: limit to projects created by authenticated user
              type: boolean
              required: true
              default: false

        responses:
            200:
                description: ok
            400:
                description: Client Error - Invalid Request
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            search_dto = ProjectSearchBBoxDTO()
            search_dto.bbox = map(float, request.args.get('bbox').split(','))
            search_dto.input_srid = request.args.get('srid')
            search_dto.preferred_locale = request.environ.get('HTTP_ACCEPT_LANGUAGE')
            createdByMe = strtobool(request.args.get('createdByMe')) if request.args.get('createdByMe') else False
            if createdByMe:
                search_dto.project_author = tm.authenticated_user_id
            search_dto.validate()
        except Exception as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400
        try:
            geojson = ProjectSearchService.get_projects_geojson(search_dto)
            return geojson, 200
        except BBoxTooBigError:
            return {"Error": "Bounding Box too large"}, 403
        except ProjectSearchServiceError as e:
            return {"error": str(e)}, 400
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class ProjectSearchAPI(Resource):
    def get(self):
        """
        Search active projects
        ---
        tags:
            - search
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              type: string
              default: Token sessionTokenHere==
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
            - in: query
              name: mapperLevel
              type: string
              default: BEGINNER
            - in: query
              name: mappingTypes
              type: string
              default: ROADS,BUILDINGS
            - in: query
              name: organisationTag
              type: string
              default: red cross
            - in: query
              name: campaignTag
              type: string
              default: malaria
            - in: query
              name: page
              description: Page of results user requested
              type: integer
              default: 1
            - in: query
              name: textSearch
              description: text to search
              type: string
              default: serbia
            - in: query
              name: projectStatuses
              description: Authenticated PMs can search for archived or draft statuses
              type: string
        responses:
            200:
                description: Projects found
            404:
                description: No projects found
            500:
                description: Internal Server Error
        """
        try:
            search_dto = ProjectSearchDTO()
            search_dto.preferred_locale = request.environ.get('HTTP_ACCEPT_LANGUAGE')
            search_dto.mapper_level = request.args.get('mapperLevel')
            search_dto.organisation_tag = request.args.get('organisationTag')
            search_dto.campaign_tag = request.args.get('campaignTag')
            search_dto.page = int(request.args.get('page')) if request.args.get('page') else 1
            search_dto.text_search = request.args.get('textSearch')

            # See https://github.com/hotosm/tasking-manager/pull/922 for more info
            try:
                verify_token(request.environ.get('HTTP_AUTHORIZATION').split(None, 1)[1])
                if UserService.is_user_a_project_manager(tm.authenticated_user_id):
                    search_dto.is_project_manager = True
            except:
                pass

            mapping_types_str = request.args.get('mappingTypes')
            if mapping_types_str:
                search_dto.mapping_types = map(str, mapping_types_str.split(','))  # Extract list from string
            project_statuses_str = request.args.get('projectStatuses')
            if project_statuses_str:
                search_dto.project_statuses = map(str, project_statuses_str.split(','))
            search_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            results_dto = ProjectSearchService.search_projects(search_dto)
            return results_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "No projects found"}, 404
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class HasUserTaskOnProject(Resource):

    @tm.pm_only(False)
    @token_auth.login_required
    def get(self, project_id):
        """
        Gets any locked task on the project from logged in user
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
            locked_tasks = ProjectService.get_task_for_logged_in_user(project_id, tm.authenticated_user_id)
            return locked_tasks.to_primitive(), 200
        except NotFound:
            return {"Error": "User has no locked tasks"}, 404
        except Exception as e:
            error_msg = f'HasUserTaskOnProject - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

class HasUserTaskOnProjectDetails(Resource):

    @tm.pm_only(False)
    @token_auth.login_required
    def get(self, project_id):
        """
        Gets details of any locked task on the project from logged in user
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
            preferred_locale = request.environ.get('HTTP_ACCEPT_LANGUAGE')
            locked_tasks = ProjectService.get_task_details_for_logged_in_user(project_id, tm.authenticated_user_id, preferred_locale)
            return locked_tasks.to_primitive(), 200
        except NotFound:
            return {"Error": "User has no locked tasks"}, 404
        except Exception as e:
            error_msg = f'HasUserTaskOnProject - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class ProjectSummaryAPI(Resource):

    def get(self, project_id: int):
        """
        Gets project summary
        ---
        tags:
          - mapping
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
              description: The ID of the project
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Project Summary
            404:
                description: Project not found
            500:
                description: Internal Server Error
        """
        try:
            preferred_locale = request.environ.get('HTTP_ACCEPT_LANGUAGE')
            summary = ProjectService.get_project_summary(project_id, preferred_locale)
            return summary.to_primitive(), 200
        except NotFound:
            return {"Error": "Project not found"}, 404
        except Exception as e:
            error_msg = f'Project Summary GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class TaskAnnotationsAPI(Resource):
    def get(self, project_id: int, annotation_type: str = None):
        """
        Get all task annotations for a project
        ---
        tags:
          - project-admin
        produces:
          - application/json
        parameters:
            - name: project_id
              in: path
              description: The ID of the project
              required: true
              type: integer
            - name: annotation_type
              in: path
              description: The type of annotation to fetch
              required: false
              type: string
        responses:
            200:
                description: Project Annotations
            404:
                description: Project or annotations not found
            500:
                description: Internal Server Error
        """
        try:
            project = ProjectService.get_project_by_id(project_id)
        except NotFound as e:
            current_app.logger.error(f'Error validating project: {str(e)}')
            return {"Error": "Project not found"}, 404

        try:
            if annotation_type:
                annotations = TaskAnnotation.get_task_annotations_by_project_id_type(project_id, annotation_type)
            else:
                annotations = TaskAnnotation.get_task_annotations_by_project_id(project_id)
            return annotations.to_primitive(), 200
        except NotFound:
            return {"Error": "Annotations not found"}, 404

    def post(self, project_id: int, annotation_type: str):
        """
        Store new task annotations for tasks of a project
        ---
        tags:
            - project-admin
        produces:
            - application/json
        parameters:
            - in: header
              name: Content-Type
              description: Content type for post body
              required: true
              type: string
              default: application/json
            - name: project_id
              in: path
              description: The unique project ID
              required: true
              type: integer
            - name: annotation_type
              in: path
              description: Annotation type
              required: true
              type: string
            - in: body
              name: body
              required: true
              description: JSON object for creating draft project
              schema:
                projectId:
                    type: integer
                    required: true
                annotationType:
                    type: string
                    required: true
                tasks:
                    type: array
                    required: true
                    items:
                        schema:
                            taskId:
                                type: integer
                                required: true
                            annotationSource:
                                type: string
                            properties:
                                description: JSON object with properties
        responses:
            200:
                description: Project updated
            400:
                description: Client Error - Invalid Request
            404:
                description: Project or task not found
            500:
                description: Internal Server Error
        """
        try:
            annotations = request.get_json()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')

        try:
            project = ProjectService.get_project_by_id(project_id)
        except NotFound as e:
            current_app.logger.error(f'Error validating project: {str(e)}')

        task_ids = [t['taskId'] for t in annotations['tasks']]

        # check if task ids are valid
        tasks = Task.get_tasks(project_id, task_ids)
        tasks_ids_db = [t.id for t in tasks]
        if (len(task_ids) != len(tasks_ids_db)):
            return {"error": 'Invalid task id'}, 500

        for annotation in annotations['tasks']:
            TaskAnnotationsService.add_or_update_annotation(annotation, project_id, annotation_type)

    def put(self, project_id: int, task_id: int):
        """
        Update a single task's annotations
        """
        pass
