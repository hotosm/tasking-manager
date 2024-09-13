import geojson
from backend import db
from sqlalchemy import desc, func
from geoalchemy2 import functions

from backend.exceptions import NotFound
from backend.models.dtos.user_dto import (
    UserDTO,
    UserMappedProjectsDTO,
    MappedProject,
    UserFilterDTO,
    Pagination,
    UserSearchQuery,
    UserSearchDTO,
    ProjectParticipantUser,
    ListedUser,
)
from backend.models.postgis.licenses import License, user_licenses_table
from backend.models.postgis.project_info import ProjectInfo
from backend.models.postgis.statuses import (
    MappingLevel,
    ProjectStatus,
    UserRole,
    UserGender,
)
from backend.models.postgis.utils import timestamp
from backend.models.postgis.interests import Interest, user_interests


class User(db.Model):
    """Describes the history associated with a task"""

    __tablename__ = "users"

    id = db.Column(db.BigInteger, primary_key=True, index=True)
    username = db.Column(db.String, unique=True)
    role = db.Column(db.Integer, default=0, nullable=False)
    mapping_level = db.Column(db.Integer, default=1, nullable=False)
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
    slack_id = db.Column(db.String)
    skype_id = db.Column(db.String)
    irc_id = db.Column(db.String)
    name = db.Column(db.String)
    city = db.Column(db.String)
    country = db.Column(db.String)
    picture_url = db.Column(db.String)
    gender = db.Column(db.Integer)
    self_description_gender = db.Column(db.String)
    default_editor = db.Column(db.String, default="ID", nullable=False)
    mentions_notifications = db.Column(db.Boolean, default=True, nullable=False)
    projects_comments_notifications = db.Column(
        db.Boolean, default=False, nullable=False
    )
    projects_notifications = db.Column(db.Boolean, default=True, nullable=False)
    tasks_notifications = db.Column(db.Boolean, default=True, nullable=False)
    tasks_comments_notifications = db.Column(db.Boolean, default=False, nullable=False)
    teams_announcement_notifications = db.Column(
        db.Boolean, default=True, nullable=False
    )
    date_registered = db.Column(db.DateTime, default=timestamp)
    # Represents the date the user last had one of their tasks validated
    last_validation_date = db.Column(db.DateTime, default=timestamp)

    # Relationships
    accepted_licenses = db.relationship(
        "License", secondary=user_licenses_table, overlaps="users"
    )
    interests = db.relationship(Interest, secondary=user_interests, backref="users")

    def create(self):
        """Creates and saves the current model to the DB"""
        db.session.add(self)
        db.session.commit()

    def save(self):
        db.session.commit()

    @staticmethod
    def get_by_id(user_id: int):
        """Return the user for the specified id, or None if not found"""
        return db.session.get(User, user_id)

    @staticmethod
    def get_by_username(username: str):
        """Return the user for the specified username, or None if not found"""
        return User.query.filter_by(username=username).one_or_none()

    def update_username(self, username: str):
        """Update the username"""
        self.username = username
        db.session.commit()

    def update_picture_url(self, picture_url: str):
        """Update the profile picture"""
        self.picture_url = picture_url
        db.session.commit()

    def update(self, user_dto: UserDTO):
        """Update the user details"""
        for attr, value in user_dto.items():
            if attr == "gender" and value is not None:
                value = UserGender[value].value

            try:
                is_field_nullable = self.__table__.columns[attr].nullable
                if is_field_nullable and value is not None:
                    setattr(self, attr, value)
                elif value is not None:
                    setattr(self, attr, value)
            except KeyError:
                continue

        if user_dto.gender != UserGender.SELF_DESCRIBE.name:
            self.self_description_gender = None
        db.session.commit()

    def set_email_verified_status(self, is_verified: bool):
        """Updates email verfied flag on successfully verified emails"""
        self.is_email_verified = is_verified
        db.session.commit()

    def set_is_expert(self, is_expert: bool):
        """Enables or disables expert mode on the user"""
        self.is_expert = is_expert
        db.session.commit()

    @staticmethod
    def get_all_users(query: UserSearchQuery) -> UserSearchDTO:
        """Search and filter all users"""

        # Base query that applies to all searches
        base = db.session.query(
            User.id, User.username, User.mapping_level, User.role, User.picture_url
        )

        # Add filter to query as required
        if query.mapping_level:
            mapping_levels = query.mapping_level.split(",")
            mapping_level_array = [
                MappingLevel[mapping_level].value for mapping_level in mapping_levels
            ]
            base = base.filter(User.mapping_level.in_(mapping_level_array))
        if query.username:
            base = base.filter(
                User.username.ilike(("%" + query.username + "%"))
            ).order_by(
                func.strpos(func.lower(User.username), func.lower(query.username))
            )

        if query.role:
            roles = query.role.split(",")
            role_array = [UserRole[role].value for role in roles]
            base = base.filter(User.role.in_(role_array))
        if query.pagination:
            results = base.order_by(User.username).paginate(
                page=query.page, per_page=query.per_page, error_out=True
            )
        else:
            per_page = base.count()
            results = base.order_by(User.username).paginate(per_page=per_page)
        dto = UserSearchDTO()
        for result in results.items:
            listed_user = ListedUser()
            listed_user.id = result.id
            listed_user.mapping_level = MappingLevel(result.mapping_level).name
            listed_user.username = result.username
            listed_user.picture_url = result.picture_url
            listed_user.role = UserRole(result.role).name

            dto.users.append(listed_user)
        if query.pagination:
            dto.pagination = Pagination(results)
        return dto

    @staticmethod
    def get_all_users_not_paginated():
        """Get all users in DB"""
        return db.session.query(User.id).all()

    @staticmethod
    def filter_users(user_filter: str, project_id: int, page: int) -> UserFilterDTO:
        """Finds users that matches first characters, for auto-complete.

        Users who have participated (mapped or validated) in the project, if given, will be
        returned ahead of those who have not.
        """
        # Note that the projects_mapped column includes both mapped and validated projects.
        query = (
            db.session.query(
                User.username, User.projects_mapped.any(project_id).label("participant")
            )
            .filter(User.username.ilike(user_filter.lower() + "%"))
            .order_by(desc("participant").nullslast(), User.username)
        )

        results = query.paginate(page=page, per_page=20, error_out=True)

        if results.total == 0:
            raise NotFound(sub_code="USER_NOT_FOUND", username=user_filter)

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
    def upsert_mapped_projects(user_id: int, project_id: int, local_session=None):
        """Adds projects to mapped_projects if it doesn't exist"""
        if local_session:
            query = local_session.query(User).filter_by(id=user_id)
        else:
            query = User.query.filter_by(id=user_id)
        result = query.filter(
            User.projects_mapped.op("@>")("{}".format("{" + str(project_id) + "}"))
        ).count()
        if result > 0:
            return  # User has previously mapped this project so return

        user = query.one_or_none()
        # Fix for new mappers.
        if user.projects_mapped is None:
            user.projects_mapped = []
        user.projects_mapped.append(project_id)
        if local_session:
            local_session.commit()
        else:
            db.session.commit()

    @staticmethod
    def get_mapped_projects(
        user_id: int, preferred_locale: str
    ) -> UserMappedProjectsDTO:
        """Get all projects a user has mapped on"""

        from backend.models.postgis.task import Task
        from backend.models.postgis.project import Project

        query = db.session.query(func.unnest(User.projects_mapped)).filter_by(
            id=user_id
        )
        query_validated = (
            db.session.query(
                Task.project_id.label("project_id"),
                func.count(Task.validated_by).label("validated"),
            )
            .filter(Task.project_id.in_(query))
            .filter_by(validated_by=user_id)
            .group_by(Task.project_id, Task.validated_by)
            .subquery()
        )

        query_mapped = (
            db.session.query(
                Task.project_id.label("project_id"),
                func.count(Task.mapped_by).label("mapped"),
            )
            .filter(Task.project_id.in_(query))
            .filter_by(mapped_by=user_id)
            .group_by(Task.project_id, Task.mapped_by)
            .subquery()
        )

        query_union = (
            db.session.query(
                func.coalesce(
                    query_validated.c.project_id, query_mapped.c.project_id
                ).label("project_id"),
                func.coalesce(query_validated.c.validated, 0).label("validated"),
                func.coalesce(query_mapped.c.mapped, 0).label("mapped"),
            )
            .join(
                query_mapped,
                query_validated.c.project_id == query_mapped.c.project_id,
                full=True,
            )
            .subquery()
        )

        results = (
            db.session.query(
                Project.id,
                Project.status,
                Project.default_locale,
                query_union.c.mapped,
                query_union.c.validated,
                functions.ST_AsGeoJSON(Project.centroid),
            )
            .filter(Project.id == query_union.c.project_id)
            .order_by(desc(Project.id))
            .all()
        )

        mapped_projects_dto = UserMappedProjectsDTO()
        for row in results:
            mapped_project = MappedProject()
            mapped_project.project_id = row[0]
            mapped_project.status = ProjectStatus(row[1]).name
            mapped_project.tasks_mapped = row[3]
            mapped_project.tasks_validated = row[4]
            mapped_project.centroid = geojson.loads(row[5])

            project_info = ProjectInfo.get_dto_for_locale(
                row[0], preferred_locale, row[2]
            )
            mapped_project.name = project_info.name

            mapped_projects_dto.mapped_projects.append(mapped_project)

        return mapped_projects_dto

    def set_user_role(self, role: UserRole):
        """Sets the supplied role on the user"""
        self.role = role.value
        db.session.commit()

    def set_mapping_level(self, level: MappingLevel):
        """Sets the supplied level on the user"""
        self.mapping_level = level.value
        db.session.commit()

    def accept_license_terms(self, license_id: int):
        """Associate the user in scope with the supplied license"""
        image_license = License.get_by_id(license_id)
        self.accepted_licenses.append(image_license)
        db.session.commit()

    def has_user_accepted_licence(self, license_id: int):
        """Test to see if the user has accepted the terms of the specified license"""
        image_license = License.get_by_id(license_id)

        if image_license in self.accepted_licenses:
            return True

        return False

    def delete(self):
        """Delete the user in scope from DB"""
        db.session.delete(self)
        db.session.commit()

    def as_dto(self, logged_in_username: str) -> UserDTO:
        """Create DTO object from user in scope"""
        user_dto = UserDTO()
        user_dto.id = self.id
        user_dto.username = self.username
        user_dto.role = UserRole(self.role).name
        user_dto.mapping_level = MappingLevel(self.mapping_level).name
        user_dto.projects_mapped = (
            len(self.projects_mapped) if self.projects_mapped else None
        )
        user_dto.is_expert = self.is_expert or False
        user_dto.date_registered = self.date_registered
        user_dto.twitter_id = self.twitter_id
        user_dto.linkedin_id = self.linkedin_id
        user_dto.facebook_id = self.facebook_id
        user_dto.skype_id = self.skype_id
        user_dto.slack_id = self.slack_id
        user_dto.irc_id = self.irc_id
        user_dto.city = self.city
        user_dto.country = self.country
        user_dto.name = self.name
        user_dto.picture_url = self.picture_url
        user_dto.default_editor = self.default_editor
        user_dto.mentions_notifications = self.mentions_notifications
        user_dto.projects_notifications = self.projects_notifications
        user_dto.projects_comments_notifications = self.projects_comments_notifications
        user_dto.tasks_notifications = self.tasks_notifications
        user_dto.tasks_comments_notifications = self.tasks_comments_notifications
        user_dto.teams_announcement_notifications = (
            self.teams_announcement_notifications
        )

        if self.username == logged_in_username:
            # Only return email address and gender information when logged in user is looking at their own profile
            user_dto.email_address = self.email_address
            user_dto.is_email_verified = self.is_email_verified
            gender = None
            if self.gender is not None:
                gender = UserGender(self.gender).name
                user_dto.gender = gender
                user_dto.self_description_gender = self.self_description_gender
        return user_dto

    def create_or_update_interests(self, interests_ids):
        self.interests = []
        objs = [Interest.get_by_id(i) for i in interests_ids]
        self.interests.extend(objs)
        db.session.commit()


class UserEmail(db.Model):
    __tablename__ = "users_with_email"

    id = db.Column(db.BigInteger, primary_key=True, index=True)
    email = db.Column(db.String, nullable=False, unique=True)

    def create(self):
        """Creates and saves the current model to the DB"""
        db.session.add(self)
        db.session.commit()

    def save(self):
        db.session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def get_by_email(email_address: str):
        """Return the user for the specified username, or None if not found"""
        return UserEmail.query.filter_by(email_address=email_address).one_or_none()
