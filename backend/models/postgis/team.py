from databases import Database
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy import Column, Integer, BigInteger, Boolean, ForeignKey, String, DateTime
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
from backend.models.postgis.utils import timestamp
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
    joined_date = Column(DateTime, default=timestamp)

    def create(self):
        """Creates and saves the current model to the DB"""
        session.add(self)
        session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()

    def update(self):
        """Updates the current model in the DB"""
        session.commit()

    @staticmethod
    def get(team_id: int, user_id: int):
        """Returns a team member by team_id and user_id"""
        return TeamMembers.query.filter_by(team_id=team_id, user_id=user_id).first()


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

    def create(self):
        """Creates and saves the current model to the DB"""
        session.add(self)
        session.commit()

    @classmethod
    def create_from_dto(cls, new_team_dto: NewTeamDTO):
        """Creates a new team from a dto"""
        new_team = cls()

        new_team.name = new_team_dto.name
        new_team.description = new_team_dto.description
        new_team.join_method = TeamJoinMethod[new_team_dto.join_method].value
        new_team.visibility = TeamVisibility[new_team_dto.visibility].value

        org = Organisation.get(new_team_dto.organisation_id)
        new_team.organisation = org

        # Create team member with creator as a manager
        new_member = TeamMembers()
        new_member.team = new_team
        new_member.user_id = new_team_dto.creator
        new_member.function = TeamMemberFunctions.MANAGER.value
        new_member.active = True
        new_member.joined_date = timestamp()

        new_team.members.append(new_member)

        new_team.create()
        return new_team

    def update(self, team_dto: TeamDTO):
        """Updates Team from DTO"""
        if team_dto.organisation:
            self.organisation = Organisation().get_organisation_by_name(
                team_dto.organisation
            )

        for attr, value in team_dto.items():
            if attr == "visibility" and value is not None:
                value = TeamVisibility[team_dto.visibility].value
            if attr == "join_method" and value is not None:
                value = TeamJoinMethod[team_dto.join_method].value

            if attr in ("members", "organisation"):
                continue

            try:
                is_field_nullable = self.__table__.columns[attr].nullable
                if is_field_nullable and value is not None:
                    setattr(self, attr, value)
                elif value is not None:
                    setattr(self, attr, value)
            except KeyError:
                continue

        if team_dto.members != self._get_team_members() and team_dto.members:
            for member in self.members:
                member_name = User.get_by_id(member.user_id).username
                if member_name not in [i["username"] for i in team_dto.members]:
                    member.delete()
            for member in team_dto.members:
                user = User.get_by_username(member["username"])
                if user is None:
                    raise NotFound(
                        sub_code="USER_NOT_FOUND", username=member["username"]
                    )
                team_member = TeamMembers.get(self.id, user.id)
                if team_member:
                    team_member.join_request_notifications = member[
                        "join_request_notifications"
                    ]
                else:
                    new_team_member = TeamMembers()
                    new_team_member.team = self
                    new_team_member.member = user
                    new_team_member.function = TeamMemberFunctions[
                        member["function"]
                    ].value

        session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()

    def can_be_deleted(self) -> bool:
        """A Team can be deleted if it doesn't have any projects"""
        return len(self.projects) == 0

    def get(team_id: int):
        """
        Gets specified team by id
        :param team_id: team ID in scope
        :return: Team if found otherwise None
        """
        return session.get(Team, team_id)

    def get_team_by_name(team_name: str):
        """
        Gets specified team by name
        :param team_name: team name in scope
        :return: Team if found otherwise None
        """
        return Team.query.filter_by(name=team_name).one_or_none()

    def as_dto(self):
        """Returns a dto for the team"""
        team_dto = TeamDTO()
        team_dto.team_id = self.id
        team_dto.description = self.description
        team_dto.join_method = TeamJoinMethod(self.join_method).name
        team_dto.members = self._get_team_members()
        team_dto.name = self.name
        team_dto.organisation = self.organisation.name
        team_dto.organisation_id = self.organisation.id
        team_dto.logo = self.organisation.logo
        team_dto.visibility = TeamVisibility(self.visibility).name
        return team_dto

    async def as_dto_inside_org(self, session):
        """Returns a dto for the team"""
        team_dto = OrganisationTeamsDTO()

        team_dto.team_id = self.id
        team_dto.name = self.name
        team_dto.description = self.description
        team_dto.join_method = TeamJoinMethod(self.join_method).name
        team_dto.members = await self._get_team_members(session)
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

    async def _get_team_members(self, session):
        """Helper to get JSON serialized members"""
        members = []
        for mem in self.members:
            members.append(
                {
                    "username": mem.member.username,
                    "pictureUrl": mem.member.picture_url,
                    "function": TeamMemberFunctions(mem.function).name,
                    "active": mem.active,
                    "joinedDate": mem.joined_date,
                }
            )

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
