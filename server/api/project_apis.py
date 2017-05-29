from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from server.models.dtos.project_dto import ProjectSearchDTO, ProjectSearchBBoxDTO
from server.services.project_search_service import ProjectSearchService
from server.services.project_service import ProjectService, ProjectServiceError, NotFound
from server.services.users.authentication_service import token_auth, tm


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
            project_dto = ProjectService.get_project_dto_for_mapper(project_id,
                                                                    request.environ.get('HTTP_ACCEPT_LANGUAGE'))
            return project_dto.to_primitive(), 200
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
        responses:
            200:
                description: Projects found
            404:
                description: No projects found
            500:
                description: Internal Server Error
        """
        try:
            search_dto = ProjectSearchBBoxDTO()
            search_dto.bbox = map(float, request.args.get('bbox').split(','))
            search_dto.input_srid = request.args.get('srid')
            search_dto.preferred_locale = request.environ.get('HTTP_ACCEPT_LANGUAGE')
            search_dto.validate()
        except Exception as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400
        try:
            geojson= ProjectSearchService.get_projects_geojson(search_dto)
            return geojson, 200
        except NotFound:
            return {"Error": "No projects found"}, 404
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

            mapping_types_str = request.args.get('mappingTypes')
            if mapping_types_str:
                search_dto.mapping_types = map(str, mapping_types_str.split(','))  # Extract list from string
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
