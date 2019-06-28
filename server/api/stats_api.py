import io
import csv
from distutils.util import strtobool
from flask import send_file
from flask_restful import Resource, current_app, request
from server.services.stats_service import StatsService, NotFound
from server.services.project_service import ProjectService
from server.services.users.user_service import UserService
from server.services.users.authentication_service import token_auth, tm


class StatsContributionsAPI(Resource):

    def get(self, project_id):
        """
        Get all user contributions on a project
        ---
        tags:
          - stats
        produces:
          - application/json
        parameters:
            - name: project_id
              in: path
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: User contributions
            404:
                description: No contributions
            500:
                description: Internal Server Error
        """
        try:
            contributions = StatsService.get_user_contributions(project_id)
            return contributions.to_primitive(), 200
        except NotFound:
            return {"Error": "No contributions on project"}, 404
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class StatsActivityAPI(Resource):

    def get(self, project_id):
        """
        Get user actvity on a project
        ---
        tags:
          - stats
        produces:
          - application/json
        parameters:
            - name: project_id
              in: path
              required: true
              type: integer
              default: 1
            - in: query
              name: username
              description: Optional username filter
              type: string
            - in: query
              name: status
              description: Optional task status filter
              type: number
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
        responses:
            200:
                description: Project activity
            404:
                description: No activity
            500:
                description: Internal Server Error
        """
        try:
            preferred_locale = request.environ.get('HTTP_ACCEPT_LANGUAGE')
            page = int(request.args.get('page')) if request.args.get('page') else 1
            page_size = int(request.args.get('pageSize')) if request.args.get('pageSize') else 10
            sort_by = request.args.get('sortBy')
            sort_direction = request.args.get('sortDirection')
            username = request.args.get('username')
            status = request.args.get('status', None, type=int)
            activity = StatsService.get_latest_activity(project_id, preferred_locale, page, page_size, sort_by, sort_direction, username, status)
            return activity.to_primitive(), 200
        except NotFound:
            return {"Error": "No activity on project"}, 404
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class StatsActivityAllProjectsAPI(Resource):

    @token_auth.login_required
    def get(self):
        """
        Get user actvity on all projects
        ---
        tags:
          - stats
        produces:
          - application/json
        parameters:
            - in: query
              name: username
              description: Optional username filter
              type: string
            - in: query
              name: projectId
              description: Optional project filter
              type: integer
            - in: query
              name: status
              description: Optional task status filter
              type: number
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
        responses:
            200:
                description: Project activity
            403:
                description: Forbidden
            404:
                description: No activity
            500:
                description: Internal Server Error
        """
        try:
            # User must possess at least Validator role
            if not UserService.is_user_validator(tm.authenticated_user_id):
                return {"Error": "User not permitted to view stats for all projects."}, 403

            preferred_locale = request.environ.get('HTTP_ACCEPT_LANGUAGE')
            project_id = request.args.get('projectId', None, int)
            page = request.args.get('page', 1, int)
            page_size = request.args.get('pageSize', 10, int)
            sort_by = request.args.get('sortBy')
            sort_direction = request.args.get('sortDirection')
            username = request.args.get('username')
            status = request.args.get('status', None, int)
            project_name = request.args.get('projectTitle', None, str)
            activity = StatsService.get_latest_activity(project_id, preferred_locale, page, page_size, sort_by, sort_direction, username, status, project_name)
            return activity.to_primitive(), 200
        except NotFound:
            return {"Error": "No activity"}, 404
        except Exception as e:
            error_msg = f'Activity for All Projects GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class StatsProjectAPI(Resource):

    def get(self, project_id):
        """
        Get Project Stats
        ---
        tags:
          - stats
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
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Project stats
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        try:
            as_csv = strtobool(request.args.get('as_csv', 'false', str))
            summary = ProjectService.get_project_stats(project_id)

            if as_csv:
                summary_dict = summary.to_primitive(role='csv')
                out = io.StringIO()
                csv_writer = csv.DictWriter(out, summary_dict.keys())
                csv_writer.writeheader()
                csv_writer.writerow(summary_dict)

                # Convert StringIO to BytesIO for flask send_file
                bytes_out = io.BytesIO()
                bytes_out.write(out.getvalue().encode('utf-8'))
                bytes_out.seek(0)
                out.close()

                return send_file(bytes_out, mimetype='text/csv', as_attachment=True,
                                 attachment_filename=f'project-{str(project_id)}-summary-stats.csv')

            return summary.to_primitive(), 200
        except NotFound:
            return {"Error": "Project not found"}, 404
        except Exception as e:
            error_msg = f'Project Summary GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class HomePageStatsAPI(Resource):

    def get(self):
        """
        Get HomePage Stats
        ---
        tags:
          - stats
        produces:
          - application/json
        responses:
            200:
                description: Project stats
            500:
                description: Internal Server Error
        """
        try:
            stats = StatsService.get_homepage_stats()
            return stats.to_primitive(), 200
        except Exception as e:
            error_msg = f'Unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class StatsUserAPI(Resource):

    def get(self, username):
        """
        Get detailed stats about user
        ---
        tags:
          - user
        produces:
          - application/json
        parameters:
            - name: username
              in: path
              description: The users username
              required: true
              type: string
              default: Thinkwhere
        responses:
            200:
                description: User found
            404:
                description: User not found
            500:
                description: Internal Server Error
        """
        try:
            stats_dto = UserService.get_detailed_stats(username)
            return stats_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class StatsProjectUserAPI(Resource):

    def get(self, project_id, username):
        """
        Get detailed stats about user
        ---
        tags:
          - user
        produces:
          - application/json
        parameters:
            - name: project_id
              in: path
              required: true
              type: integer
              default: 1
            - name: username
              in: path
              description: The users username
              required: true
              type: string
              default: Thinkwhere
        responses:
            200:
                description: User found
            404:
                description: User not found
            500:
                description: Internal Server Error
        """
        try:
            stats_dto = ProjectService.get_project_user_stats(project_id, username)
            return stats_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User not found"}, 404
        except Exception as e:
            error_msg = f'User GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
