from databases import Database
from sqlalchemy import (
    Column,
    Integer,
    BigInteger,
    Boolean,
    ForeignKey,
    String,
    insert,
    delete,
)
from sqlalchemy.orm import relationship, backref
from backend.exceptions import NotFound
from backend.models.dtos.team_dto import (
    TeamDTO,
    NewTeamDTO,
    TeamMembersDTO,
    TeamProjectDTO,
)
from backend.models.dtos.organisation_dto import OrganisationTeamsDTO
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.statuses import (
    TeamJoinMethod,
    TeamVisibility,
    TeamMemberFunctions,
    TeamRoles,
)
from backend.models.postgis.user import User
from backend.db import Base, get_session

session = get_session()


class TeamMembers(Base):
    __tablename__ = "team_members"
    team_id = Column(Integer, ForeignKey("teams.id", name="fk_teams"), primary_key=True)
    user_id = Column(
        BigInteger, ForeignKey("users.id", name="fk_users"), primary_key=True
    )
    function = Column(Integer, nullable=False)  # either 'editor' or 'manager'
    active = Column(Boolean, default=False)
    join_request_notifications = Column(
        Boolean, nullable=False, default=False
    )  # Managers can turn notifications on/off for team join requests
    member = relationship(
        User, backref=backref("teams", cascade="all, delete-orphan", lazy="joined")
    )
    team = relationship(
        "Team", backref=backref("members", cascade="all, delete-orphan", lazy="joined")
    )

    async def create(self, db: Database):
        """Creates and saves the current model to the DB"""
        team_member = await db.execute(
            insert(TeamMembers.__table__).values(
                team_id=self.team_id,
                user_id=self.user_id,
                function=self.function,
                active=self.active,
                join_request_notifications=self.join_request_notifications,
            )
        )
        return team_member

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()

    async def update(self, db: Database):
        """Updates the current model in the DB"""
        await db.execute(
            TeamMembers.__table__.update()
            .where(TeamMembers.team_id == self.team_id)
            .where(TeamMembers.user_id == self.user_id)
            .values(
                function=self.function,
                active=self.active,
                join_request_notifications=self.join_request_notifications,
            )
        )

    @staticmethod
    async def get(team_id: int, user_id: int, db: Database):
        """
        Returns a team member by team_id and user_id
        :param team_id: ID of the team
        :param user_id: ID of the user
        :param db: async database connection
        :return: Team member if found, otherwise None
        """
        query = """
            SELECT * FROM team_members
            WHERE team_id = :team_id AND user_id = :user_id
        """
        member = await db.fetch_one(
            query, values={"team_id": team_id, "user_id": user_id}
        )

        return member  # Returns the team member if found, otherwise None


