from flask_restful import Resource, current_app, request
from server.services.project_service import ProjectService, ProjectServiceError, NotFound


class ProjectAPI(Resource):

    def get(self, project_id):
        """
        Get HOT Project for mapping
        ---
        tags:
            - project
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
            project_service = ProjectService.from_project_id(project_id)
            project_dto = project_service.get_project_dto_for_mapper(request.environ.get('HTTP_ACCEPT_LANGUAGE'))
            return project_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except ProjectServiceError as e:
            return {"error": str(e)}, 403
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
