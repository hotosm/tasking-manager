import geojson
import io
from flask import send_file
from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError
from distutils.util import strtobool
from server.models.dtos.project_dto import (
    DraftProjectDTO,
    ProjectDTO,
    ProjectSearchDTO,
    ProjectSearchBBoxDTO,
)
from server.services.project_search_service import (
    ProjectSearchService,
    ProjectSearchServiceError,
    BBoxTooBigError,
)
from server.services.project_service import (
    ProjectService,
    ProjectServiceError,
    NotFound,
)
from server.services.users.user_service import UserService
from server.services.users.authentication_service import token_auth, tm, verify_token
from server.services.project_admin_service import (
    ProjectAdminService,
    ProjectAdminServiceError,
    InvalidGeoJson,
    InvalidData,
)


class ProjectsRestAPI(Resource):
    def get(self, project_id):
        """
        Get a specified project including it's area
        ---
        tags:
            - projects
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
            - in: query
              name: abbreviated
              type: boolean
              description: Set to true if only state information is desired
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
            as_file = (
                strtobool(request.args.get("as_file"))
                if request.args.get("as_file")
                else False
            )
            abbreviated = (
                strtobool(request.args.get("abbreviated"))
                if request.args.get("abbreviated")
                else False
            )

            project_dto = ProjectService.get_project_dto_for_mapper(
                project_id, request.environ.get("HTTP_ACCEPT_LANGUAGE"), abbreviated
            )
            project_dto = project_dto.to_primitive()

            if as_file:
                return send_file(
                    io.BytesIO(geojson.dumps(project_dto).encode("utf-8")),
                    mimetype="application/json",
                    as_attachment=True,
                    attachment_filename=f"project_{str(project_id)}.json",
                )

            return project_dto, 200
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except ProjectServiceError:
            return {"Error": "Unable to fetch project"}, 403
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch project"}, 500
        finally:
            # this will try to unlock tasks that have been locked too long
            try:
                ProjectService.auto_unlock_tasks(project_id)
            except Exception as e:
                current_app.logger.critical(str(e))

    @tm.pm_only()
    @token_auth.login_required
    def post(self):
        """
        Creates a tasking-manager project
        ---
        tags:
            - projects
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
                    cloneFromProjectId:
                        type: int
                        default: 1
                        description: Specify this value if you want to clone a project, otherwise avoid information
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
            current_app.logger.error(f"error validating request: {str(e)}")
            return {"Error": "Unable to create project"}, 400

        try:
            draft_project_id = ProjectAdminService.create_draft_project(
                draft_project_dto
            )
            return {"projectId": draft_project_id}, 201
        except (InvalidGeoJson, InvalidData):
            return {"Error": "Invalid GeoJson"}, 400
        except Exception as e:
            error_msg = f"Project PUT - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to create project"}, 500

    @tm.pm_only()
    @token_auth.login_required
    def head(self, project_id):
        """
        Retrieves a Tasking-Manager project
        ---
        tags:
            - projects
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
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch project"}, 500

    @tm.pm_only()
    @token_auth.login_required
    def patch(self, project_id):
        """
        Updates a Tasking-Manager project
        ---
        tags:
            - projects
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
                    allowNonBeginners:
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
                    mappingEditors:
                        type: array
                        items:
                            type: string
                        default: [ID, JOSM, POTLATCH_2, FIELD_PAPERS]
                    validationEditors:
                        type: array
                        items:
                            type: string
                        default: [ID, JOSM, POTLATCH_2, FIELD_PAPERS]
                    campaignTag:
                        type: string
                        default: malaria
                    organisationTag:
                        type: string
                        default: red cross
                    countryTag:
                          type: array
                          items:
                              type: string
                          default: []
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
                    taskCreationMode:
                        type: integer
                        default: GRID
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
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to update project"}, 400

        try:
            ProjectAdminService.update_project(project_dto, tm.authenticated_user_id)
            return {"Status": "Updated"}, 200
        except InvalidGeoJson as e:
            return {"Invalid GeoJson": str(e)}, 400
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except ProjectAdminServiceError:
            return {"Error": "Unable to update project"}, 400
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to update project"}, 500

    @tm.pm_only()
    @token_auth.login_required
    def delete(self, project_id):
        """
        Deletes a Tasking-Manager project
        ---
        tags:
            - projects
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
            ProjectAdminService.delete_project(project_id, tm.authenticated_user_id)
            return {"Success": "Project deleted"}, 200
        except ProjectAdminServiceError:
            return {"Error": "Project has some mapping"}, 403
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to delete project"}, 500


class ProjectsAllAPI(Resource):
    def get(self):
        """
        List and search for projects
        ---
        tags:
            - projects
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
              name: orderBy
              type: string
              default: priority
              enum: [id,mapper_level,priority,status,last_updated,due_date]
            - in: query
              name: orderByType
              type: string
              default: ASC
              enum: [ASC, DESC]
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
              name: country
              description: Project country
              type: string
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
            search_dto.preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            search_dto.mapper_level = request.args.get("mapperLevel")
            search_dto.organisation_tag = request.args.get("organisationTag")
            search_dto.campaign_tag = request.args.get("campaignTag")
            search_dto.order_by = request.args.get("orderBy", "priority")
            search_dto.country = request.args.get("country")
            search_dto.order_by_type = request.args.get("orderByType", "ASC")
            search_dto.page = (
                int(request.args.get("page")) if request.args.get("page") else 1
            )
            search_dto.text_search = request.args.get("textSearch")

            # See https://github.com/hotosm/tasking-manager/pull/922 for more info
            try:
                verify_token(
                    request.environ.get("HTTP_AUTHORIZATION").split(None, 1)[1]
                )
                if UserService.is_user_a_project_manager(tm.authenticated_user_id):
                    search_dto.is_project_manager = True
            except Exception:
                pass

            mapping_types_str = request.args.get("mappingTypes")
            if mapping_types_str:
                search_dto.mapping_types = map(
                    str, mapping_types_str.split(",")
                )  # Extract list from string
            project_statuses_str = request.args.get("projectStatuses")
            if project_statuses_str:
                search_dto.project_statuses = map(str, project_statuses_str.split(","))
            search_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to fetch projects"}, 400

        try:
            results_dto = ProjectSearchService.search_projects(search_dto)
            return results_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "No projects found"}, 404
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch projects"}, 500


