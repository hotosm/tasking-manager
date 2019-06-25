from flask import current_app

from server.models.dtos.team_dto import TeamDTO, NewTeamDTO
from server.models.postgis.team import Team, TeamMembers
from server.models.postgis.utils import NotFound
from server.models.postgis.statuses import TeamMemberFunctions
from server.services.organisation_service import OrganisationService
from server.services.users.user_service import UserService


class TeamServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling teams """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class TeamService:

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
    def get_team_dto(team_id: int) -> TeamDTO:
        """
        Get the team DTO
        :param team_id: ID of the team
        :raises NotFound
        """
        team = TeamService.get_team_by_id(team_id)
        return team.as_dto()

    @staticmethod
    def create_team(new_team_dto: NewTeamDTO) -> int:
        """
        Creates a new team using a team dto
        :param team_dto: Team DTO
        :returns: ID of new Team
        """
        TeamService.assert_validate_organisation(new_team_dto.organisation)

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

        TeamService.assert_validate_organisation(team_dto.organisation)
        TeamService.assert_validate_members(team_dto)

        team.update(team_dto)
        return team

    @staticmethod
    def assert_validate_organisation(org_name: str):
        """ Makes sure an organisation exists """
        try:
            OrganisationService.get_organisation_by_name(org_name)
        except NotFound:
            raise TeamServiceError(f'Organisation {org_name} does not exist')

    @staticmethod
    def assert_validate_members(team_dto: TeamDTO):
        """ Validates that the users exist"""
        if len(team_dto.members) == 0:
            raise TeamServiceError('Must have at least one member')

            members = []
            managers = 0
            for member in team_dto.members:
                try:
                    UserService.get_user_by_username(member['name'])
                except NotFound:
                    raise NotFound(f'User {member["name"]} does not exist')
                if member['function'] == TeamMemberFunctions.MANAGER.name:
                    managers += 1

                members.append(member)

            if managers == 0:
                raise TeamServiceError('Must have at least one manager in team')

            team_dto.members = members


    @staticmethod
    def _get_team_managers(team_id: int):
        return TeamMembers.query.filter_by(
            team_id=team_id,
            function=TeamMemberFunctions.MANAGER.value
        ).all()

    @staticmethod
    def user_is_manager(team_id: int, user_id: int):
        if UserService.is_user_an_admin(user_id):
            return True

        managers = TeamService._get_team_managers(team_id)
        user = UserService.get_user_by_id(user_id)

        return user in managers

    @staticmethod
    def delete_team(team_id: int):
        """ Deletes a team """
        team = TeamService.get_team_by_id(team_id)

        if team.can_be_deleted():
            team.delete()
        else:
            raise TeamServiceError('Team has projects, cannot be deleted')
