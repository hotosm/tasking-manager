import pytest
from unittest.mock import MagicMock, patch
from backend.models.dtos.validator_dto import ValidatedTask
from backend.services.users.user_service import UserService
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
