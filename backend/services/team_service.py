from typing import Optional
from databases import Database
from fastapi.responses import JSONResponse
from loguru import logger
from markdown import markdown

from backend.db import db_connection
from backend.exceptions import NotFound
from backend.models.dtos.message_dto import MessageDTO
from backend.models.dtos.stats_dto import Pagination
from backend.models.dtos.team_dto import (
    NewTeamDTO,
    ProjectTeamDTO,
    TeamDetailsDTO,
    TeamDTO,
    TeamSearchDTO,
    TeamsListDTO,
)
from backend.models.postgis.message import Message, MessageType
from backend.models.postgis.project import ProjectTeams
from backend.models.postgis.statuses import (
    MappingPermission,
    TeamJoinMethod,
    TeamMemberFunctions,
    TeamRoles,
    TeamVisibility,
    UserRole,
    ValidationPermission,
)
from backend.models.postgis.team import Team, TeamMembers
from backend.services.messaging.message_service import MessageService
from backend.services.organisation_service import OrganisationService
from backend.services.users.user_service import UserService


class TeamServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling teams"""

    def __init__(self, message):
        logger.debug(message)


class TeamJoinNotAllowed(Exception):
    """Custom Exception to notify bad user level on joining team"""

    def __init__(self, message):
        logger.debug(message)


class TeamService:
    @staticmethod
    async def get_team_by_id_user(team_id: int, user_id: int, db: Database):
        query = """
            SELECT * FROM team_members
            WHERE team_id = :team_id AND user_id = :user_id
        """
        team_member = await db.fetch_one(
            query, values={"team_id": team_id, "user_id": user_id}
        )
        return team_member

    @staticmethod
    async def request_to_join_team(team_id: int, user_id: int, db: Database):
        team = await TeamService.get_team_by_id(team_id, db)
        # If user has team manager permission add directly to the team without request.E.G. Admins, Org managers
        if await TeamService.is_user_team_member(team_id, user_id, db):
            raise TeamServiceError(
                "The user is already a member of the team or has requested to join."
            )
        if await TeamService.is_user_team_manager(team_id, user_id, db):
            await TeamService.add_team_member(
                team_id, user_id, TeamMemberFunctions.MEMBER.value, True, db
            )
            return

        # Cannot send join request to BY_INVITE team
        if team.join_method == TeamJoinMethod.BY_INVITE.value:
            raise TeamServiceError(
                f"Team join method is {TeamJoinMethod.BY_INVITE.name}"
            )

        role = TeamMemberFunctions.MEMBER.value
        user = await UserService.get_user_by_id(user_id, db)
        active = False
        # Set active=True for team with join method ANY as no approval is required to join this team type.
        if team.join_method == TeamJoinMethod.ANY.value:
            active = True
        await TeamService.add_team_member(team_id, user_id, role, active, db)
        # Notify team managers about a join request in BY_REQUEST team.
        if team.join_method == TeamJoinMethod.BY_REQUEST.value:
            team_managers = await Team.get_team_managers(db, team.id)
            for manager in team_managers:
                if manager.join_request_notifications:
                    manager_obj = await UserService.get_user_by_username(
                        manager.username, db
                    )
                    await MessageService.send_request_to_join_team(
                        user.id, user.username, manager_obj.id, team.name, team_id, db
                    )

    @staticmethod
    async def add_user_to_team(
        team_id: int,
        requesting_user: int,
        username: str,
        role: str = None,
        db: Database = None,
    ):
        is_manager = await TeamService.is_user_team_manager(
            team_id, requesting_user, db
        )
        if not is_manager:
            raise TeamServiceError("User is not allowed to add member to the team")
        team = await TeamService.get_team_by_id(team_id, db)
        from_user = await UserService.get_user_by_id(requesting_user, db)
        to_user = await UserService.get_user_by_username(username, db)
        member = await TeamMembers.get(team_id, to_user.id, db)
        if member:
            member.function = TeamMemberFunctions[role].value
            member.active = True
            await TeamMembers.update(member, db)
            return JSONResponse(
                content={"Success": "User role updated"}, status_code=200
            )

        else:
            if role:
                try:
                    role = TeamMemberFunctions[role.upper()].value
                except KeyError:
                    raise Exception("Invalid TeamMemberFunction")
            else:
                role = TeamMemberFunctions.MEMBER.value
            await TeamService.add_team_member(team_id, to_user.id, role, True, db)
            await MessageService.send_team_join_notification(
                requesting_user,
                from_user.username,
                to_user.id,
                team.name,
                team_id,
                TeamMemberFunctions(role).name,
                db,
            )

    @staticmethod
    async def add_team_member(
        team_id, user_id, function, active=False, db: Database = None
    ):
        team_member = TeamMembers()
        team_member.team_id = team_id
        team_member.user_id = user_id
        team_member.function = function
        team_member.active = active
        await TeamMembers.create(team_member, db)

    @staticmethod
    async def send_invite(team_id, from_user_id, username, db: Database):
        to_user = await UserService.get_user_by_username(username, db)
        from_user = await UserService.get_user_by_id(from_user_id, db)
        team = await TeamService.get_team_by_id(team_id, db)
        MessageService.send_invite_to_join_team(
            from_user_id, from_user.username, to_user.id, team.name, team_id
        )

    @staticmethod
    async def accept_reject_join_request(
        team_id, from_user_id, username, function, action, db: Database
    ):
        from_user = await UserService.get_user_by_id(from_user_id, db)
        user = await UserService.get_user_by_username(username, db)
        to_user_id = user.id
        team = await TeamService.get_team_by_id(team_id, db)

        if not await TeamService.is_user_team_member(team_id, to_user_id, db):
            raise NotFound(sub_code="JOIN_REQUEST_NOT_FOUND", username=username)

        if action not in ["accept", "reject"]:
            raise TeamServiceError("Invalid action type")
        if action == "accept":
            await TeamService.activate_team_member(team_id, to_user_id, db)
        elif action == "reject":
            await TeamService.delete_invite(team_id, to_user_id, db)

        await MessageService.accept_reject_request_to_join_team(
            from_user_id, from_user.username, to_user_id, team.name, team_id, action, db
        )

    @staticmethod
    async def accept_reject_invitation_request(
        team_id, from_user_id, username, function, action, db: Database
    ):
        from_user = await UserService.get_user_by_id(from_user_id, db)
        to_user = await UserService.get_user_by_username(username, db)
        team = await TeamService.get_team_by_id(team_id, db)
        team_members = await Team.get_team_managers(db, team.id)

        for member in team_members:
            MessageService.accept_reject_invitation_request_for_team(
                from_user_id,
                from_user.username,
                member.user_id,
                to_user.username,
                team.name,
                team_id,
                action,
            )
        if action == "accept":
            await TeamService.add_team_member(
                team_id, from_user_id, TeamMemberFunctions[function.upper()].value, db
            )

    @staticmethod
    async def leave_team(team_id, username, db: Database = None):
        user = await UserService.get_user_by_username(username, db)
        team_member = await TeamService.get_team_by_id_user(team_id, user.id, db)

        # Raise an exception if the team member is not found
        if not team_member:
            raise NotFound(
                sub_code="USER_NOT_IN_TEAM", username=username, team_id=team_id
            )

        # If found, delete the team member
        delete_query = """
            DELETE FROM team_members
            WHERE team_id = :team_id AND user_id = :user_id
        """
        await db.execute(delete_query, values={"team_id": team_id, "user_id": user.id})

    @staticmethod
    async def add_team_project(team_id, project_id, role, db: Database):
        team_project = ProjectTeams()
        team_project.project_id = project_id
        team_project.team_id = team_id
        team_project.role = TeamRoles[role].value
        await ProjectTeams.create(team_project, db)

    @staticmethod
    async def delete_team_project(team_id: int, project_id: int, db: Database):
        """
        Deletes a project team by team_id and project_id.
        :param team_id: ID of the team
        :param project_id: ID of the project
        :param db: async database connection
        """
        # Query to find the project team
        query = """
            SELECT * FROM project_teams
            WHERE team_id = :team_id AND project_id = :project_id
        """
        project_team = await db.fetch_one(
            query, values={"team_id": team_id, "project_id": project_id}
        )

        # Check if the project team exists
        if not project_team:
            raise NotFound(
                sub_code="PROJECT_TEAM_NOT_FOUND",
                team_id=team_id,
                project_id=project_id,
            )

        # If found, delete the project team
        delete_query = """
            DELETE FROM project_teams
            WHERE team_id = :team_id AND project_id = :project_id
        """
        await db.execute(
            delete_query, values={"team_id": team_id, "project_id": project_id}
        )

    @staticmethod
    async def get_all_teams(search_dto: TeamSearchDTO, db: Database) -> TeamsListDTO:
        query_parts = []
        params = {}

        base_query = """
            SELECT t.id, t.name, t.join_method, t.visibility, t.description,
                   o.logo, o.name as organisation_name, o.id as organisation_id
            FROM teams t
            JOIN organisations o ON t.organisation_id = o.id
        """

        if search_dto.organisation:
            query_parts.append("t.organisation_id = :organisation_id")
            params["organisation_id"] = search_dto.organisation

        if search_dto.manager and int(search_dto.manager) == int(search_dto.user_id):
            manager_teams_query = """
                SELECT t.id FROM teams t
                JOIN team_members tm ON t.id = tm.team_id
                WHERE tm.user_id = :manager_id AND tm.active = true AND tm.function = :manager_function
            """
            params["manager_id"] = int(search_dto.manager)
            params["manager_function"] = TeamMemberFunctions.MANAGER.value

            orgs_teams_query = """
                SELECT t.id FROM teams t
                WHERE t.organisation_id = ANY(
                    SELECT organisation_id FROM organisation_managers WHERE user_id = :manager_id
                )
            """

            query_parts.append(
                f"t.id IN ({manager_teams_query} UNION {orgs_teams_query})"
            )

        if search_dto.team_name:
            query_parts.append("t.name ILIKE :team_name")
            params["team_name"] = f"%{search_dto.team_name}%"

        if search_dto.team_role:
            try:
                role = TeamRoles[search_dto.team_role.upper()].value
                project_teams_query = """
                    SELECT pt.team_id FROM project_teams pt WHERE pt.role = :team_role
                """
                query_parts.append(f"t.id IN ({project_teams_query})")
                params["team_role"] = role
            except KeyError:
                pass

        if search_dto.member:
            team_member_query = """
                SELECT tm.team_id FROM team_members tm
                WHERE tm.user_id = :member_id AND tm.active = true
            """
            query_parts.append(f"t.id IN ({team_member_query})")
            params["member_id"] = search_dto.member

        if search_dto.member_request:
            team_member_request_query = """
                SELECT tm.team_id FROM team_members tm
                WHERE tm.user_id = :member_request_id AND tm.active = false
            """
            query_parts.append(f"t.id IN ({team_member_request_query})")
            params["member_request_id"] = search_dto.member_request

        user = await UserService.get_user_by_id(search_dto.user_id, db)
        is_admin = UserRole(user.role) == UserRole.ADMIN
        if not is_admin:
            public_or_member_query = """
                t.visibility = :public_visibility OR t.id IN (
                    SELECT tm.team_id FROM team_members tm WHERE tm.user_id = :user_id
                )
            """
            query_parts.append(f"({public_or_member_query})")
            params["public_visibility"] = TeamVisibility.PUBLIC.value
            params["user_id"] = search_dto.user_id

        if query_parts:
            final_query = f"{base_query} WHERE {' AND '.join(query_parts)}"
        else:
            final_query = base_query

        if search_dto.paginate:
            final_query_paginated = final_query
            limit = search_dto.per_page
            offset = (search_dto.page - 1) * search_dto.per_page
            final_query_paginated += f" LIMIT {limit} OFFSET {offset}"
            rows = await db.fetch_all(query=final_query_paginated, values=params)

        else:
            rows = await db.fetch_all(query=final_query, values=params)

        teams_list_dto = TeamsListDTO()
        for row in rows:
            team_dto = TeamDTO(
                team_id=row["id"],
                name=row["name"],
                join_method=TeamJoinMethod(row["join_method"]).name,
                visibility=TeamVisibility(row["visibility"]).name,
                description=row["description"],
                logo=row["logo"],
                organisation=row["organisation_name"],
                organisation_id=row["organisation_id"],
                members=[],
            )

            if not search_dto.omit_members:
                if search_dto.full_members_list:
                    team_dto.members = await Team.get_all_members(db, row["id"], None)
                else:
                    team_managers = await Team.get_team_managers(db, row["id"], 10)
                    team_members = await Team.get_team_members(db, row["id"], 10)
                    team_members.extend(team_managers)
                    team_dto.members = team_members

                team_dto.members_count = await Team.get_members_count_by_role(
                    db, row["id"], TeamMemberFunctions.MEMBER
                )
                team_dto.managers_count = await Team.get_members_count_by_role(
                    db, row["id"], TeamMemberFunctions.MANAGER
                )

            teams_list_dto.teams.append(team_dto)

        if search_dto.paginate:
            total_query = "SELECT COUNT(*) FROM (" + final_query + ") as total"
            total = await db.fetch_val(query=total_query, values=params)
            teams_list_dto.pagination = Pagination.from_total_count(
                total=total, page=search_dto.page, per_page=search_dto.per_page
            )
        return teams_list_dto

    async def get_team_as_dto(
        team_id: int, user_id: int, abbreviated: bool, db: Database
    ) -> TeamDetailsDTO:
        # Query to fetch team and organisation details
        team_query = """
            SELECT t.id as team_id, t.name as team_name, t.join_method, t.visibility,
                t.description, o.logo as org_logo, o.name as org_name,
                o.id as org_id, o.slug as org_slug
            FROM teams t
            JOIN organisations o ON t.organisation_id = o.id
            WHERE t.id = :team_id
        """

        # Fetch the team details
        team_details = await db.fetch_one(query=team_query, values={"team_id": team_id})

        if not team_details:
            raise NotFound(sub_code="TEAM_NOT_FOUND", team_id=team_id)

        # Create the TeamDetailsDTO
        team_dto = TeamDetailsDTO(
            team_id=team_details["team_id"],
            name=team_details["team_name"],
            join_method=TeamJoinMethod(team_details["join_method"]).name,
            visibility=TeamVisibility(team_details["visibility"]).name,
            description=team_details["description"],
            logo=team_details["org_logo"],
            organisation=team_details["org_name"],
            organisation_id=team_details["org_id"],
            organisation_slug=team_details["org_slug"],
        )

        # Check for admin roles if user_id is provided
        if user_id != 0:
            team_dto.is_general_admin = await UserService.is_user_an_admin(user_id, db)
            team_dto.is_org_admin = await OrganisationService.is_user_an_org_manager(
                team_details["org_id"], user_id, db
            )

        if abbreviated:
            return team_dto

        # Fetch and add team members to the DTO
        members_query = """
            SELECT user_id FROM team_members WHERE team_id = :team_id
        """
        members = await db.fetch_all(query=members_query, values={"team_id": team_id})
        team_dto.members = (
            [
                await Team.as_dto_team_member(member.user_id, team_id, db)
                for member in members
            ]
            if members
            else []
        )
        team_projects = await TeamService.get_projects_by_team_id(team_id, db)
        team_dto.team_projects = (
            [Team.as_dto_team_project(project) for project in team_projects]
            if team_projects
            else []
        )
        return team_dto

    @staticmethod
    async def get_projects_by_team_id(team_id: int, db: Database):
        # SQL query to fetch project details associated with the team
        projects_query = """
            SELECT p.name, pt.project_id, pt.role
            FROM project_teams pt
            JOIN project_info p ON p.project_id = pt.project_id
            WHERE pt.team_id = :team_id
        """

        # Execute the query and fetch all results
        projects = await db.fetch_all(query=projects_query, values={"team_id": team_id})

        if not projects:
            projects = []

        return projects

    @staticmethod
    async def get_project_teams_as_dto(project_id: int, db: Database) -> TeamsListDTO:
        """Gets all the teams for a specified project with their roles and names"""
        # Raw SQL query to get project teams with team names
        query = """
            SELECT pt.team_id, t.name AS team_name, pt.role
            FROM project_teams pt
            JOIN teams t ON pt.team_id = t.id
            WHERE pt.project_id = :project_id
        """
        project_teams = await db.fetch_all(
            query=query, values={"project_id": project_id}
        )
        # Initialize the DTO
        teams_list_dto = TeamsListDTO()

        # Populate the DTO with team data
        for project_team in project_teams:
            team_dto = ProjectTeamDTO(
                team_id=project_team["team_id"],
                team_name=project_team["team_name"],
                role=str(project_team["role"]),
            )
            teams_list_dto.teams.append(team_dto)

        return teams_list_dto

    @staticmethod
    async def change_team_role(team_id: int, project_id: int, role: str, db: Database):
        """
        Change the role of a team in a project.
        :param team_id: ID of the team
        :param project_id: ID of the project
        :param role: New role to assign
        :param db: Database instance for executing queries
        """
        # Assuming `TeamRoles[role].value` gives the correct integer or string value for the role
        new_role_value = TeamRoles[role].value

        # Write the raw SQL query to update the role in the `project_teams` table
        query = """
            UPDATE project_teams
            SET role = :new_role_value
            WHERE team_id = :team_id AND project_id = :project_id
        """

        # Execute the query
        await db.execute(
            query,
            {
                "new_role_value": new_role_value,
                "team_id": team_id,
                "project_id": project_id,
            },
        )

    @staticmethod
    async def get_team_by_id(team_id: int, db: Database):
        """
        Get team from DB
        :param team_id: ID of team to fetch
        :returns: Team
        :raises: Not Found
        """
        # Raw SQL query to select the team by ID
        query = """
            SELECT id, name, organisation_id, join_method, description, visibility
            FROM teams
            WHERE id = :team_id
        """
        # Execute the query and fetch the team
        team_record = await db.fetch_one(query=query, values={"team_id": team_id})
        if team_record is None:
            raise NotFound(sub_code="TEAM_NOT_FOUND", team_id=team_id)

        return team_record

    @staticmethod
    def get_team_by_name(team_name: str) -> Team:
        team = Team.get_team_by_name(team_name)

        if team is None:
            raise NotFound(sub_code="TEAM_NOT_FOUND", team_name=team_name)

        return team

    @staticmethod
    async def create_team(new_team_dto: NewTeamDTO, db: Database) -> int:
        """
        Creates a new team using a team dto
        :param new_team_dto: Team DTO
        :returns: ID of new Team
        """
        await TeamService.assert_validate_organisation(new_team_dto.organisation_id, db)

        team = await Team.create_from_dto(new_team_dto, db)
        return team

    @staticmethod
    async def update_team(team_dto: TeamDTO, db: Database) -> Team:
        """
        Updates a team
        :param team_dto: DTO with updated info
        :returns updated Team
        """
        team = await TeamService.get_team_by_id(team_dto.team_id, db)
        team = await Team.update(team, team_dto, db)

        return team["id"] if team else None

    @staticmethod
    async def assert_validate_organisation(org_id: int, db: Database):
        """Makes sure an organisation exists"""
        try:
            await OrganisationService.get_organisation_by_id(org_id, db)
        except NotFound:
            raise TeamServiceError(f"Organisation {org_id} does not exist")

    @staticmethod
    def assert_validate_members(team_dto: TeamDTO):
        """Validates that the users exist"""
        if len(team_dto.members) == 0:
            raise TeamServiceError("Must have at least one member")

            members = []
            managers = 0
            for member in team_dto.members:
                try:
                    UserService.get_user_by_username(member["name"])
                except NotFound:
                    raise NotFound(sub_code="USER_NOT_FOUND", username=member["name"])
                if member["function"] == TeamMemberFunctions.MANAGER.name:
                    managers += 1

                members.append(member)

            if managers == 0:
                raise TeamServiceError("Must have at least one manager in team")

            team_dto.members = members

    @staticmethod
    async def _get_team_members(team_id: int, db: Database):
        # Asynchronous query to fetch team members by team_id
        query = "SELECT * FROM team_members WHERE team_id = :team_id"
        return await db.fetch_all(query, values={"team_id": team_id})

    @staticmethod
    async def _get_active_team_members(team_id: int, db: Database):
        try:
            query = """
                SELECT * FROM team_members
                WHERE team_id = :team_id AND active = TRUE
            """
            return await db.fetch_all(query, values={"team_id": team_id})
        except Exception as e:
            print(f"Error executing query: {str(e)}")
            raise

    @staticmethod
    async def activate_team_member(team_id: int, user_id: int, db: Database):
        # Fetch the member by team_id and user_id
        member = await TeamService.get_team_by_id_user(team_id, user_id, db)

        if member:
            # Update the 'active' status of the member
            update_query = """
                UPDATE team_members
                SET active = TRUE
                WHERE team_id = :team_id AND user_id = :user_id
            """
            await db.execute(
                update_query, values={"team_id": team_id, "user_id": user_id}
            )
        else:
            # Handle case where member is not found
            raise ValueError(
                f"No member found with team_id {team_id} and user_id {user_id}"
            )

    @staticmethod
    async def delete_invite(team_id: int, user_id: int, db: Database):
        # Fetch the member by team_id and user_id to check if it exists
        member = await TeamService.get_team_by_id_user(team_id, user_id, db)

        if member:
            # Delete the member from the database
            delete_query = """
                DELETE FROM team_members
                WHERE team_id = :team_id AND user_id = :user_id
            """
            await db.execute(
                delete_query, values={"team_id": team_id, "user_id": user_id}
            )
        else:
            # Handle case where member is not found
            raise ValueError(
                f"No member found with team_id {team_id} and user_id {user_id}"
            )

    @staticmethod
    async def is_user_team_member(team_id: int, user_id: int, db: Database) -> bool:
        # Query to check if the user is a member of the team
        query = """
            SELECT EXISTS (
                SELECT 1 FROM team_members
                WHERE team_id = :team_id AND user_id = :user_id
            ) AS is_member
        """
        result = await db.fetch_one(
            query, values={"team_id": team_id, "user_id": user_id}
        )

        # The result contains the 'is_member' field, which is a boolean
        return result["is_member"]

    @staticmethod
    async def is_user_an_active_team_member(
        team_id: int, user_id: int, db: Database
    ) -> bool:
        """
        Check if a user is an active member of a team.
        :param team_id: ID of the team
        :param user_id: ID of the user
        :param db: Database connection
        :returns: True if the user is an active member, False otherwise
        """
        # Raw SQL query to check if the user is an active team member
        query = """
            SELECT EXISTS(
                SELECT 1
                FROM team_members
                WHERE team_id = :team_id
                AND user_id = :user_id
                AND active = true
            ) AS is_active
        """

        # Execute the query and fetch the result
        result = await db.fetch_one(
            query=query, values={"team_id": team_id, "user_id": user_id}
        )
        # Return the boolean value indicating if the user is an active team member
        return result["is_active"]

    @staticmethod
    async def is_user_team_manager(team_id: int, user_id: int, db: Database) -> bool:
        # Admin manages all teams
        team = await TeamService.get_team_by_id(team_id, db)
        if await UserService.is_user_an_admin(user_id, db):
            return True

        managers = await Team.get_team_managers(db, team.id)
        for member in managers:
            team_manager = await UserService.get_user_by_username(member.username, db)
            if team_manager.id == user_id:
                return True

        # Org admin manages teams attached to their org
        user_managed_orgs = [
            org.organisation_id
            for org in await OrganisationService.get_organisations(user_id, db)
        ]
        if team.organisation_id in user_managed_orgs:
            return True

        return False

    @staticmethod
    async def delete_team(team_id: int, db: Database):
        """Deletes a team"""
        team = await TeamService.get_team_by_id(team_id, db)
        if await Team.can_be_deleted(team_id, db):
            await Team.delete(team, db)
            return JSONResponse(content={"Success": "Team deleted"}, status_code=200)
        else:
            return JSONResponse(
                content={
                    "Error": "Team has projects, cannot be deleted",
                    "SubCode": "This team has projects associated. Before deleting, unlink any associated projects.",
                },
                status_code=400,
            )

    @staticmethod
    async def check_team_membership(
        project_id: int, allowed_roles: list, user_id: int, db
    ):
        """Given a project and permitted team roles, check user's membership in the team list"""
        teams_dto = await TeamService.get_project_teams_as_dto(project_id, db)
        teams_allowed = [
            team_dto
            for team_dto in teams_dto.teams
            if int(team_dto.role) in allowed_roles
        ]
        user_membership = [
            team_dto.team_id
            for team_dto in teams_allowed
            if await TeamService.is_user_an_active_team_member(
                team_dto.team_id, user_id, db
            )
        ]
        return len(user_membership) > 0

    @staticmethod
    async def send_message_to_all_team_members(
        team_id: int,
        team_name: str,
        message_dto: MessageDTO,
        user_id: int,
    ):
        try:
            async with db_connection.database.connection() as conn:
                team_members = await TeamService._get_active_team_members(team_id, conn)
                user = await UserService.get_user_by_id(user_id, conn)
                sender = user.username
                message_dto.message = (
                    "A message from {}, manager of {} team:<br/><br/>{}".format(
                        MessageService.get_user_profile_link(sender),
                        MessageService.get_team_link(team_name, team_id, False),
                        markdown(message_dto.message, output_format="html"),
                    )
                )
                messages = []
                for team_member in team_members:
                    if team_member.user_id != user_id:
                        message = Message.from_dto(team_member.user_id, message_dto)
                        message.message_type = MessageType.TEAM_BROADCAST.value
                        user = await UserService.get_user_by_id(
                            team_member.user_id, conn
                        )
                        messages.append(dict(message=message, user=user))
                await MessageService._push_messages(messages, conn)
            logger.info("Messages sent successfully.")
        except Exception as e:
            logger.error(f"Error sending messages in background task: {str(e)}")

    @staticmethod
    async def unlink_team(project_id: int, team_id: int, db: Database) -> bool:
        """
        Delete the project_teams row matching project_id & team_id.
        Returns True if a row was deleted, False otherwise.
        """
        query = """
            DELETE FROM project_teams
            WHERE project_id = :project_id
              AND team_id    = :team_id
            RETURNING team_id
        """
        row = await db.fetch_one(
            query,
            values={
                "project_id": project_id,
                "team_id": team_id,
            },
        )
        return row is not None

    async def ensure_unlink_allowed(
        project_id: int, team_id: int, db: Database
    ) -> Optional[JSONResponse]:
        """
        Ensure it's allowed to unlink `team_id` from `project_id`.

        Returns a JSONResponse with a single sentence Error message when unlinking should
        be rejected, or None when it's allowed.
        """
        project_row = await db.fetch_one(
            "SELECT id, mapping_permission, validation_permission FROM projects WHERE id = :pid",
            {"pid": project_id},
        )
        if not project_row:
            return JSONResponse(
                {
                    "Error": f"Cannot unlink team with team id-{team_id}: project {project_id} not found",
                    "SubCode": "NotFoundError",
                },
                status_code=404,
            )

        mapping_perm = project_row["mapping_permission"]
        validation_perm = project_row["validation_permission"]

        project_team_row = await db.fetch_one(
            "SELECT role FROM project_teams WHERE project_id = :pid AND team_id = :tid",
            {"pid": project_id, "tid": team_id},
        )
        if not project_team_row:
            return JSONResponse(
                {
                    "Error": (
                        f"Cannot unlink team with team id-{team_id}: "
                        f"project {project_id} has no such linked team"
                    ),
                    "SubCode": "NotFoundError",
                },
                status_code=404,
            )

        team_role = project_team_row["role"]

        if (
            mapping_perm == MappingPermission.TEAMS.value
            and team_role == TeamRoles.MAPPER.value
        ):
            cnt_row = await db.fetch_one(
                "SELECT COUNT(1) AS cnt FROM project_teams WHERE project_id = :pid AND role = :role",
                {"pid": project_id, "role": TeamRoles.MAPPER.value},
            )
            mapper_count = int(cnt_row["cnt"]) if cnt_row else 0

            if mapper_count <= 1:
                return JSONResponse(
                    {
                        "Error": (
                            f"Cannot unlink team with team id-{team_id}: "
                            f"project {project_id} mapping is restricted to assigned teams "
                            f"and this is the only mapper team. Contact the project admin "
                            f"to unlink the team and assign another mapper team."
                        ),
                        "SubCode": "ProjectPermissionError",
                    },
                    status_code=403,
                )

        if (
            validation_perm == ValidationPermission.TEAMS.value
            and team_role == TeamRoles.VALIDATOR.value
        ):
            cnt_row = await db.fetch_one(
                "SELECT COUNT(1) AS cnt FROM project_teams WHERE project_id = :pid AND role = :role",
                {"pid": project_id, "role": TeamRoles.VALIDATOR.value},
            )
            validator_count = int(cnt_row["cnt"]) if cnt_row else 0

            if validator_count <= 1:
                return JSONResponse(
                    {
                        "Error": (
                            f"Cannot unlink team with team id-{team_id}: "
                            f"project {project_id} validation is restricted to assigned teams "
                            f"and this is the only validator team. Contact the project admin "
                            f"to unlink the team and assign another validator team."
                        ),
                        "SubCode": "ProjectPermissionError",
                    },
                    status_code=403,
                )

        return None
