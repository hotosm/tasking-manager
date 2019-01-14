from server.models.postgis.application import Application
from server.models.postgis.utils import NotFound
from server.services.users.authentication_service import AuthenticationService


class ApplicationService():
    @staticmethod
    def create_token(user_id: int) -> Application:
        application = Application().create(user_id)

        return application.as_dto()

    @staticmethod
    def get_token_for_logged_in_user(user_id: int, token: str):
        application = Application.get_token(user_id, token)

        if application is None:
            raise NotFound()

        return application

    @staticmethod
    def get_all_tokens_for_logged_in_user(user_id: int):
        tokens = Application.get_all_for_user(user_id)

        return tokens

    @staticmethod
    def check_token(userid, token):
        valid_token = get_token_for_logged_in_user(userid, token)
        if not valid_token:
            return False

        valid_token, user_id = AuthenticationService.is_valid_token(token, 86400*30)

        if not valid_token:
            return False

        return True
