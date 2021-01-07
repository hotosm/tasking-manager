from json import JSONEncoder
from flask_restful import Resource, request, current_app
from backend.services.users.user_service import UserService, NotFound
from backend.services.stats_service import StatsService
from backend.services.interests_service import InterestService
from backend.services.users.authentication_service import token_auth, tm
from datetime import datetime


class UsersStatisticsAPI(Resource, JSONEncoder):
    # @token_auth.login_required
    def get(self, username):
        """
        Get detailed stats about a user by OpenStreetMap username
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
            - name: username
              in: path
              description: Mapper's OpenStreetMap username
              required: true
              type: string
              default: Thinkwhere
        responses:
            200:
                description: User found
            401:
                description: Unauthorized - Invalid credentials
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
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to fetch user statistics"}, 500


class UsersStatisticsInterestsAPI(Resource):
    @token_auth.login_required
    def get(self, user_id):
        """
        Get rate of contributions from a user given their interests
        ---
        tags:
            - interests
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
              description: User ID
              required: true
              type: integer
        responses:
            200:
                description: Interest found
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            rate = InterestService.compute_contributions_rate(user_id)
            return rate.to_primitive(), 200
        except NotFound:
            return {"Error": "User not Found"}, 404
        except Exception as e:
            error_msg = f"Interest GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class UsersStatisticsAllAPI(Resource):
    @tm.pm_only(False)
    def get(self):
        """
        Get the mapped and validation of users registered within a period
        ---
        tags:
            - users
        produces:
            - application/json
        parameters:
            - in: query
              name: start
              description: From date
              required: true
              type: string
              default: 01-01-2000
            - in: query
              name: end
              description: To date.
              required: true
              type: string
              default: 30-12-2020
        responses:
            200:
                description: number of users registered in a period of time
            404:
                description: Invalid date format
            500:
                description: Internal Server Error
        """
        try:
            start = datetime.date(
                datetime.strptime(request.args.get("start"), "%d-%m-%Y")
            )  # convert string parameters to date
            end = datetime.date(datetime.strptime(request.args.get("end"), "%d-%m-%Y"))
            # get_all_user_statistics function of StatsService
            UserStats = StatsService.get_all_user_statistics(start, end)
            return UserStats, 200
        except NotFound:
            return {"Error": "Project not found"}, 404
        except Exception as e:
            error_msg = f"Chat GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {
                "Error": "Unable to fetch mapped and validated task with a period"
            }, 500
