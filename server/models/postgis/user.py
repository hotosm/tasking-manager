from enum import Enum
from server import db


class UserRole(Enum):
    """ Describes the role a user can be assigned, app doesn't support multiple roles """
    MAPPER = 0
    ADMIN = 1
    PROJECT_MANAGER = 2
    VALIDATOR = 4


class MappingLevel(Enum):
    """ The mapping level the mapper has achieved """
    BEGINNER = 1
    INTERMEDIATE = 2
    ADVANCED = 3


class User(db.Model):
    """ Describes the history associated with a task """
    __tablename__ = "users"

    id = db.Column(db.BigInteger, primary_key=True, index=True)
    username = db.Column(db.String)
    role = db.Column(db.Integer, default=0)
    mapping_level = db.Column(db.Integer, default=1)

    @classmethod
    def create_from_osm_user_details(cls, user_id: int, username: str, changeset_count: int):
        """ Creates a new user in database from details supplied from OSM """
        user = cls()
        user.id = user_id,
        user.username = username
        user.role = UserRole.MAPPER.value

        # TODO set mapping level based on changeset count
        user.mapping_level = MappingLevel.BEGINNER.value
        db.session.add(user)
        db.session.commit()

    def get(self, user_id: int):
        """ Return the user for the specified id, or None if not found """
        return User.query.get(user_id)

    def delete(self):
        """ Delete the user in scope from DB """
        db.session.delete(self)
        db.session.commit()
