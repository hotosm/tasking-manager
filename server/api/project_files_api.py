import os
from flask_restful import Resource, current_app, request
from werkzeug.utils import secure_filename
from schematics.exceptions import DataError

from server.services.users.authentication_service import token_auth, tm
from server.models.postgis.project_files import ProjectFiles
from server.models.dtos.project_dto import ProjectFileDTO
from server.services.project_admin_service import ProjectAdminService
from server.models.postgis.utils import NotFound


class ProjectFilesAPI(Resource):

    def get(self, project_id):
        """
        Get all files for a project
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
                description: Files found
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            files = ProjectFiles.get_all_files(project_id)
            return files.to_primitive(), 200
        except NotFound:
            return {"Error": "No chat messages found for project"}, 404
        except Exception as e:
            error_msg = f'Files GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @tm.pm_only()
    @token_auth.login_required
    def put(self, project_id):
        """
        Save a new file for a project
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
            - name: file
              in: formData
              description: The file to be saved
              required: true
              type: file
        responses:
            200:
                description: File uploaded
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            project_file_dto = ProjectFileDTO()
            file = request.files['file']
            if file:
                file_name = secure_filename(file.filename)
                path = os.path.join(current_app.config['PROJECT_FILES_DIR'], str(project_id))
                if not os.path.exists(path):
                    os.makedirs(path)
                file_path = os.path.join(path, file_name)
                file.save(file_path)

                project_file_dto.path = path
                project_file_dto.project_id = project_id
                project_file_dto.file_name = file_name
                project_file_dto.validate()
        except DataError as e:
            current_app.logger.error(f'error validating request: {str(e)}')
            return str(e), 400

        try:
            ProjectAdminService.create_project_file(project_file_dto)
            return {"Success": "File uploaded"}, 200
        except FileExistsError:
            return {"Error": "Project already has this file"}, 403
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except Exception as e:
            error_msg = f'Project Files POST - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class ProjectFileAPI(Resource):

    def get(self, project_id):
        """
        Get one file for a project
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
            - name: file_id
              in: query
              description: The unique file ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: File found
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            file_id = request.args.get('file_id') if request.args.get('file_id') else None

            file = ProjectFiles.get_file(project_id, file_id)
            return file.to_primitive(), 200
        except NotFound:
            return {"Error": "No chat messages found for project"}, 404
        except Exception as e:
            error_msg = f'Files GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    def delete(self, project_id):
        """
        Delete a file from a project
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
            - name: file_id
              in: query
              description: The unique file ID
              required: true
              type: integer
              default: null
        responses:
            200:
                description: File deleted
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            file_id = request.args.get('file_id') if request.args.get('file_id') else None

            file = ProjectFiles.get(project_id, file_id)
            path = file.path
            file_name = file.file_name

        except NotFound:
            return {"Error": "File info not found"}, 404
        except Exception as e:
            error_msg = f'Project File DELETE - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

        try:
            ProjectAdminService.delete_project_file(project_id, file_id)
        except NotFound:
            return {"Error": "Project File Not Found"}, 404
        except Exception as e:
            error_msg = f'Project File DELETE - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

        try:
            os.remove(os.path.join(path, file_name))
            return {"Success": "Project File Deleted"}, 200
        except FileNotFoundError:
            return {"Error": "File not found"}, 404
