from server import db

from server.models.dtos.team_dto import TeamDTO, NewTeamDTO
from server.models.postgis.organisation import Organisation
from server.models.postgis.statuses import TeamVisibility, TeamMemberFunctions
from server.models.postgis.user import User
from server.models.postgis.utils import NotFound


class TeamMembers(db.Model):
    __tablename__ = "team_members"
    team_id = db.Column(
        db.Integer, db.ForeignKey("teams.id", name="fk_teams"), primary_key=True
    )
    user_id = db.Column(
        db.BigInteger, db.ForeignKey("users.id", name="fk_users"), primary_key=True
    )
    function = db.Column(db.Integer, nullable=False)  # either 'editor' or 'manager'

    member = db.relationship(
        User, backref=db.backref("teams", cascade="all, delete-orphan")
    )
    team = db.relationship(
        "Team", backref=db.backref("members", cascade="all, delete-orphan")
    )


class Team(db.Model):
    """ Describes a team """

    __tablename__ = "teams"

    # Columns
    id = db.Column(db.Integer, primary_key=True)
    organisation_id = db.Column(
        db.Integer,
        db.ForeignKey("organisations.id", name="fk_organisations"),
        nullable=False,
    )
    name = db.Column(db.String(512), nullable=False)
    logo = db.Column(db.String)  # URL of a logo
    description = db.Column(db.String)
    invite_only = db.Column(db.Boolean, default=False, nullable=False)
    visibility = db.Column(
        db.Integer, default=TeamVisibility.PUBLIC.value, nullable=False
    )

    organisation = db.relationship(Organisation, backref="teams")

    def create(self):
        """ Creates and saves the current model to the DB """
        db.session.add(self)
        db.session.commit()

    @classmethod
    def create_from_dto(cls, new_team_dto: NewTeamDTO):
        """ Creates a new team from a dto """
        new_team = cls()

        new_team.name = new_team_dto.name
        new_team.logo = new_team_dto.logo
        new_team.description = new_team_dto.description
        new_team.invite_only = new_team_dto.invite_only
        new_team.visibility = TeamVisibility[new_team_dto.visibility].value

        org = Organisation().get_organisation_by_name(new_team_dto.organisation)
        new_team.organisation = org

        # Create team member with creator as a manager
        new_member = TeamMembers()
        new_member.team = new_team
        new_member.user_id = new_team_dto.creator
        new_member.function = TeamMemberFunctions.MANAGER.value

        new_team.members.append(new_member)

        new_team.create()
        return new_team

    def update(self, team_dto: TeamDTO):
        """ Updates Team from DTO """
        self.organisation = Organisation().get_organisation_by_name(
            team_dto.organisation
        )
        self.name = team_dto.name
        self.logo = team_dto.logo
        self.description = team_dto.description
        self.invite_only = team_dto.invite_only
        self.visibility = TeamVisibility[team_dto.visibility].value

        if team_dto.members != self.get_team_members():
            for member in self.members:
                db.session.delete(member)

            for member in team_dto.members:
                user = User().get_by_username(member["userName"])

                if user is None:
                    raise NotFound("User not found")

                new_team_member = TeamMembers()
                new_team_member.team = self
                new_team_member.member = user
                new_team_member.function = TeamMemberFunctions[member["function"]].value

        db.session.commit()

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    def can_be_deleted(self) -> bool:
        """ A Team can be deleted if it doesn't have any projects """
        return len(self.projects) == 0

    def get(team_id: int):
        """
        Gets specified team by id
        :param team_id: team ID in scope
        :return: Team if found otherwise None
        """
        return Team.query.get(team_id)

    def get_team_by_name(team_name: str):
        """
        Gets specified team by name
        :param team_id: team name in scope
        :return: Team if found otherwise None
        """
        return Team.query.filter_by(name=team_name).one_or_none()

    def as_dto(self):
        """ Returns a dto for the team """
        team_dto = TeamDTO()
        team_dto.team_id = self.id
        team_dto.description = self.description
        team_dto.invite_only = self.invite_only
        team_dto.logo = self.logo
        team_dto.members = self.get_team_members()
        team_dto.name = self.name
        team_dto.organisation = self.organisation.name
        team_dto.visibility = TeamVisibility(self.visibility).name

        return team_dto

    def get_team_members(self):
        """ Helper to get JSON serialized members """
        members = []
        for mem in self.members:
            members.append(
                {
                    "name": mem.member.username,
                    "function": TeamMemberFunctions(mem.function).name,
                }
            )

        return members
