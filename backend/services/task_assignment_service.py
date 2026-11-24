from typing import List, Optional

from databases import Database
from loguru import logger

from backend.exceptions import NotFound
from backend.models.dtos.stats_dto import Pagination
from backend.models.dtos.task_assignment_dto import (
    AssignedTaskDTO,
    AssignedTasksDTO,
    AssignmentWarningDTO,
    AssignTasksDTO,
    AssignTasksResultDTO,
    ProjectTaskAssignmentsDTO,
    TaskAssignmentDTO,
    UnassignTasksDTO,
)
from backend.models.postgis.mapping_level import MappingLevel
from backend.models.postgis.statuses import (
    MappingPermission,
    TaskAssigneeType,
    TaskAssignmentStage,
    TaskStatus,
    TeamRoles,
    UserRole,
    ValidationPermission,
)
from backend.models.postgis.task_assignment import TaskAssignment
from backend.services.project_admin_service import ProjectAdminService
from backend.services.project_service import ProjectService
from backend.services.team_service import TeamService
from backend.services.users.user_service import UserService

# Project team roles that let a team's members map / validate on a project.
# Mirrors ProjectService.has_mapping_permission / has_validation_permission.
STAGE_TEAM_ROLES = {
    TaskAssignmentStage.MAPPING: [
        TeamRoles.MAPPER.value,
        TeamRoles.VALIDATOR.value,
        TeamRoles.PROJECT_MANAGER.value,
    ],
    TaskAssignmentStage.VALIDATION: [
        TeamRoles.VALIDATOR.value,
        TeamRoles.PROJECT_MANAGER.value,
    ],
}


class TaskAssignmentServiceError(Exception):
    """Raised when an assignment request can't be carried out"""

    def __init__(self, sub_code: str, message: str, status_code: int = 400):
        self.sub_code = sub_code
        self.message = message
        self.status_code = status_code
        super().__init__(f"{sub_code}- {message}")
        logger.debug(message)


