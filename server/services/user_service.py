from server.models.postgis.user import User


class UserService:

    def get_user(self, username):
        user = User().get_by_username(username)

        if user is None:
            return None

        user