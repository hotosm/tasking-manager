from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.project_dto import DraftProjectDTO, ProjectDTO
from server.services.project_admin_service import ProjectAdminService, InvalidGeoJson, InvalidData, \
    ProjectAdminServiceError, NotFound
from server.services.users.authentication_service import token_auth, tm
from server.services.validator_service import ValidatorService


class ProjectAdminAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def put(self):
        """
        Creates a tasking-manager project
        ---
        tags:
            - project-admin
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
              description: JSON object for creating draft project
              schema:
                  properties:
                      projectName:
                          type: string
                          default: HOT Project
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
                      tasks:
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
                      arbitraryTasks:
                          type: boolean
                          default: false
        responses:
            201:
                description: Draft project created successfully
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            draft_project_dto = DraftProjectDTO(request.get_json())
            draft_project_dto.user_id = tm.authenticated_user_id
            draft_project_dto.validate()
        except DataError as e:
            current_app.logger.error(f'error validating request: {str(e)}')
            return str(e), 400

        try:
            draft_project_id = ProjectAdminService.create_draft_project(draft_project_dto)
            return {"projectId": draft_project_id}, 201
        except (InvalidGeoJson, InvalidData) as e:
            return {"error": f'{str(e)}'}, 400
        except Exception as e:
            error_msg = f'Project PUT - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @tm.pm_only()
    @token_auth.login_required
    def get(self, project_id):
        """
        Retrieves a Tasking-Manager project
        ---
        tags:
            - project-admin
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Project found
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: Project not found
            500:
                description: Internal Server Error
        """
        try:
            project_dto = ProjectAdminService.get_project_dto_for_admin(project_id)
            return project_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Updates a Tasking-Manager project
        ---
        tags:
            - project-admin
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object for creating draft project
              schema:
                  properties:
                      projectStatus:
                          type: string
                          default: DRAFT
                      projectPriority:
                          type: string
                          default: MEDIUM
                      defaultLocale:
                          type: string
                          default: en
                      mapperLevel:
                          type: string
                          default: BEGINNER
                      enforceMapperLevel:
                          type: boolean
                          default: false
                      enforceValidatorRole:
                          type: boolean
                          default: false
                      private:
                          type: boolean
                          default: false
                      changesetComment:
                          type: string
                          default: hotosm-project-1
                      entitiesToMap:
                          type: string
                          default: Buildings only
                      dueDate:
                         type: date
                         default: "2017-04-11T12:38:49"
                      imagery:
                          type: string
                          default: http//www.bing.com/maps/
                      josmPreset:
                          type: string
                          default: josm preset goes here
                      mappingTypes:
                          type: array
                          items:
                              type: string
                          default: [BUILDINGS, ROADS]
                      campaignTag:
                          type: string
                          default: malaria
                      organisationTag:
                          type: string
                          default: red cross
                      licenseId:
                          type: integer
                          default: 1
                          description: Id of imagery license associated with the project
                      allowedUsernames:
                          type: array
                          items:
                              type: string
                          default: ["Iain Hunter", LindaA1]
                      priorityAreas:
                          type: array
                          items:
                              schema:
                                  $ref: "#/definitions/GeoJsonPolygon"
                      projectInfoLocales:
                          type: array
                          items:
                              schema:
                                  $ref: "#/definitions/ProjectInfo"
        responses:
            200:
                description: Project updated
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: Project not found
            500:
                description: Internal Server Error
        """
        try:
            project_dto = ProjectDTO(request.get_json())
            project_dto.project_id = project_id
            project_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            ProjectAdminService.update_project(project_dto)
            return {"Status": "Updated"}, 200
        except InvalidGeoJson as e:
            return {"Invalid GeoJson": str(e)}, 400
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except ProjectAdminServiceError as e:
            return {"error": str(e)}, 400
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @tm.pm_only()
    @token_auth.login_required
    def delete(self, project_id):
        """
        Deletes a Tasking-Manager project
        ---
        tags:
            - project-admin
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Project deleted
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden - users have submitted mapping
            404:
                description: Project not found
            500:
                description: Internal Server Error
        """
        try:
            ProjectAdminService.delete_project(project_id)
            return {"Success": "Project deleted"}, 200
        except ProjectAdminServiceError:
            return {"Error": "Project has some mapping"}, 403
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class ProjectCommentsAPI(Resource):

    def get(self, project_id):
        """
        Gets all comments for project
        ---
        tags:
            - project-admin
        produces:
            - application/json
        parameters:
            - name: project_id
              in: path
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Comments found
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: No comments found
            500:
                description: Internal Server Error
        """
        try:
            comments_dto = ProjectAdminService.get_all_comments(project_id)
            return comments_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "No comments found"}, 404
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class ProjectInvalidateAll(Resource):

    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Invalidate all mapped tasks on a project
        ---
        tags:
            - project-admin
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All mapped tasks invalidated
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            ValidatorService.invalidate_all_tasks(project_id, tm.authenticated_user_id)
            return {"Success": "All tasks invalidated"}, 200
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class ProjectValidateAll(Resource):

    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Validate all mapped tasks on a project
        ---
        tags:
            - project-admin
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
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: All mapped tasks validated
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            ValidatorService.validate_all_tasks(project_id, tm.authenticated_user_id)
            return {"Success": "All tasks validated"}, 200
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class ProjectsForAdminAPI(Resource):

    @tm.pm_only()
    @token_auth.login_required
    def get(self):
        """
        Get all projects for logged in admin
        ---
        tags:
            - project-admin
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
        responses:
            200:
                description: All mapped tasks validated
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: Admin has no projects
            500:
                description: Internal Server Error
        """
        try:
            admin_projects = ProjectAdminService.get_projects_for_admin(tm.authenticated_user_id,
                                                                        request.environ.get('HTTP_ACCEPT_LANGUAGE'))
            return admin_projects.to_primitive(), 200
        except NotFound:
            return {"Error": "No comments found"}, 404
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class ProjectClone(Resource):

    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Clones the project
        ---
        tags:
            - project-admin
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
              description: ID of project your want to clone
              required: true
              type: integer
              default: 1
        responses:
            201:
                description: Project cloned
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            cloned_project_id = ProjectAdminService.clone_project(project_id, tm.authenticated_user_id)
            return {"clonedProjectId": cloned_project_id}, 201
        except Exception as e:
            error_msg = f'Project Clone - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500