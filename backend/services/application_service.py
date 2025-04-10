from databases import Database

from backend.exceptions import NotFound
from backend.models.postgis.application import Application
from backend.services.users.authentication_service import AuthenticationService


class ApplicationService:
    @staticmethod
    async def create_token(user_id: int, db: Database) -> Application:
        application = await Application().create(user_id, db)

        return application.as_dto()

    @staticmethod
    async def get_token(token: str, db: Database):
        application = await Application.get_token(token, db)

        if application is None:
            raise NotFound(sub_code="APPLICATION_NOT_FOUND")

        return application

    @staticmethod
    async def get_all_tokens_for_logged_in_user(user_id: int, db: Database):
        tokens = await Application.get_all_for_user(user_id, db)

        return tokens

    @staticmethod
    async def check_token(token: str, db: Database):
        valid_token = await ApplicationService.get_token(token, db)
        if not valid_token:
            return False

        valid_token, user_id = AuthenticationService.is_valid_token(token, 86400 * 30)

        if not valid_token:
            return False

        return True
