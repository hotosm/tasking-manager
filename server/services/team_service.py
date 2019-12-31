from flask import current_app
from sqlalchemy import and_

from server import db
from server.models.dtos.team_dto import (
    TeamDTO,
    NewTeamDTO,
    TeamsListDTO,
    TeamMembersDTO,
    ProjectTeamDTO,
    TeamProjectDTO,
    TeamDetailsDTO,
)
from server.models.dtos.organisation_dto import OrganisationProjectsDTO
from server.models.postgis.team import Team, TeamMembers
from server.models.postgis.project import ProjectTeams
from server.models.postgis.project_info import ProjectInfo
from server.models.postgis.utils import NotFound
from server.models.postgis.statuses import (
    TeamMemberFunctions,
    TeamVisibility,
    TeamRoles,
)
from server.services.organisation_service import OrganisationService
from server.services.users.user_service import UserService
from server.services.messaging.message_service import MessageService


class TeamServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling teams """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class TeamJoinNotAllowed(Exception):
    """ Custom Exception to notify bad user level on joining team """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class TeamService:
    @staticmethod
    def join_team(team_id: int, requesting_user: int, username: str, role: str = None):
        is_manager = TeamService.user_is_manager(team_id, requesting_user)
        team = TeamService.get_team_by_id(team_id)
        user = UserService.get_user_by_username(username)

        if TeamService.is_user_member_of_team(team.id, user.id):
            raise TeamJoinNotAllowed(
                "User is already a member of this team or has already requested to join"
            )

        if is_manager:
            if role:
                try:
                    role = TeamMemberFunctions[role.upper()].value
                except KeyError:
                    raise Exception("Invalid TeamMemberFunction")
            else:
                role = TeamMemberFunctions.MEMBER.value

            TeamService.add_team_member(team_id, user.id, role, True)
        else:
            if user.id != requesting_user:
                raise TeamJoinNotAllowed("User not allowed to join team")

            role = TeamMemberFunctions.MEMBER.value

            # active if the team is open
            if team.invite_only:
                active = False
            else:
                active = True

            TeamService.add_team_member(team_id, user.id, role, active)

            if team.invite_only:
                team_managers = TeamService._get_team_managers(team_id)
                for member in team_managers:
                    MessageService.send_request_to_join_team(
                        user.id, user.username, member.user_id, team.name
                    )

    @staticmethod
    def send_invite(team_id, from_user_id, username):
        to_user = UserService.get_user_by_username(username)
        from_user = UserService.get_user_by_id(from_user_id)
        team = TeamService.get_team_by_id(team_id)
        MessageService.send_invite_to_join_team(
            from_user_id, from_user.username, to_user.id, team.name
        )

    @staticmethod
    def accept_reject_join_request(team_id, from_user_id, username, function, response):
        from_user = UserService.get_user_by_id(from_user_id)
        to_user_id = UserService.get_user_by_username(username).id
        team = TeamService.get_team_by_id(team_id)
        MessageService.accept_reject_request_to_join_team(
            from_user_id, from_user.username, to_user_id, team.name, response
        )

        is_member = TeamService.is_user_member_of_team(team_id, to_user_id)
        if response == "accept":
            if is_member:
                TeamService.activate_team_member(team_id, to_user_id)
            else:
                TeamService.add_team_member(
                    team_id,
                    to_user_id,
                    TeamMemberFunctions[function.upper()].value,
                    True,
                )
        elif response == "reject":
            if is_member:
                TeamService.delete_invite(team_id, to_user_id)
        else:
            raise TeamServiceError("Invalid response type")

    @staticmethod
    def accept_reject_invitation_request(
        team_id, from_user_id, username, function, response
    ):
        from_user = UserService.get_user_by_id(from_user_id)
        to_user = UserService.get_user_by_username(username)
        team = TeamService.get_team_by_id(team_id)
        team_members = TeamService._get_team_managers(team_id)

        for member in team_members:
            MessageService.accept_reject_invitation_request_for_team(
                from_user_id,
                from_user.username,
                member.user_id,
                to_user.username,
                team.name,
                response,
            )
        if response == "accept":
            TeamService.add_team_member(
                team_id, from_user_id, TeamMemberFunctions[function.upper()].value
            )

    @staticmethod
    def add_team_member(team_id, user_id, function, active=False):
        team_member = TeamMembers()
        team_member.team_id = team_id
        team_member.user_id = user_id
        team_member.function = function
        team_member.active = active
        team_member.create()

    @staticmethod
    def leave_team(team_id, username):
        user = UserService.get_user_by_username(username)
        team_member = TeamMembers.query.filter(
            TeamMembers.team_id == team_id, TeamMembers.user_id == user.id
        ).one()
        team_member.delete()

    @staticmethod
    def add_team_project(team_id, project_id, role):
        team_project = ProjectTeams()
        team_project.project_id = project_id
        team_project.team_id = team_id
        team_project.role = TeamRoles[role].value
        team_project.create()

    @staticmethod
    def delete_team_project(team_id, project_id):
        project = ProjectTeams.query.filter(
            and_(ProjectTeams.team_id == team_id, ProjectTeams.project_id == project_id)
        ).one()
        project.delete()

    @staticmethod
    def get_all_teams(
        team_name_filter: str = None,
        team_role_filter: str = None,
        member_filter: int = None,
        member_request_filter: int = None,
        manager_filter: int = None,
        organisation_filter: int = None,
    ) -> TeamsListDTO:

        query = db.session.query(Team).outerjoin(TeamMembers).outerjoin(ProjectTeams)

        if team_name_filter:
            query = query.filter(Team.name.contains(team_name_filter))

        if team_role_filter:
            try:
                role = TeamRoles[team_role_filter.upper()].value
                query = query.filter(ProjectTeams.role == role)
            except KeyError:
                pass

        if member_filter:
            query = query.filter(
                TeamMembers.user_id == member_filter, TeamMembers.active == True  # noqa
            )

        if manager_filter:
            query = query.filter(
                TeamMembers.user_id == manager_filter,
                TeamMembers.active == True,  # noqa
                TeamMembers.function == TeamMemberFunctions.MANAGER.value,
            )

        if member_request_filter:
            query = query.filter(
                TeamMembers.user_id == member_request_filter,
                TeamMembers.active == False,  # noqa
            )

        if organisation_filter:
            query = query.filter(Team.organisation_id == organisation_filter)

        teams_list_dto = TeamsListDTO()

        for team in query.all():
            team_dto = TeamDTO()
            team_dto.team_id = team.id
            team_dto.name = team.name
            team_dto.invite_only = team.invite_only
            team_dto.visibility = TeamVisibility(team.visibility).name
            team_dto.description = team.description
            team_dto.logo = team.organisation.logo
            team_dto.organisation = team.organisation.name
            team_dto.organisation_id = team.organisation.id
            team_dto.members = []
            team_members = TeamService._get_team_members(team.id)
            for member in team_members:
                user = UserService.get_user_by_id(member.user_id)
                member_dto = TeamMembersDTO()
                member_dto.username = user.username
                member_dto.function = TeamMemberFunctions(member.function).name
                member_dto.picture_url = user.picture_url
                member_dto.active = member.active

                team_dto.members.append(member_dto)

            teams_list_dto.teams.append(team_dto)

        return teams_list_dto

    @staticmethod
    def get_team_as_dto(team_id: int, user_id: int) -> TeamDTO:
        team = TeamService.get_team_by_id(team_id)

        if team is None:
            raise NotFound()

        team_dto = TeamDetailsDTO()
        team_dto.team_id = team.id
        team_dto.name = team.name
        team_dto.invite_only = team.invite_only
        team_dto.visibility = TeamVisibility(team.visibility).name
        team_dto.description = team.description
        team_dto.logo = team.organisation.logo
        team_dto.organisation = team.organisation.name
        team_dto.organisation_id = team.organisation.id

        if user_id != 0:
            if UserService.is_user_an_admin(user_id):
                team_dto.is_general_admin = True

            if OrganisationService.is_user_an_org_manager(
                team.organisation.id, user_id
            ):
                team_dto.is_org_admin = True
        else:
            team_dto.is_general_admin = False
            team_dto.is_org_admin = False

        team_members = TeamService._get_team_members(team_id)
        for member in team_members:
            user = UserService.get_user_by_id(member.user_id)
            member_dto = TeamMembersDTO()
            member_dto.username = user.username
            member_dto.pictureUrl = user.picture_url
            member_dto.function = TeamMemberFunctions(member.function).name
            member_dto.picture_url = user.picture_url
            member_dto.active = member.active

            team_dto.members.append(member_dto)

        team_projects = TeamService.get_projects_by_team_id(team.id)
        for team_project in team_projects:
            project_team_dto = TeamProjectDTO()
            project_team_dto.project_name = team_project.name
            project_team_dto.project_id = team_project.project_id
            project_team_dto.role = TeamRoles(team_project.role).name

            team_dto.team_projects.append(project_team_dto)

        org_projects = OrganisationService.get_projects_by_organisation_id(
            team.organisation.id
        )
        for org_project in org_projects:
            org_project_dto = OrganisationProjectsDTO()
            org_project_dto.project_id = org_project.id
            org_project_dto.project_name = org_project.name
            team_dto.organisation_projects.append(org_project_dto)

        return team_dto

    @staticmethod
    def get_projects_by_team_id(team_id: int) -> ProjectInfo:
        projects = (
            db.session.query(
                ProjectInfo.name, ProjectTeams.project_id, ProjectTeams.role
            )
            .join(ProjectTeams, ProjectInfo.project_id == ProjectTeams.project_id)
            .filter(ProjectTeams.team_id == team_id)
            .all()
        )

        if projects is None:
            raise NotFound()

        return projects

    @staticmethod
    def get_project_teams_as_dto(project_id: int) -> TeamsListDTO:
        """ Gets all the campaigns for a specified project """
        project_teams = ProjectTeams.query.filter(project_id == project_id).all()
        teams_list_dto = TeamsListDTO()

        for project_team in project_teams:
            team = TeamService.get_team_by_id(project_team.team_id)
            team_dto = ProjectTeamDTO()
            team_dto.team_id = project_team.team_id
            team_dto.team_name = team.name
            team_dto.role = project_team.role

            teams_list_dto.teams.append(team_dto)

        return teams_list_dto

    @staticmethod
    def change_team_role(team_id: int, project_id: int, role: str):
        project = ProjectTeams.query.filter(
            and_(ProjectTeams.team_id == team_id, ProjectTeams.project_id == project_id)
        ).one()
        project.role = TeamRoles[role].value
        project.save()

    @staticmethod
    def get_team_by_id(team_id: int) -> Team:
        """
        Get team from DB
        :param team_id: ID of team to fetch
        :returns: Team
        :raises: Not Found
        """
        team = Team.get(team_id)

        if team is None:
            raise NotFound()

        return team

    @staticmethod
    def get_team_by_name(team_name: str) -> Team:
        team = Team.get_team_by_name(team_name)

        if team is None:
            raise NotFound()

        return team

    @staticmethod
    def create_team(new_team_dto: NewTeamDTO) -> int:
        """
        Creates a new team using a team dto
        :param team_dto: Team DTO
        :returns: ID of new Team
        """
        TeamService.assert_validate_organisation(new_team_dto.organisation_id)

        team = Team.create_from_dto(new_team_dto)
        return team.id

    @staticmethod
    def update_team(team_dto: TeamDTO) -> Team:
        """
        Updates a team
        :param team_dto: DTO with updated info
        :returns updated Team
        """
        team = TeamService.get_team_by_id(team_dto.team_id)
        team.update(team_dto)

        return team

    @staticmethod
    def assert_validate_organisation(org_id: int):
        """ Makes sure an organisation exists """
        try:
            OrganisationService.get_organisation_by_id(org_id)
        except NotFound:
            raise TeamServiceError(f"Organisation {org_id} does not exist")

    @staticmethod
    def assert_validate_members(team_dto: TeamDTO):
        """ Validates that the users exist"""
        if len(team_dto.members) == 0:
            raise TeamServiceError("Must have at least one member")

            members = []
            managers = 0
            for member in team_dto.members:
                try:
                    UserService.get_user_by_username(member["name"])
                except NotFound:
                    raise NotFound(f'User {member["name"]} does not exist')
                if member["function"] == TeamMemberFunctions.MANAGER.name:
                    managers += 1

                members.append(member)

            if managers == 0:
                raise TeamServiceError("Must have at least one manager in team")

            team_dto.members = members

    @staticmethod
    def _get_team_managers(team_id: int):
        return TeamMembers.query.filter_by(
            team_id=team_id, function=TeamMemberFunctions.MANAGER.value, active=True
        ).all()

    @staticmethod
    def _get_team_members(team_id: int):
        return TeamMembers.query.filter_by(team_id=team_id).all()

    @staticmethod
    def activate_team_member(team_id: int, user_id: int):
        member = TeamMembers.query.filter(
            TeamMembers.team_id == team_id, TeamMembers.user_id == user_id
        ).first()
        member.active = True
        db.session.add(member)
        db.session.commit()

    @staticmethod
    def delete_invite(team_id: int, user_id: int):
        member = TeamMembers.query.filter(
            TeamMembers.team_id == team_id, TeamMembers.user_id == user_id
        ).first()
        member.delete()

    @staticmethod
    def is_user_member_of_team(team_id: int, user_id: int):
        query = TeamMembers.query.filter(
            TeamMembers.team_id == team_id, TeamMembers.user_id == user_id
        ).exists()
        return db.session.query(query).scalar()

    @staticmethod
    def user_is_manager(team_id: int, user_id: int):
        if UserService.is_user_an_admin(user_id):
            return True

        managers = TeamService._get_team_managers(team_id)
        for member in managers:
            if member.user_id == user_id:
                return True

        return False

    @staticmethod
    def delete_team(team_id: int):
        """ Deletes a team """
        team = TeamService.get_team_by_id(team_id)

        if team.can_be_deleted():
            team.delete()
        else:
            raise TeamServiceError("Team has projects, cannot be deleted")
