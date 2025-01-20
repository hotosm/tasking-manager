import geojson
from sqlalchemy import Column, Integer, BigInteger, String, DateTime, Boolean, ARRAY
from sqlalchemy.orm import relationship

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
from backend.db import Base, get_session

session = get_session()
from databases import Database


class User(Base):
    """Describes the history associated with a task"""

    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True)
    username = Column(String, unique=True)
    role = Column(Integer, default=0, nullable=False)
    mapping_level = Column(Integer, default=1, nullable=False)
    tasks_mapped = Column(Integer, default=0, nullable=False)
    tasks_validated = Column(Integer, default=0, nullable=False)
    tasks_invalidated = Column(Integer, default=0, nullable=False)
    projects_mapped = Column(ARRAY(Integer))
    email_address = Column(String)
    is_email_verified = Column(Boolean, default=False)
    is_expert = Column(Boolean, default=False)
    twitter_id = Column(String)
    facebook_id = Column(String)
    linkedin_id = Column(String)
    slack_id = Column(String)
    skype_id = Column(String)
    irc_id = Column(String)
    name = Column(String)
    city = Column(String)
    country = Column(String)
    picture_url = Column(String)
    gender = Column(Integer)
    self_description_gender = Column(String)
    default_editor = Column(String, default="ID", nullable=False)
    mentions_notifications = Column(Boolean, default=True, nullable=False)
    projects_comments_notifications = Column(Boolean, default=False, nullable=False)
    projects_notifications = Column(Boolean, default=True, nullable=False)
    tasks_notifications = Column(Boolean, default=True, nullable=False)
    tasks_comments_notifications = Column(Boolean, default=False, nullable=False)
    teams_announcement_notifications = Column(Boolean, default=True, nullable=False)
    date_registered = Column(DateTime, default=timestamp)
    # Represents the date the user last had one of their tasks validated
    last_validation_date = Column(DateTime, default=timestamp)

    # Relationships
    accepted_licenses = relationship(
        "License", secondary=user_licenses_table, overlaps="users"
    )
    interests = relationship(Interest, secondary=user_interests, backref="users")

    def create(self):
        """Creates and saves the current model to the DB"""
        session.add(self)
        session.commit()

    def save(self):
        session.commit()

    # @staticmethod
    # async def get_by_id(user_id: int, session):
    #     """Return the user for the specified id, or None if not found"""
    #     result = await session.execute(sa.select(User).filter_by(id=user_id))
    #     return result.scalars().first()

    @staticmethod
    async def get_by_id(user_id: int, db: Database):
        """
        Return the user for the specified id, or None if not found.
        :param user_id: ID of the user to retrieve
        :param db: Database connection
        :return: User object or None
        """
        query = "SELECT * FROM users WHERE id = :user_id"
        result = await db.fetch_one(query, values={"user_id": user_id})
        if result is None:
            return None
        return User(**result)

    @staticmethod
    async def get_by_username(username: str, db: Database):
        """Return the user for the specified username, or None if not found"""
        query = """
        SELECT * FROM users
        WHERE username = :username
        """
        # Execute the query and fetch the result
        result = await db.fetch_one(query, values={"username": username})
        return result if result else None

    def update_username(self, username: str):
        """Update the username"""
        self.username = username
        session.commit()

    def update_picture_url(self, picture_url: str):
        """Update the profile picture"""
        self.picture_url = picture_url
        session.commit()

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
        session.commit()

    async def set_email_verified_status(self, is_verified: bool, db: Database):
        """Updates email verfied flag on successfully verified emails"""
        self.is_email_verified = is_verified
        query = "UPDATE users SET is_email_verified = :is_email_verified WHERE id = :user_id"
        await db.execute(
            query, values={"is_email_verified": is_verified, "user_id": self.id}
        )

    def set_is_expert(self, is_expert: bool):
        """Enables or disables expert mode on the user"""
        self.is_expert = is_expert
        session.commit()

    @staticmethod
    async def get_all_users(query: UserSearchQuery, db) -> UserSearchDTO:
        """Search and filter all users"""

        base_query = """
            SELECT id, username, mapping_level, role, picture_url FROM users
        """
        filters = []
        params = {}

        if query.mapping_level:
            mapping_levels = query.mapping_level.split(",")
            mapping_level_array = [
                MappingLevel[mapping_level].value for mapping_level in mapping_levels
            ]
            filters.append("mapping_level = ANY(:mapping_levels)")
            params["mapping_levels"] = tuple(mapping_level_array)

        if query.username:
            filters.append("username ILIKE :username")
            params["username"] = f"%{query.username}%"

        if query.role:
            roles = query.role.split(",")
            role_array = [UserRole[role].value for role in roles]
            filters.append("role = ANY(:roles)")
            params["roles"] = tuple(role_array)

        if filters:
            base_query += " WHERE " + " AND ".join(filters)

        base_query += " ORDER BY username"
        if query.pagination:
            base_query += " LIMIT :limit OFFSET :offset"
            base_params = params.copy()
            base_params["limit"] = query.per_page
            base_params["offset"] = (query.page - 1) * query.per_page

        results = await db.fetch_all(base_query, base_params)

        dto = UserSearchDTO()
        for result in results:
            listed_user = ListedUser()
            listed_user.id = result["id"]
            listed_user.mapping_level = MappingLevel(result["mapping_level"]).name
            listed_user.username = result["username"]
            listed_user.picture_url = result["picture_url"]
            listed_user.role = UserRole(result["role"]).name

            dto.users.append(listed_user)

        if query.pagination:
            count_query = "SELECT COUNT(*) FROM users"
            count_query += " WHERE " + " AND ".join(filters) if filters else ""
            total_count = await db.fetch_val(count_query, params)
            dto.pagination = Pagination.from_total_count(
                query.page, query.per_page, total_count
            )

        return dto

    @staticmethod
    def get_all_users_not_paginated():
        """Get all users in DB"""
        return session.query(User.id).all()

    @staticmethod
    async def filter_users(
        username: str, project_id: int, page: int, db: Database
    ) -> UserFilterDTO:
        """Finds users that match the first characters, for auto-complete.

        Users who have participated (mapped or validated) in the project, if given, will be
        returned ahead of those who have not.
        """
        query = """
            SELECT u.username, :project_id = ANY(u.projects_mapped) AS participant
            FROM users u
            WHERE u.username ILIKE :username || '%'
            ORDER BY participant DESC NULLS LAST, u.username
            LIMIT 20 OFFSET :offset
        """

        offset = (page - 1) * 20
        values = {
            "username": username.lower(),
            "project_id": project_id,
            "offset": offset,
        }

        results = await db.fetch_all(query, values=values)

        if not results:
            raise NotFound(sub_code="USER_NOT_FOUND", username=username)

        dto = UserFilterDTO()
        for result in results:
            dto.usernames.append(result["username"])
            if project_id is not None:
                participant = ProjectParticipantUser(
                    username=result["username"],
                    project_id=project_id,
                    is_participant=bool(result["participant"]),
                )
                dto.users.append(participant)

        total_query = """
            SELECT COUNT(*) FROM users u WHERE u.username ILIKE :username || '%'
        """
        total = await db.fetch_val(total_query, values={"username": username.lower()})
        dto.pagination = Pagination.from_total_count(
            page=page, per_page=20, total=total
        )

        return dto

    @staticmethod
    def upsert_mapped_projects(user_id: int, project_id: int):
        """Adds projects to mapped_projects if it doesn't exist"""
        query = session.query(User).filter_by(id=user_id)
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
        session.commit()

    # TODO Optimization: Get only project name instead of all the locale attributes.
    @staticmethod
    async def get_mapped_projects(
        user_id: int, preferred_locale: str, db: Database
    ) -> UserMappedProjectsDTO:
        """Get all projects a user has mapped on"""

        # Subquery for validated tasks
        query_validated = """
            SELECT project_id, COUNT(validated_by) AS validated
            FROM tasks
            WHERE project_id IN (
                SELECT unnest(projects_mapped) FROM users WHERE id = :user_id
            ) AND validated_by = :user_id
            GROUP BY project_id, validated_by
        """

        # Subquery for mapped tasks
        query_mapped = """
            SELECT project_id, COUNT(mapped_by) AS mapped
            FROM tasks
            WHERE project_id IN (
                SELECT unnest(projects_mapped) FROM users WHERE id = :user_id
            ) AND mapped_by = :user_id
            GROUP BY project_id, mapped_by
        """

        # Union of validated and mapped tasks
        query_union = f"""
            SELECT COALESCE(v.project_id, m.project_id) AS project_id,
                COALESCE(v.validated, 0) AS validated,
                COALESCE(m.mapped, 0) AS mapped
            FROM ({query_validated}) v
            FULL OUTER JOIN ({query_mapped}) m
            ON v.project_id = m.project_id
        """

        # Main query to get project details
        query_projects = f"""
            SELECT p.id, p.status, p.default_locale, u.mapped, u.validated, ST_AsGeoJSON(p.centroid) AS centroid
            FROM projects p
            JOIN ({query_union}) u ON p.id = u.project_id
            ORDER BY p.id DESC
        """

        results = await db.fetch_all(query_projects, {"user_id": user_id})

        mapped_projects_dto = UserMappedProjectsDTO()
        for row in results:
            mapped_project = MappedProject()
            mapped_project.project_id = row["id"]
            mapped_project.status = ProjectStatus(row["status"]).name
            mapped_project.tasks_mapped = row["mapped"]
            mapped_project.tasks_validated = row["validated"]
            mapped_project.centroid = geojson.loads(row["centroid"])
            project_info = await ProjectInfo.get_dto_for_locale(
                db, row["id"], preferred_locale, row["default_locale"]
            )
            mapped_project.name = project_info.name
            mapped_projects_dto.mapped_projects.append(mapped_project)
        return mapped_projects_dto

    def set_user_role(self, role: UserRole):
        """Sets the supplied role on the user"""
        self.role = role.value
        session.commit()

    def set_mapping_level(self, level: MappingLevel):
        """Sets the supplied level on the user"""
        self.mapping_level = level.value
        session.commit()

    async def accept_license_terms(self, user_id, license_id: int, db: Database):
        """Associate the user in scope with the supplied license"""
        _ = await License.get_by_id(license_id, db)

        query_check = """
            SELECT 1 FROM user_licenses WHERE "user" = :user_id AND "license" = :license_id
        """
        record = await db.fetch_one(
            query_check, values={"user_id": user_id, "license_id": license_id}
        )

        if not record:
            query = """
                INSERT INTO user_licenses ("user", "license")
                VALUES (:user_id, :license_id)
            """
            await db.execute(
                query, values={"user_id": user_id, "license_id": license_id}
            )

    def has_user_accepted_licence(self, license_id: int):
        """Test to see if the user has accepted the terms of the specified license"""
        image_license = License.get_by_id(license_id)

        if image_license in self.accepted_licenses:
            return True

        return False

    def delete(self):
        """Delete the user in scope from DB"""
        session.delete(self)
        session.commit()

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
        # user_dto.date_registered = self.date_registered
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
        session.commit()


class UserEmail(Base):
    __tablename__ = "users_with_email"

    id = Column(BigInteger, primary_key=True, index=True)
    email = Column(String, nullable=False, unique=True)

    def create(self):
        """Creates and saves the current model to the DB"""
        session.add(self)
        session.commit()

    def save(self):
        session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()

    @staticmethod
    def get_by_email(email_address: str):
        """Return the user for the specified username, or None if not found"""
        return UserEmail.query.filter_by(email_address=email_address).one_or_none()
