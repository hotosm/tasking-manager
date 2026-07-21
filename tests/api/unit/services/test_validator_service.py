import pytest
from unittest.mock import MagicMock, patch
from backend.models.dtos.validator_dto import ValidatedTask
from backend.services.users.user_service import UserService
from backend.services.project_admin_service import ProjectAdminService
from backend.services.validator_service import (
    LockForValidationDTO,
    NotFound,
    ProjectService,
    Task,
    TaskStatus,
    UnlockAfterValidationDTO,
    UserLicenseError,
    ValidatingNotAllowed,
    ValidatorService,
    ValidatorServiceError,
)


@pytest.mark.anyio
class TestValidatorService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        assert db_connection_fixture is not None, "Database connection is not available"
        request.cls.db = db_connection_fixture

        self.unlock_task_stub = Task()
        self.unlock_task_stub.task_status = TaskStatus.MAPPED.value
        self.unlock_task_stub.lock_holder_id = 123456

    @patch.object(Task, "get")
    async def test_lock_tasks_for_validation_raises_error_if_task_not_found(
        self, mock_task
    ):
        # Arrange
        mock_task.return_value = None

        lock_dto = LockForValidationDTO(project_id=1, task_ids=[1, 2], user_id=123456)

        # Act / Assert
        with pytest.raises(NotFound):
            await ValidatorService.lock_tasks_for_validation(lock_dto, self.db)

    @patch.object(UserService, "is_user_blocked")
    @patch.object(Task, "get")
    async def test_lock_tasks_for_validation_raises_error_if_task_not_mapped(
        self, mock_task, mock_blocked
    ):
        # Arrange
        task_stub = Task()
        task_stub.task_status = TaskStatus.READY.value
        mock_task.return_value = task_stub
        mock_blocked.return_value = False

        lock_dto = LockForValidationDTO(project_id=1, task_ids=[1, 2], user_id=123456)

        # Act / Assert
        with pytest.raises(ValidatorServiceError):
            await ValidatorService.lock_tasks_for_validation(lock_dto, self.db)

    @patch.object(UserService, "is_user_an_admin")
    @patch.object(Task, "get")
    @patch.object(ProjectService, "is_user_permitted_to_validate")
    async def test_lock_tasks_raises_error_if_project_validator_only_and_user_not_validator(
        self, mock_project, mock_task, mock_user
    ):
        # Arrange
        task_stub = Task()
        task_stub.task_status = TaskStatus.MAPPED.value
        mock_task.return_value = task_stub
        mock_project.return_value = (False, ValidatingNotAllowed.USER_NOT_VALIDATOR)
        mock_user.return_value = True

        lock_dto = LockForValidationDTO(project_id=1, task_ids=[1, 2], user_id=1234)

        # Act / Assert
        with pytest.raises(ValidatorServiceError):
            await ValidatorService.lock_tasks_for_validation(lock_dto, self.db)

    @patch.object(UserService, "is_user_an_admin")
    @patch.object(Task, "get")
    @patch.object(ProjectService, "is_user_permitted_to_validate")
    async def test_lock_tasks_raises_error_if_user_has_not_accepted_license(
        self, mock_project, mock_task, mock_user
    ):
        # Arrange
        task_stub = Task()
        task_stub.task_status = TaskStatus.MAPPED.value
        mock_task.return_value = task_stub
        mock_project.return_value = (
            False,
            ValidatingNotAllowed.USER_NOT_ACCEPTED_LICENSE,
        )
        mock_user.return_value = True

        lock_dto = LockForValidationDTO(project_id=1, task_ids=[1, 2], user_id=1234)

        # Act / Assert
        with pytest.raises(UserLicenseError):
            await ValidatorService.lock_tasks_for_validation(lock_dto, self.db)

    @patch.object(Task, "get")
    async def test_unlock_tasks_for_validation_raises_error_if_task_not_found(
        self, mock_task
    ):
        # Arrange
        mock_task.return_value = None

        validated_task = ValidatedTask(task_id=1)
        validated_tasks = [validated_task]

        unlock_dto = UnlockAfterValidationDTO(
            project_id=1, validated_tasks=validated_tasks, user_id=123456
        )

        # Act / Assert
        with pytest.raises(NotFound):
            await ValidatorService.unlock_tasks_after_validation(
                unlock_dto, self.db, MagicMock()
            )

    @patch.object(Task, "get")
    async def test_unlock_tasks_for_validation_raises_error_if_task_not_done_or_validated(
        self, mock_task
    ):
        # Arrange
        self.unlock_task_stub.task_status = TaskStatus.READY.value
        mock_task.return_value = self.unlock_task_stub

        validated_task = ValidatedTask()
        validated_task.task_id = 1
        validated_tasks = [validated_task]

        unlock_dto = UnlockAfterValidationDTO(
            project_id=1, validated_tasks=validated_tasks, user_id=123456
        )

        # Act / Assert
        with pytest.raises(ValidatorServiceError):
            await ValidatorService.unlock_tasks_after_validation(
                unlock_dto, self.db, MagicMock()
            )

    @patch.object(Task, "get")
    async def test_unlock_tasks_for_validation_raises_error_if_task_not_locked(
        self, mock_task
    ):
        # Arrange
        self.unlock_task_stub.task_locked = False  # Assuming this attribute exists
        mock_task.return_value = self.unlock_task_stub

        validated_task = ValidatedTask()
        validated_task.task_id = 1
        validated_tasks = [validated_task]

        unlock_dto = UnlockAfterValidationDTO(
            project_id=1, validated_tasks=validated_tasks, user_id=123456
        )

        # Act / Assert
        with pytest.raises(ValidatorServiceError):
            await ValidatorService.unlock_tasks_after_validation(
                unlock_dto, self.db, MagicMock()
            )

    @patch.object(Task, "get")
    async def test_unlock_tasks_for_validation_raises_error_if_user_doesnt_own_the_lock(
        self, mock_task
    ):
        # Arrange
        mock_task.return_value = self.unlock_task_stub

        validated_task = ValidatedTask()
        validated_task.task_id = 1
        validated_tasks = [validated_task]

        # Different from lock_holder_id (123456)
        unlock_dto = UnlockAfterValidationDTO(
            project_id=1, validated_tasks=validated_tasks, user_id=12
        )

        # Act / Assert
        with pytest.raises(ValidatorServiceError):
            await ValidatorService.unlock_tasks_after_validation(
                unlock_dto, self.db, MagicMock()
            )

    @patch.object(UserService, "is_user_an_admin")
    async def test_user_can_validate_task_returns_false_when_user_not_a_pm_and_validating_own_task(
        self, mock_user
    ):
        # Arrange
        mock_user.return_value = False
        user_id = 1234
        mapped_by = 1234

        # Act
        user_can_validate_task = await ValidatorService._user_can_validate_task(
            user_id, mapped_by, self.db
        )

        # Assert
        assert not user_can_validate_task

    @patch.object(UserService, "is_user_an_admin")
    async def test_user_can_validate_task_returns_true_when_user_not_a_pm_and_not_validating_own_task(
        self, mock_user
    ):
        # Arrange
        mock_user.return_value = False
        user_id = 5678
        mapped_by = 1234

        # Act
        user_can_validate_task = await ValidatorService._user_can_validate_task(
            user_id, mapped_by, self.db
        )

        # Assert
        assert user_can_validate_task

    async def test_get_mapped_tasks_by_user_returns_correct_aggregation(self):
        """Valida la agrupación de tareas mapeadas por usuario en un proyecto."""
        from tests.api.helpers.test_helpers import create_canned_project
        proj, user, project_id = await create_canned_project(self.db)
        await self.db.execute(
            "UPDATE tasks SET mapped_by = :user_id WHERE project_id = :project_id AND id = :task_id",
            {"user_id": user.id, "project_id": project_id, "task_id": 1},
        )
        await self.db.execute(
            """
            INSERT INTO task_history (project_id, task_id, action, action_text, action_date, user_id)
            VALUES (:project_id, :task_id, :action, :action_text, current_timestamp, :user_id)
            """,
            {
                "project_id": project_id,
                "task_id": 1,
                "action": "STATE_CHANGE",
                "action_text": "MAPPED",
                "user_id": user.id,
            },
        )
        
        # En create_canned_project la tarea 1 está MAPPED (2) por el usuario de prueba
        result = await ValidatorService.get_mapped_tasks_by_user(project_id, self.db)
        
        assert len(result.mapped_tasks) > 0
        assert result.mapped_tasks[0].username == user.username
        assert 1 in result.mapped_tasks[0].tasks_mapped

    async def test_invalidate_all_tasks_updates_states_and_counters(self):
        """Valida la invalidación masiva de todas las tareas validadas del proyecto."""
        from tests.api.helpers.test_helpers import create_canned_project
        proj, user, project_id = await create_canned_project(self.db)
        
        # En el canned project la tarea 4 está VALIDATED.
        await ValidatorService.invalidate_all_tasks(project_id, user.id, self.db)
        
        # Verificar estado de la tarea 4 (debe ser INVALIDATED = 5)
        task = await Task.get(4, project_id, self.db)
        assert task["task_status"] == 5
        # Verificar contador del proyecto
        count = await self.db.fetch_val("SELECT tasks_validated FROM projects WHERE id = :id", {"id": project_id})
        assert count == 0

    async def test_validate_all_tasks_updates_states_and_counters(self):
        """Valida la validación masiva de todas las tareas mapeadas del proyecto."""
        from tests.api.helpers.test_helpers import create_canned_project
        proj, user, project_id = await create_canned_project(self.db)
        
        # En el canned project la tarea 1 está MAPPED.
        await ValidatorService.validate_all_tasks(project_id, user.id, self.db)
        
        # Verificar estado de la tarea 1 (debe ser VALIDATED = 4)
        task = await Task.get(1, project_id, self.db)
        assert task["task_status"] == 4
        # Verificar que el contador de mapeadas bajó a 0
        count = await self.db.fetch_val("SELECT tasks_mapped FROM projects WHERE id = :id", {"id": project_id})
        assert count == 0

    @patch.object(ProjectAdminService, "is_user_action_permitted_on_project")
    async def test_revert_user_tasks_checks_permissions(self, mock_permitted):
        """Valida que la reversión de tareas verifique permisos de administrador/autor."""
        from backend.models.dtos.validator_dto import RevertUserTasksDTO
        mock_permitted.return_value = False
        
        dto = RevertUserTasksDTO(project_id=1, user_id=123, action_by=456, action="VALIDATED")
        
        with pytest.raises(ValidatorServiceError, match="UserActionNotPermitted"):
            await ValidatorService.revert_user_tasks(dto, self.db)

    async def test_get_task_mapping_issues_filters_zero_counts(self):
        """Valida que solo se mapeen problemas de mapeo con conteos mayores a cero."""
        from backend.models.dtos.validator_dto import ValidationMappingIssue
        issues_dto = [
            ValidationMappingIssue(mappingIssueCategoryId=1, issue="Problem", count=5),
            ValidationMappingIssue(mappingIssueCategoryId=2, issue="None", count=0)
        ]
        task_data = {"issues": issues_dto}
        
        result = await ValidatorService.get_task_mapping_issues(task_data)
        
        assert len(result) == 1
        assert result[0].count == 5
