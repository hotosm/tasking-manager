import geojson
from server import db
from sqlalchemy import desc
from server.models.dtos.user_dto import UserDTO, UserMappedProjectsDTO, MappedProject, UserFilterDTO, Pagination, \
    UserSearchQuery, UserSearchDTO, ProjectParticipantUser, ListedUser
from server.models.postgis.licenses import License, users_licenses_table
from server.models.postgis.project_info import ProjectInfo
from server.models.postgis.statuses import MappingLevel, ProjectStatus, UserRole
from server.models.postgis.utils import NotFound, timestamp


class User(db.Model):
    """ Describes the history associated with a task """
    __tablename__ = "users"

    id = db.Column(db.BigInteger, primary_key=True, index=True)
    validation_message = db.Column(db.Boolean, default=True, nullable=False)
    username = db.Column(db.String, unique=True)
    role = db.Column(db.Integer, default=0, nullable=False)
    mapping_level = db.Column(db.Integer, default=1, nullable=False)
    projects_mapped = db.Column(db.Integer, default=1, nullable=False)
    tasks_mapped = db.Column(db.Integer, default=0, nullable=False)
    tasks_validated = db.Column(db.Integer, default=0, nullable=False)
    tasks_invalidated = db.Column(db.Integer, default=0, nullable=False)
    projects_mapped = db.Column(db.ARRAY(db.Integer))
    email_address = db.Column(db.String)
    is_email_verified = db.Column(db.Boolean, default=False)
    is_expert = db.Column(db.Boolean, default=False)
    twitter_id = db.Column(db.String)
    facebook_id = db.Column(db.String)
    linkedin_id = db.Column(db.String)
    date_registered = db.Column(db.DateTime, default=timestamp)
    # Represents the date the user last had one of their tasks validated
    last_validation_date = db.Column(db.DateTime, default=timestamp)

    # Relationships
    accepted_licenses = db.relationship("License", secondary=users_licenses_table)

    def create(self):
        """ Creates and saves the current model to the DB """
        db.session.add(self)
        db.session.commit()

    def save(self):
        db.session.commit()

    def get_by_id(self, user_id: int):
        """ Return the user for the specified id, or None if not found """
        return User.query.get(user_id)

    def get_by_username(self, username: str):
        """ Return the user for the specified username, or None if not found """
        return User.query.filter_by(username=username).one_or_none()

    def update_username(self, username: str):
        """ Update the username """
        self.username = username
        db.session.commit()

    def update(self, user_dto: UserDTO):
        """ Update the user details """
        self.email_address = user_dto.email_address.lower() if user_dto.email_address else None
        self.twitter_id = user_dto.twitter_id.lower() if user_dto.twitter_id else None
        self.facebook_id = user_dto.facebook_id.lower() if user_dto.facebook_id else None
        self.linkedin_id = user_dto.linkedin_id.lower() if user_dto.linkedin_id else None
        self.validation_message = user_dto.validation_message
        db.session.commit()

    def set_email_verified_status(self, is_verified: bool):
        """ Updates email verfied flag on successfully verified emails"""
        self.is_email_verified = is_verified
        db.session.commit()

    def set_is_expert(self, is_expert: bool):
        """ Enables or disables expert mode on the user"""
        self.is_expert = is_expert
        db.session.commit()

    @staticmethod
    def get_all_users(query: UserSearchQuery) -> UserSearchDTO:
        """ Search and filter all users """

        # Base query that applies to all searches
        base = db.session.query(User.id, User.username, User.mapping_level, User.role)

        # Add filter to query as required
        if query.mapping_level:
            base = base.filter(User.mapping_level == MappingLevel[query.mapping_level.upper()].value)
        if query.username:
            base = base.filter(User.username.ilike(query.username.lower() + '%'))
        if query.role:
            base = base.filter(User.role == UserRole[query.role.upper()].value)

        results = base.order_by(User.username).paginate(query.page, 20, True)

        dto = UserSearchDTO()
        for result in results.items:
            listed_user = ListedUser()
            listed_user.id = result.id
            listed_user.mapping_level = MappingLevel(result.mapping_level).name
            listed_user.username = result.username
            listed_user.role = UserRole(result.role).name

            dto.users.append(listed_user)

        dto.pagination = Pagination(results)
        return dto

    @staticmethod
    def get_all_users_not_pagainated():
        """ Get all users in DB"""
        return db.session.query(User.id).all()


    @staticmethod
    def filter_users(user_filter: str, project_id: int, page: int) -> UserFilterDTO:
        """ Finds users that matches first characters, for auto-complete.

        Users who have participated (mapped or validated) in the project, if given, will be
        returned ahead of those who have not.
        """
        # Note that the projects_mapped column includes both mapped and validated projects.
        results = db.session.query(User.username, User.projects_mapped.any(project_id).label("participant")) \
            .filter(User.username.ilike(user_filter.lower() + '%')) \
            .order_by(desc("participant").nullslast(), User.username).paginate(page, 20, True)
        if results.total == 0:
            raise NotFound()

        dto = UserFilterDTO()
        for result in results.items:
            dto.usernames.append(result.username)
            if project_id is not None:
                participant = ProjectParticipantUser()
                participant.username = result.username
                participant.project_id = project_id
                participant.is_participant = bool(result.participant)
                dto.users.append(participant)

        dto.pagination = Pagination(results)
        return dto

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

        # This query looks scary, but we're really just creating an outer join between the query that gets the
        # counts of all mapped tasks and the query that gets counts of all validated tasks.  This is necessary to
        # handle cases where users have only validated tasks on a project, or only mapped on a project.
        sql = '''SELECT p.id,
                        p.status,
                        p.default_locale,
                        c.mapped,
                        c.validated,
                        st_asgeojson(p.centroid)
                   FROM projects p,
                        (SELECT coalesce(v.project_id, m.project_id) project_id,
                                coalesce(v.validated, 0) validated,
                                coalesce(m.mapped, 0) mapped
                          FROM (SELECT t.project_id,
                                       count (t.validated_by) validated
                                  FROM tasks t
                                 WHERE t.project_id IN (SELECT unnest(projects_mapped) FROM users WHERE id = {0})
                                   AND t.validated_by = {0}
                                 GROUP BY t.project_id, t.validated_by) v
                         FULL OUTER JOIN
                        (SELECT t.project_id,
                                count(t.mapped_by) mapped
                           FROM tasks t
                          WHERE t.project_id IN (SELECT unnest(projects_mapped) FROM users WHERE id = {0})
                            AND t.mapped_by = {0}
                          GROUP BY t.project_id, t.mapped_by) m
                         ON v.project_id = m.project_id) c
                   WHERE p.id = c.project_id ORDER BY p.id DESC'''.format(user_id)

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

    def accept_license_terms(self, license_id: int):
        """ Associate the user in scope with the supplied license """
        image_license = License.get_by_id(license_id)
        self.accepted_licenses.append(image_license)
        db.session.commit()

    def has_user_accepted_licence(self, license_id: int):
        """ Test to see if the user has accepted the terms of the specified license"""
        image_license = License.get_by_id(license_id)

        if image_license in self.accepted_licenses:
            return True

        return False

    def delete(self):
        """ Delete the user in scope from DB """
        db.session.delete(self)
        db.session.commit()

    def as_dto(self, logged_in_username: str) -> UserDTO:
        """ Create DTO object from user in scope """
        user_dto = UserDTO()
        user_dto.id = self.id
        user_dto.username = self.username
        user_dto.role = UserRole(self.role).name
        user_dto.mapping_level = MappingLevel(self.mapping_level).name
        user_dto.is_expert = self.is_expert or False
        user_dto.date_registered = str(self.date_registered)
        user_dto.projects_mapped = len(self.projects_mapped)
        user_dto.tasks_mapped = self.tasks_mapped
        user_dto.tasks_validated = self.tasks_validated
        user_dto.tasks_invalidated = self.tasks_invalidated
        user_dto.twitter_id = self.twitter_id
        user_dto.linkedin_id = self.linkedin_id
        user_dto.facebook_id = self.facebook_id
        user_dto.validation_message = self.validation_message

        if self.username == logged_in_username:
            # Only return email address when logged in user is looking at their own profile
            user_dto.email_address = self.email_address
            user_dto.is_email_verified = self.is_email_verified

        return user_dto