class Team(Base):
    """Describes a team"""

    __tablename__ = "teams"

    # Columns
    id = Column(Integer, primary_key=True)
    organisation_id = Column(
        Integer,
        ForeignKey("organisations.id", name="fk_organisations"),
        nullable=False,
    )
    name = Column(String(512), nullable=False)
    logo = Column(String)  # URL of a logo
    description = Column(String)
    join_method = Column(Integer, default=TeamJoinMethod.ANY.value, nullable=False)
    visibility = Column(Integer, default=TeamVisibility.PUBLIC.value, nullable=False)

    # organisation = relationship(Organisation, backref="teams", lazy="joined")
    organisation = relationship(Organisation, backref="teams")

    async def create(self, db: Database):
        """Creates and saves the current model to the DB"""
        team = await db.execute(
            insert(Team.__table__).values(
                organisation_id=self.organisation_id,
                name=self.name,
                logo=self.logo,
                description=self.description,
                join_method=self.join_method,
                visibility=self.visibility,
            )
        )
        return team if team else None

    @classmethod
    async def create_from_dto(cls, new_team_dto: NewTeamDTO, db: Database):
        """Creates a new team from a dto"""
        new_team = cls()

        new_team.name = new_team_dto.name
        new_team.description = new_team_dto.description
        new_team.join_method = TeamJoinMethod[new_team_dto.join_method].value
        new_team.visibility = TeamVisibility[new_team_dto.visibility].value

        org = await Organisation.get(new_team_dto.organisation_id, db)
        new_team.organisation_id = org

        # Create team member with creator as a manager
        new_member = TeamMembers()
        new_member.team = new_team
        new_member.user_id = new_team_dto.creator
        new_member.function = TeamMemberFunctions.MANAGER.value
        new_member.active = True

        new_team.members.append(new_member)

        team = await Team.create(new_team, db)
        return team

    async def update(self, team_dto: TeamDTO, db: Database):
        """Updates Team from DTO"""
        if team_dto.organisation:
            self.organisation = Organisation.get_organisation_by_name(
                team_dto.organisation, db
            )

        # Build the update query for the team attributes
        update_fields = {}
        for attr, value in team_dto.dict().items():
            if attr == "visibility" and value is not None:
                value = TeamVisibility[team_dto.visibility].value
            if attr == "join_method" and value is not None:
                value = TeamJoinMethod[team_dto.join_method].value

            if attr in ("members", "organisation"):
                continue

            if attr in Team.__table__.columns:
                update_fields[attr] = value

        # Update the team in the database
        if update_fields:
            update_query = (
                "UPDATE teams SET "
                + ", ".join([f"{k} = :{k}" for k in update_fields.keys()])
                + " WHERE id = :id"
            )
            await db.execute(update_query, {**update_fields, "id": self.id})

        # Update team members if they have changed
        if (
            team_dto.members != await Team._get_team_members(self, db)
            and team_dto.members
        ):
            # Get existing members from the team
            existing_members = await db.fetch_all(
                "SELECT user_id FROM team_members WHERE team_id = :team_id",
                {"team_id": self.id},
            )

            # Remove members who are not in the new member list
            new_member_usernames = [member["username"] for member in team_dto.members]
            for member in existing_members:
                username = await db.fetch_val(
                    "SELECT username FROM users WHERE id = :id",
                    {"id": member["user_id"]},
                )
                if username not in new_member_usernames:
                    await db.execute(
                        "DELETE FROM team_members WHERE team_id = :team_id AND user_id = :user_id",
                        {"team_id": self.id, "user_id": member["user_id"]},
                    )

            # Add or update members from the new member list
            for member in team_dto.members:
                user = await db.fetch_one(
                    "SELECT id FROM users WHERE username = :username",
                    {"username": member["username"]},
                )
                if not user:
                    raise NotFound(
                        sub_code="USER_NOT_FOUND", username=member["username"]
                    )

                # Check if the user is already a member of the team
                team_member = await db.fetch_one(
                    "SELECT * FROM team_members WHERE team_id = :team_id AND user_id = :user_id",
                    {"team_id": self.id, "user_id": user["id"]},
                )

                if team_member:
                    # Update member's join_request_notifications
                    await db.execute(
                        "UPDATE team_members SET join_request_notifications = :join_request_notifications WHERE team_id = :team_id AND user_id = :user_id",
                        {
                            "join_request_notifications": member[
                                "join_request_notifications"
                            ],
                            "team_id": self.id,
                            "user_id": user["id"],
                        },
                    )
                else:
                    # Add a new member to the team
                    await db.execute(
                        "INSERT INTO team_members (team_id, user_id, function, join_request_notifications) VALUES (:team_id, :user_id, :function, :join_request_notifications)",
                        {
                            "team_id": self.id,
                            "user_id": user["id"],
                            "function": TeamMemberFunctions[member["function"]].value,
                            "join_request_notifications": member[
                                "join_request_notifications"
                            ],
                        },
                    )

    async def delete(self, db: Database):
        """Deletes the current model from the DB"""
        await db.execute(delete(Team.__table__).where(Team.id == self.id))

    def can_be_deleted(self) -> bool:
        """A Team can be deleted if it doesn't have any projects"""
        return len(self.projects) == 0

    async def get(team_id: int, db: Database):
        """
        Gets specified team by id
        :param team_id: team ID in scope
        :return: Team if found otherwise None
        """
        return db.fetch_one(Team.__table__, Team.id == team_id)

    async def get_team_by_name(team_name: str, db: Database):
        """
        Gets specified team by name
        :param team_name: team name in scope
        :param db: async database connection
        :return: Team if found, otherwise None
        """
        query = """
            SELECT * FROM teams
            WHERE name = :team_name
        """
        team = await db.fetch_one(query, values={"team_name": team_name})

        return team  # Returns the team if found, otherwise None

    async def as_dto(self, db: Database):
        """Returns a dto for the team"""
        team_dto = TeamDTO()
        team_dto.team_id = self.id
        team_dto.description = self.description
        team_dto.join_method = TeamJoinMethod(self.join_method).name
        team_dto.members = self._get_team_members(db)
        team_dto.name = self.name
        team_dto.organisation = self.organisation.name
        team_dto.organisation_id = self.organisation.id
        team_dto.logo = self.organisation.logo
        team_dto.visibility = TeamVisibility(self.visibility).name
        return team_dto

    async def as_dto_inside_org(self, db: Database):
        """Returns a dto for the team"""
        team_dto = OrganisationTeamsDTO()

        team_dto.team_id = self.id
        team_dto.name = self.name
        team_dto.description = self.description
        team_dto.join_method = TeamJoinMethod(self.join_method).name
        team_dto.members = self._get_team_members(db)
        team_dto.visibility = TeamVisibility(self.visibility).name

        return team_dto

    async def as_dto_team_member(user_id: int, db: Database) -> TeamMembersDTO:
        """Returns a DTO for the team member"""
        user_query = """
            SELECT username, picture_url FROM users WHERE id = :user_id
        """
        user = await db.fetch_one(query=user_query, values={"user_id": user_id})

        if not user:
            raise NotFound(sub_code="USER_NOT_FOUND", user_id=user_id)

        member_query = """
            SELECT function, active, join_request_notifications
            FROM team_members WHERE user_id = :user_id
        """
        member = await db.fetch_one(query=member_query, values={"user_id": user_id})

        if not member:
            raise NotFound(sub_code="MEMBER_NOT_FOUND", user_id=user_id)

        return TeamMembersDTO(
            username=user["username"],
            function=TeamMemberFunctions(member["function"]).name,
            picture_url=user["picture_url"],
            active=member["active"],
            join_request_notifications=member["join_request_notifications"],
        )

    def as_dto_team_project(project) -> TeamProjectDTO:
        """Returns a dto for the team project"""

        return TeamProjectDTO(
            project_name=project.name,
            project_id=project.project_id,
            role=TeamRoles(project.role).name,
        )

    async def _get_team_members(self, db: Database):
        """Helper to get JSON serialized members using raw SQL queries"""

        # SQL query to fetch all members of the team, including their username, picture_url, function, and active status
        query = """
            SELECT u.username, u.picture_url, tm.function, tm.active
            FROM team_members tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.team_id = :team_id
        """

        # Execute the query and fetch all team members
        rows = await db.fetch_all(query, {"team_id": self.id})

        # Convert the fetched rows into a list of dictionaries (JSON serialized format)
        members = [
            {
                "username": row["username"],
                "pictureUrl": row["picture_url"],
                "function": TeamMemberFunctions(row["function"]).name,
                "active": row["active"],
            }
            for row in rows
        ]

        return members

    async def get_all_members(db: Database, team_id: int, count: int = None):
        """
        Returns all users in the team regardless of their role (manager or member).
        --------------------------------
        :param db: Database session
        :param team_id: ID of the team
        :param count: Number of members to return
        :return: List of team members with specified attributes
        """

        query = f"""
            SELECT u.username,
                CASE
                    WHEN tm.function = {TeamMemberFunctions.MANAGER.value} THEN '{TeamMemberFunctions.MANAGER.name}'
                    WHEN tm.function = {TeamMemberFunctions.MEMBER.value} THEN '{TeamMemberFunctions.MEMBER.name}'
                    ELSE 'UNKNOWN'
                END as function,
                tm.active,
                tm.join_request_notifications,
                u.picture_url
            FROM team_members tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.team_id = :team_id AND tm.active = true
        """

        values = {
            "team_id": team_id,
        }

        if count:
            query += " LIMIT :count"
            values["count"] = count

        results = await db.fetch_all(query=query, values=values)
        return [TeamMembersDTO(**result) for result in results]

    async def get_team_managers(db: Database, team_id: int, count: int = None):
        """
        Returns users with manager role in the team.
        --------------------------------
        :param db: Database session
        :param team_id: ID of the team
        :param count: Number of managers to return
        :return: List of team managers with specified attributes
        """
        query = f"""
            SELECT u.username,
                CASE
                    WHEN tm.function = {TeamMemberFunctions.MANAGER.value} THEN '{TeamMemberFunctions.MANAGER.name}'
                    WHEN tm.function = {TeamMemberFunctions.MEMBER.value} THEN '{TeamMemberFunctions.MEMBER.name}'
                    ELSE 'UNKNOWN'
                END as function,
                tm.active,
                tm.join_request_notifications,
                u.picture_url
            FROM team_members tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.team_id = :team_id AND tm.function = :function_value AND tm.active = true
        """

        values = {
            "team_id": team_id,
            "function_value": TeamMemberFunctions.MANAGER.value,
        }

        if count:
            query += " LIMIT :count"
            values["count"] = count

        results = await db.fetch_all(query=query, values=values)
        return [TeamMembersDTO(**result) for result in results]

    async def get_team_members(db: Database, team_id: int, count: int = None):
        """
        Returns users with member role in the team.
        --------------------------------
        :param db: Database session
        :param team_id: ID of the team
        :param count: Number of members to return
        :return: List of team members with specified attributes
        """

        query = f"""
            SELECT u.username,
                CASE
                    WHEN tm.function = {TeamMemberFunctions.MANAGER.value} THEN '{TeamMemberFunctions.MANAGER.name}'
                    WHEN tm.function = {TeamMemberFunctions.MEMBER.value} THEN '{TeamMemberFunctions.MEMBER.name}'
                    ELSE 'UNKNOWN'
                END as function,
                tm.active,
                tm.join_request_notifications,
                u.picture_url
            FROM team_members tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.team_id = :team_id AND tm.function = :function_value AND tm.active = true
        """

        values = {
            "team_id": team_id,
            "function_value": TeamMemberFunctions.MEMBER.value,
        }

        if count:
            query += " LIMIT :count"
            values["count"] = count

        results = await db.fetch_all(query=query, values=values)
        return [TeamMembersDTO(**result) for result in results]

    async def get_members_count_by_role(
        db: Database, team_id: int, role: TeamMemberFunctions
    ):
        """
        Returns the number of members with the specified role in the team.
        --------------------------------
        :param db: Database session
        :param team_id: ID of the team
        :param role: Role to count
        :return: Number of members with the specified role in the team
        """
        query = """
            SELECT COUNT(*)
            FROM team_members
            WHERE team_id = :team_id AND function = :function AND active = true
        """

        values = {"team_id": team_id, "function": role.value}

        return await db.fetch_val(query=query, values=values)
