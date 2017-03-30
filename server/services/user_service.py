from typing import Optional
from server.models.postgis.user import User
from server.models.dtos.user_dto import UserDTO


class UserService:

    @staticmethod
    def get_user_by_username(username: str) -> Optional[UserDTO]:
        """Gets user DTO for supplied username """
        user = User().get_by_username(username)

        if user is None:
            return None

        return user.as_dto()

    @staticmethod
    def is_user_a_project_manager(user_id: int) -> bool:
        """ Is the user a project manager """
        user = User().get_by_id(user_id)

        if user is None:
            return False

        return user.is_project_manager()

