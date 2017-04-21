from enum import Enum
from sqlalchemy.dialects import postgresql
from server import db
from server.models.dtos.user_dto import UserDTO
from server.models.postgis.statuses import MappingLevel


class UserRole(Enum):
    """ Describes the role a user can be assigned, app doesn't support multiple roles """
    MAPPER = 0
    ADMIN = 1
    PROJECT_MANAGER = 2
    VALIDATOR = 4


class User(db.Model):
    """ Describes the history associated with a task """
    __tablename__ = "users"

    id = db.Column(db.BigInteger, primary_key=True, index=True)
    username = db.Column(db.String, unique=True)
    role = db.Column(db.Integer, default=0)
    mapping_level = db.Column(db.Integer, default=1)
    tasks_mapped = db.Column(db.Integer, default=0)
    tasks_validated = db.Column(db.Integer, default=0)
    tasks_invalidated = db.Column(db.Integer, default=0)
    projects_mapped = db.Column(db.ARRAY(db.Integer))

    def create(self):
        """ Creates and saves the current model to the DB """
        db.session.add(self)
        db.session.commit()

    def get_by_id(self, user_id: int):
        """ Return the user for the specified id, or None if not found """
        return User.query.get(user_id)

    def get_by_username(self, username: str):
        """ Return the user for the specified username, or None if not found """
        return User.query.filter_by(username=username).one_or_none()

    @staticmethod
    def upsert_mapped_projects(user_id: int, project_id: int):
        """ Adds projects to mapped_projects if it doesn't exist """
        sql = "select * from users where id = {0} and projects_mapped @> '{{{1}}}'".format(user_id, project_id)
        result = db.engine.execute(sql)

        if result.rowcount > 0:
            return  # User has previously mapped this project so return

        sql = '''update users
                    set projects_mapped = array_append(projects_mapped, {0})
                  where id = {1}'''.format(project_id, user_id)

        db.engine.execute(sql)

    def delete(self):
        """ Delete the user in scope from DB """
        db.session.delete(self)
        db.session.commit()

    def as_dto(self):
        """ Create DTO object from user in scope """
        user_dto = UserDTO()
        user_dto.username = self.username
        user_dto.role = UserRole(self.role).name
        user_dto.mapping_level = MappingLevel(self.mapping_level).name
        user_dto.tasks_mapped = self.tasks_mapped
        user_dto.tasks_validated = self.tasks_validated

        return user_dto
