from server.models.postgis.application import Application
from server.services.users.authentication_service import AuthenticationService


class ApplicationService():
    @staticmethod
    def create_token(user_id: int) -> Application:
        application = Application(user_id)

        return application

    @staticmethod
    def get_token_for_logged_in_user(user_id: int, token: str):
        application = Application.get(user_id, token)

        if application is None:
            raise NotFound()

        return application

    @staticmethod
    def check_token(token):
        valid_token = get_token_for_logged_in_user(token)
        if not valid_token:
            return False

        valid_token, user_id = AuthenticationService.is_valid_token(token, 86400*30)

        if not valid_token:
            return False

        return True
