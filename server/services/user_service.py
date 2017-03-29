from typing import Optional
from server.models.postgis.user import User
from server.models.dtos.user_dto import UserDTO


class UserService:

    def get_user(self, username: str) -> Optional[UserDTO]:
        """Gets user DTO for supplied username """
        user = User().get_by_username(username)

        if user is None:
            return None

        return user.as_dto()
