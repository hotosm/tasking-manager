from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from backend.models.postgis.mapping_level import MappingLevel
from backend.models.postgis.statuses import (
    MappingNotAllowed,
    MappingPermission,
    ProjectStatus,
    ValidatingNotAllowed,
    ValidationPermission,
)
from backend.models.postgis.task import Task
from backend.services.project_admin_service import ProjectAdminService
from backend.services.project_service import ProjectService
from backend.services.team_service import TeamService
from backend.services.users.user_service import UserService
from tests.api.helpers.test_helpers import (
    create_canned_project,
    create_canned_user,
    return_canned_user,
)


@pytest.mark.anyio
class TestProjectServicePermissionsCoverage:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # Proyecto real en BD para ejecutar reglas reales del servicio.
        self.test_project, self.project_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        # Usuario normal usado para validar permisos de mapeo y validación.
        test_user = await return_canned_user(
            username="coverage_permission_user",
            id=44444444,
            db=self.db,
        )
        self.test_user = await create_canned_user(self.db, test_user)

    async def test_mapping_and_validation_permission_branches(self):
        # Cubre varias ramas grandes de ProjectService con un solo test:
        # usuario bloqueado, proyecto draft, equipo requerido, nivel insuficiente,
        # tarea bloqueada y manager permitido.

        with patch.object(
            UserService,
            "is_user_blocked",
            new_callable=AsyncMock,
        ) as mock_is_user_blocked, patch.object(
            ProjectAdminService,
            "is_user_action_permitted_on_project",
            new_callable=AsyncMock,
        ) as mock_is_manager, patch.object(
            TeamService,
            "check_team_membership",
            new_callable=AsyncMock,
        ) as mock_check_team_membership, patch.object(
            MappingLevel,
            "get_by_id",
            new_callable=AsyncMock,
        ) as mock_get_required_mapping_level, patch.object(
            UserService,
            "get_mapping_level",
            new_callable=AsyncMock,
        ) as mock_get_user_mapping_level, patch.object(
            Task,
            "get_locked_tasks_for_user",
            new_callable=AsyncMock,
        ) as mock_get_locked_tasks:

            # 1. Usuario bloqueado: no puede mapear ni validar.
            mock_is_user_blocked.return_value = True

            map_allowed, map_reason = await ProjectService.is_user_permitted_to_map(
                self.test_project_id,
                self.test_user.id,
                self.db,
            )

            validate_allowed, validate_reason = (
                await ProjectService.is_user_permitted_to_validate(
                    self.test_project_id,
                    self.test_user.id,
                    self.db,
                )
            )

            assert map_allowed is False
            assert map_reason == MappingNotAllowed.USER_NOT_ON_ALLOWED_LIST
            assert validate_allowed is False
            assert validate_reason == ValidatingNotAllowed.USER_NOT_ON_ALLOWED_LIST

            # 2. Proyecto draft: usuario sin permisos no puede mapear ni validar.
            mock_is_user_blocked.return_value = False
            mock_is_manager.return_value = False

            map_allowed, map_reason = await ProjectService.is_user_permitted_to_map(
                self.test_project_id,
                self.test_user.id,
                self.db,
            )

            validate_allowed, validate_reason = (
                await ProjectService.is_user_permitted_to_validate(
                    self.test_project_id,
                    self.test_user.id,
                    self.db,
                )
            )

            assert map_allowed is False
            assert map_reason == MappingNotAllowed.PROJECT_NOT_PUBLISHED
            assert validate_allowed is False
            assert validate_reason == ValidatingNotAllowed.PROJECT_NOT_PUBLISHED

            # 3. Proyecto publicado con permisos por equipo: usuario fuera del equipo.
            await self.db.execute(
                """
                UPDATE projects
                SET status = :status,
                    mapping_permission = :mapping_permission,
                    validation_permission = :validation_permission
                WHERE id = :id
                """,
                {
                    "status": ProjectStatus.PUBLISHED.value,
                    "mapping_permission": MappingPermission.TEAMS.value,
                    "validation_permission": ValidationPermission.TEAMS.value,
                    "id": int(self.test_project_id),
                },
            )

            mock_check_team_membership.return_value = False

            map_allowed, map_reason = await ProjectService.is_user_permitted_to_map(
                self.test_project_id,
                self.test_user.id,
                self.db,
            )

            validate_allowed, validate_reason = (
                await ProjectService.is_user_permitted_to_validate(
                    self.test_project_id,
                    self.test_user.id,
                    self.db,
                )
            )

            assert map_allowed is False
            assert map_reason == MappingNotAllowed.USER_NOT_TEAM_MEMBER
            assert validate_allowed is False
            assert validate_reason == ValidatingNotAllowed.USER_NOT_TEAM_MEMBER

            # 4. Proyecto publicado con nivel mínimo: usuario no alcanza el nivel.
            await self.db.execute(
                """
                UPDATE projects
                SET status = :status,
                    mapping_permission = :mapping_permission,
                    validation_permission = :validation_permission,
                    mapping_permission_level_id = :mapping_level_id,
                    validation_permission_level_id = :validation_level_id
                WHERE id = :id
                """,
                {
                    "status": ProjectStatus.PUBLISHED.value,
                    "mapping_permission": MappingPermission.ANY.value,
                    "validation_permission": ValidationPermission.ANY.value,
                    "mapping_level_id": 2,
                    "validation_level_id": 2,
                    "id": int(self.test_project_id),
                },
            )

            mock_get_required_mapping_level.return_value = SimpleNamespace(ordering=2)
            mock_get_user_mapping_level.return_value = SimpleNamespace(ordering=1)

            map_allowed, map_reason = await ProjectService.is_user_permitted_to_map(
                self.test_project_id,
                self.test_user.id,
                self.db,
            )

            validate_allowed, validate_reason = (
                await ProjectService.is_user_permitted_to_validate(
                    self.test_project_id,
                    self.test_user.id,
                    self.db,
                )
            )

            assert map_allowed is False
            assert map_reason == MappingNotAllowed.USER_NOT_CORRECT_MAPPING_LEVEL
            assert validate_allowed is False
            assert (
                validate_reason
                == ValidatingNotAllowed.USER_NOT_CORRECT_MAPPING_LEVEL
            )

            # 5. Manager con tarea bloqueada: no puede tomar otro trabajo.
            await self.db.execute(
                """
                UPDATE projects
                SET status = :status
                WHERE id = :id
                """,
                {
                    "status": ProjectStatus.PUBLISHED.value,
                    "id": int(self.test_project_id),
                },
            )

            mock_is_manager.return_value = True
            mock_get_locked_tasks.return_value = SimpleNamespace(locked_tasks=[1])

            map_allowed, map_reason = await ProjectService.is_user_permitted_to_map(
                self.test_project_id,
                self.test_user.id,
                self.db,
            )

            validate_allowed, validate_reason = (
                await ProjectService.is_user_permitted_to_validate(
                    self.test_project_id,
                    self.test_user.id,
                    self.db,
                )
            )

            assert map_allowed is False
            assert map_reason == MappingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED
            assert validate_allowed is False
            assert validate_reason == ValidatingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED

            # 6. Manager sin tarea bloqueada: puede mapear y validar.
            mock_get_locked_tasks.return_value = SimpleNamespace(locked_tasks=[])

            map_allowed, map_reason = await ProjectService.is_user_permitted_to_map(
                self.test_project_id,
                self.test_user.id,
                self.db,
            )

            validate_allowed, validate_reason = (
                await ProjectService.is_user_permitted_to_validate(
                    self.test_project_id,
                    self.test_user.id,
                    self.db,
                )
            )

            assert map_allowed is True
            assert map_reason == "User allowed to map"
            assert validate_allowed is True
            assert validate_reason == "User allowed to validate"