class TaskAssignmentService:
    @staticmethod
    async def _assert_project_manager(project_id: int, user_id: int, db: Database):
        if not await ProjectAdminService.is_user_action_permitted_on_project(
            user_id, project_id, db
        ):
            raise TaskAssignmentServiceError(
                "UserPermissionError", "User is not a manager of the project", 403
            )

    @staticmethod
    async def _get_tasks(project_id: int, task_ids: List[int], db: Database) -> list:
        """Fetch the requested tasks, failing if any of them is not on the project"""
        rows = await db.fetch_all(
            """
            SELECT id, task_status, mapped_by
            FROM tasks
            WHERE project_id = :project_id AND id = ANY(CAST(:task_ids AS integer[]))
            """,
            values={"project_id": project_id, "task_ids": list(task_ids)},
        )
        missing = set(task_ids) - {row["id"] for row in rows}
        if missing:
            raise NotFound(
                sub_code="TASK_NOT_FOUND",
                project_id=project_id,
                task_ids=sorted(missing)[:20],
            )
        return rows

    @staticmethod
    def _stage_permission(project, stage: TaskAssignmentStage):
        """(is the stage restricted to project teams, required mapping level id)"""
        if stage == TaskAssignmentStage.MAPPING:
            return (
                project.mapping_permission == MappingPermission.TEAMS.value,
                project.mapping_permission_level_id,
            )
        return (
            project.validation_permission == ValidationPermission.TEAMS.value,
            project.validation_permission_level_id,
        )

    @staticmethod
    async def _check_user_assignee(
        project, user_id: int, stage: TaskAssignmentStage, tasks: list, db: Database
    ) -> List[AssignmentWarningDTO]:
        """
        Reject users who could never lock these tasks for this stage; warn about problems
        that may resolve themselves. Assignment never grants permissions.
        """
        user = await UserService.get_user_by_id(user_id, db)
        if UserRole(user.role) == UserRole.READ_ONLY:
            raise TaskAssignmentServiceError(
                "UserBlocked", f"{user.username} is blocked and can't be assigned tasks"
            )

        # Project managers can map and validate regardless of project restrictions.
        if await ProjectAdminService.is_user_action_permitted_on_project(
            user_id, project.id, db
        ):
            return []

        stage_word = "map" if stage == TaskAssignmentStage.MAPPING else "validate"
        teams_only, level_id = TaskAssignmentService._stage_permission(project, stage)
        if teams_only or project.private:
            on_project_team = await TeamService.check_team_membership(
                project.id, STAGE_TEAM_ROLES[stage], user_id, db
            )
            if teams_only and not on_project_team:
                raise TaskAssignmentServiceError(
                    "AssigneeNotPermitted",
                    f"{user.username} isn't on a project team allowed to {stage_word}. "
                    "Add them to one of the project's teams first.",
                )
            if (
                project.private
                and not on_project_team
                and not await ProjectService.is_user_in_the_allowed_list(
                    project.id, user_id, db
                )
            ):
                raise TaskAssignmentServiceError(
                    "AssigneeNotPermitted",
                    f"{user.username} doesn't have access to this private project. "
                    "Add them to the allowed users or to a project team first.",
                )

        warnings = []
        required_level = await MappingLevel.get_by_id(level_id, db)
        user_level = await MappingLevel.get_by_id(user.mapping_level, db)
        if (
            required_level
            and user_level
            and user_level.ordering < required_level.ordering
        ):
            warnings.append(
                AssignmentWarningDTO(
                    sub_code="AssigneeMappingLevelTooLow",
                    message=(
                        f"{user.username} is below the mapping level this project "
                        f"requires to {stage_word}, so they can't lock these tasks yet."
                    ),
                )
            )

        if stage == TaskAssignmentStage.VALIDATION:
            own_tasks = sorted(t["id"] for t in tasks if t["mapped_by"] == user_id)
            if own_tasks:
                warnings.append(
                    AssignmentWarningDTO(
                        sub_code="AssigneeIsMapper",
                        message=(
                            f"{user.username} mapped task(s) "
                            f"{', '.join(map(str, own_tasks[:20]))}"
                            f"{' and more' if len(own_tasks) > 20 else ''} "
                            "and can't validate their own work."
                        ),
                    )
                )
        return warnings

    @staticmethod
    async def _check_team_assignee(
        project, team_id: int, stage: TaskAssignmentStage, db: Database
    ):
        """On team-restricted or private projects the team must be on the project."""
        team = await TeamService.get_team_by_id(team_id, db)
        teams_only, _ = TaskAssignmentService._stage_permission(project, stage)
        if not (teams_only or project.private):
            return
        rows = await db.fetch_all(
            """
            SELECT role FROM project_teams
            WHERE project_id = :project_id AND team_id = :team_id
            """,
            values={"project_id": project.id, "team_id": team_id},
        )
        if not any(row["role"] in STAGE_TEAM_ROLES[stage] for row in rows):
            stage_word = "map" if stage == TaskAssignmentStage.MAPPING else "validate"
            raise TaskAssignmentServiceError(
                "TeamNotOnProject",
                f"Team {team.name} isn't on this project with a role allowed to "
                f"{stage_word}. Add the team to the project first.",
            )

    @staticmethod
    async def assign_tasks(
        project_id: int, assign_dto: AssignTasksDTO, assigner_id: int, db: Database
    ) -> AssignTasksResultDTO:
        """Assign (or reassign) tasks for one stage to a user or a team"""
        await TaskAssignmentService._assert_project_manager(project_id, assigner_id, db)
        project = await ProjectService.get_project_by_id(project_id, db)
        stage = TaskAssignmentStage[assign_dto.stage]
        tasks = await TaskAssignmentService._get_tasks(
            project_id, assign_dto.task_ids, db
        )

        if assign_dto.user_id is not None:
            warnings = await TaskAssignmentService._check_user_assignee(
                project, assign_dto.user_id, stage, tasks, db
            )
        else:
            await TaskAssignmentService._check_team_assignee(
                project, assign_dto.team_id, stage, db
            )
            warnings = []

        assigned = await TaskAssignment.upsert_many(
            project_id,
            assign_dto.task_ids,
            stage,
            assign_dto.user_id,
            assign_dto.team_id,
            assigner_id,
            db,
        )
        return AssignTasksResultDTO(assigned=assigned, warnings=warnings)

    @staticmethod
    async def unassign_tasks(
        project_id: int, unassign_dto: UnassignTasksDTO, user_id: int, db: Database
    ) -> int:
        """Remove assignments; both stages when no stage is given"""
        await TaskAssignmentService._assert_project_manager(project_id, user_id, db)
        await ProjectService.get_project_by_id(project_id, db)
        stage = TaskAssignmentStage[unassign_dto.stage] if unassign_dto.stage else None
        return await TaskAssignment.delete_many(
            project_id, unassign_dto.task_ids, stage, db
        )

    @staticmethod
    async def get_project_assignments(
        project_id: int, db: Database
    ) -> ProjectTaskAssignmentsDTO:
        rows = await TaskAssignment.get_for_project(project_id, db)
        return ProjectTaskAssignmentsDTO(
            assignments=[
                TaskAssignmentDTO(
                    task_id=row["task_id"],
                    stage=TaskAssignmentStage(row["stage"]).name,
                    assignee_type=(
                        TaskAssigneeType.USER.name
                        if row["assignee_user_id"] is not None
                        else TaskAssigneeType.TEAM.name
                    ),
                    user_id=row["assignee_user_id"],
                    username=row["assignee_username"],
                    team_id=row["assignee_team_id"],
                    team_name=row["assignee_team_name"],
                    assigned_by=row["assigned_by_username"],
                    assigned_date=row["assigned_date"],
                )
                for row in rows
            ]
        )

    @staticmethod
    async def get_assigned_tasks_for_user(
        user_id: int,
        db: Database,
        project_id: Optional[int] = None,
        stage: Optional[str] = None,
        pending_only: bool = True,
        page: int = 1,
        per_page: int = 20,
        preferred_locale: str = "en",
    ) -> AssignedTasksDTO:
        stage_enum = None
        if stage:
            if stage.upper() not in TaskAssignmentStage.__members__:
                raise TaskAssignmentServiceError(
                    "InvalidData", "stage must be MAPPING or VALIDATION"
                )
            stage_enum = TaskAssignmentStage[stage.upper()]
        page = max(page, 1)
        per_page = min(max(per_page, 1), 100)

        rows, total = await TaskAssignment.get_assigned_to_user(
            user_id,
            db,
            project_id=project_id,
            stage=stage_enum,
            pending_only=pending_only,
            page=page,
            per_page=per_page,
            preferred_locale=preferred_locale,
        )
        return AssignedTasksDTO(
            tasks=[
                AssignedTaskDTO(
                    project_id=row["project_id"],
                    project_name=row["project_name"],
                    task_id=row["task_id"],
                    task_status=TaskStatus(row["task_status"]).name,
                    stage=TaskAssignmentStage(row["stage"]).name,
                    assignee_type=(
                        TaskAssigneeType.USER.name
                        if row["assignee_user_id"] is not None
                        else TaskAssigneeType.TEAM.name
                    ),
                    team_id=row["assignee_team_id"],
                    team_name=row["assignee_team_name"],
                    assigned_by=row["assigned_by_username"],
                    assigned_date=row["assigned_date"],
                )
                for row in rows
            ],
            pagination=Pagination.from_total_count(
                page=page, per_page=per_page, total=total or 0
            ),
        )

    @staticmethod
    async def user_may_lock(
        project_id: int,
        task_id: int,
        user_id: int,
        stage: TaskAssignmentStage,
        db: Database,
    ) -> bool:
        """
        Whether a task's assignment lets this user lock it for the given stage.

        Only restricts anything when the project enforces assignment and the task has an
        assignment for this stage. The normal mapping/validation permission checks still
        apply on top of this; an assignment never grants permission.
        """
        assignment = await TaskAssignment.get_for_task_stage(
            project_id, task_id, stage, db
        )
        if assignment is None or not assignment["enforce_task_assignment"]:
            return True
        if assignment["assignee_user_id"] == user_id:
            return True
        if assignment[
            "assignee_team_id"
        ] is not None and await TeamService.is_user_an_active_team_member(
            assignment["assignee_team_id"], user_id, db
        ):
            return True
        return await ProjectAdminService.is_user_action_permitted_on_project(
            user_id, project_id, db
        )
