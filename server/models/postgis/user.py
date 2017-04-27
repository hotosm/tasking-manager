import geojson
from enum import Enum
from server import db
from server.models.dtos.user_dto import UserDTO, UserMappedProjectsDTO, MappedProject
from server.models.postgis.licenses import License, users_licenses_table
from server.models.postgis.project_info import ProjectInfo
from server.models.postgis.statuses import MappingLevel, ProjectStatus
from server.models.postgis.utils import NotFound


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
    role = db.Column(db.Integer, default=0, nullable=False)
    mapping_level = db.Column(db.Integer, default=1, nullable=False)
    tasks_mapped = db.Column(db.Integer, default=0, nullable=False)
    tasks_validated = db.Column(db.Integer, default=0, nullable=False)
    tasks_invalidated = db.Column(db.Integer, default=0, nullable=False)
    projects_mapped = db.Column(db.ARRAY(db.Integer))

    accepted_licenses = db.relationship("License", secondary=users_licenses_table)

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

    @staticmethod
    def get_mapped_projects(user_id: int, preferred_locale: str) -> UserMappedProjectsDTO:
        """ Get all projects a user has mapped on """
        sql = '''select p.id, p.status, p.default_locale, count(t.mapped_by), count(t.validated_by), st_asgeojson(a.centroid),
                        st_asgeojson(a.geometry)
                   from projects p,
                        tasks t,
                        areas_of_interest a
                  where p.id in (select unnest(projects_mapped) from users where id = {0})
                    and p.id = t.project_id
                    and p.id = a.id
                    and (t.mapped_by = {0} or t.mapped_by is null)
                    and (t.validated_by = {0} or t.validated_by is null)
               GROUP BY p.id, p.status, a.centroid, a.geometry'''.format(user_id)

        results = db.engine.execute(sql)

        if results.rowcount == 0:
            raise NotFound()

        mapped_projects_dto = UserMappedProjectsDTO()
        for row in results:
            mapped_project = MappedProject()
            mapped_project.project_id = row[0]
            mapped_project.status = ProjectStatus(row[1]).name
            mapped_project.tasks_mapped = row[3]
            mapped_project.tasks_validated = row[4]
            mapped_project.centroid = geojson.loads(row[5])
            mapped_project.aoi = geojson.loads(row[6])

            project_info = ProjectInfo.get_dto_for_locale(row[0], preferred_locale, row[2])
            mapped_project.name = project_info.name

            mapped_projects_dto.mapped_projects.append(mapped_project)

        return mapped_projects_dto

    def set_user_role(self, role: UserRole):
        """ Sets the supplied role on the user """
        self.role = role.value
        db.session.commit()

    def set_mapping_level(self, level: MappingLevel):
        """ Sets the supplied level on the user """
        self.mapping_level = level.value
        db.session.commit()

    def has_user_accepted_licence(self, license_id):
        """ Test to see if the user has accepted the terms of the specified license"""
        image_license = License.get_by_id(license_id)

        if image_license in self.accepted_licenses:
            return True

        return False

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