class ProjectsQueriesBboxAPI(Resource):
    @tm.pm_only(True)
    @token_auth.login_required
    def get(self):
        """
        List and search projects by bounding box
        ---
        tags:
            - projects
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
            search_dto.bbox = map(float, request.args.get("bbox").split(","))
            search_dto.input_srid = request.args.get("srid")
            search_dto.preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            createdByMe = (
                strtobool(request.args.get("createdByMe"))
                if request.args.get("createdByMe")
                else False
            )
            if createdByMe:
                search_dto.project_author = tm.authenticated_user_id
            search_dto.validate()
        except Exception as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return {"Error": "Unable to fetch projects"}, 400
        try:
            geojson = ProjectSearchService.get_projects_geojson(search_dto)
            return geojson, 200
        except BBoxTooBigError:
            return {"Error": "Bounding Box too large"}, 403
        except ProjectSearchServiceError:
            return {"Error": "Unable to fetch projects"}, 400
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch projects"}, 500


class ProjectsQueriesOwnerAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def get(self):
        """
        Get all projects for logged in admin
        ---
        tags:
            - projects
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
            admin_projects = ProjectAdminService.get_projects_for_admin(
                tm.authenticated_user_id, request.environ.get("HTTP_ACCEPT_LANGUAGE")
            )
            return admin_projects.to_primitive(), 200
        except NotFound:
            return {"Error": "No comments found"}, 404
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class ProjectsQueriesTouchedAPI(Resource):
    def get(self, username):
        """
        Gets projects user has mapped
        ---
        tags:
          - projects
        produces:
          - application/json
        parameters:
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
              default: Thinkwhere
        responses:
            200:
                description: Mapped projects found
            404:
                description: No mapped projects found
            500:
                description: Internal Server Error
        """
        try:
            locale = (
                request.environ.get("HTTP_ACCEPT_LANGUAGE")
                if request.environ.get("HTTP_ACCEPT_LANGUAGE")
                else "en"
            )
            user_dto = UserService.get_mapped_projects(username, locale)
            return user_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User or mapping not found"}, 404
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch projects"}, 500


class ProjectsQueriesSummaryAPI(Resource):
    def get(self, project_id: int):
        """
        Gets project summary
        ---
        tags:
            - projects
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
            preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            summary = ProjectService.get_project_summary(project_id, preferred_locale)
            return summary.to_primitive(), 200
        except NotFound:
            return {"Error": "Project not found"}, 404
        except Exception as e:
            error_msg = f"Project Summary GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch project summary"}, 500


class ProjectsQueriesNoGeometriesAPI(Resource):
    def get(self, project_id):
        """
        Get HOT Project for mapping
        ---
        tags:
            - projects
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
            as_file = (
                strtobool(request.args.get("as_file"))
                if request.args.get("as_file")
                else False
            )
            project_dto = ProjectService.get_project_dto_for_mapper(
                project_id, request.environ.get("HTTP_ACCEPT_LANGUAGE"), True
            )
            project_dto = project_dto.to_primitive()

            if as_file:
                return send_file(
                    io.BytesIO(geojson.dumps(project_dto).encode("utf-8")),
                    mimetype="application/json",
                    as_attachment=True,
                    attachment_filename=f"project_{str(project_id)}.json",
                )

            return project_dto, 200
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except ProjectServiceError:
            return {"Error": "Unable to fetch project"}, 403
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch project"}, 500
        finally:
            # this will try to unlock tasks that have been locked too long
            try:
                ProjectService.auto_unlock_tasks(project_id)
            except Exception as e:
                current_app.logger.critical(str(e))


class ProjectsQueriesNoTasksAPI(Resource):
    @tm.pm_only()
    @token_auth.login_required
    def get(self, project_id):
        """
        Retrieves a Tasking-Manager project
        ---
        tags:
            - project admin
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
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class ProjectsQueriesAoiAPI(Resource):
    def get(self, project_id):
        """
        Get AOI of Project
        ---
        tags:
            - projects
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
            as_file = (
                strtobool(request.args.get("as_file"))
                if request.args.get("as_file")
                else True
            )

            project_aoi = ProjectService.get_project_aoi(project_id)

            if as_file:
                return send_file(
                    io.BytesIO(geojson.dumps(project_aoi).encode("utf-8")),
                    mimetype="application/json",
                    as_attachment=True,
                    attachment_filename=f"{str(project_id)}.geoJSON",
                )

            return project_aoi, 200
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except ProjectServiceError:
            return {"Error": "Unable to fetch project"}, 403
        except Exception as e:
            error_msg = f"Project GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch project"}, 500


class ProjectsQueriesFeaturedAPI(Resource):
    def get(self):
        """
        Get featured projects
        ---
        tags:
            - projects
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
        responses:
            200:
                description: Featured projects
            500:
                description: Internal Server Error
        """
        try:
            preferred_locale = request.environ.get("HTTP_ACCEPT_LANGUAGE")
            projects_dto = ProjectService.get_featured_projects(preferred_locale)
            return projects_dto.to_primitive(), 200
        except Exception as e:
            error_msg = f"FeaturedProjects GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
