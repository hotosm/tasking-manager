import unittest
from server.services.validator_service import ValidatorService, Task, NotFound, LockForValidationDTO, TaskStatus, \
    ValidatatorServiceError, UnlockAfterValidationDTO, ProjectService, ValidatingNotAllowed, UserLicenseError
from server.models.dtos.validator_dto import ValidatedTask
from unittest.mock import patch
from server import create_app
from server.services.user_service import UserService
from server.models.dtos.mapping_dto import TaskDTOs


class TestValidatorService(unittest.TestCase):
    unlock_task_stub = Task

    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        self.unlock_task_stub = Task()
        self.unlock_task_stub.task_status = TaskStatus.MAPPED.value
        self.unlock_task_stub.lock_holder_id = 123456

    def tearDown(self):
        self.ctx.pop()

    @patch.object(Task, 'get')
    def test_lock_tasks_for_validation_raises_error_if_task_not_found(self, mock_task):
        # Arrange
        mock_task.return_value = None

        lock_dto = LockForValidationDTO()
        lock_dto.project_id = 1
        lock_dto.task_ids = [1, 2]

        # Act / Assert
        with self.assertRaises(NotFound):
            ValidatorService.lock_tasks_for_validation(lock_dto)

    @patch.object(Task, 'get')
    def test_lock_tasks_for_validation_raises_error_if_task_not_mapped(self, mock_task):
        # Arrange
        task_stub = Task()
        task_stub.task_status = TaskStatus.READY.value
        mock_task.return_value = task_stub

        lock_dto = LockForValidationDTO()
        lock_dto.project_id = 1
        lock_dto.task_ids = [1, 2]

        # Act / Assert
        with self.assertRaises(ValidatatorServiceError):
            ValidatorService.lock_tasks_for_validation(lock_dto)

    @patch.object(UserService, 'is_user_a_project_manager')
    @patch.object(Task, 'get')
    @patch.object(ProjectService, 'is_user_permitted_to_validate')
    def test_lock_tasks_raises_error_if_project_validator_only_and_user_not_validator(self, mock_project, mock_task, mock_user):
        # Arrange
        task_stub = Task()
        task_stub.task_status = TaskStatus.MAPPED.value
        mock_task.return_value = task_stub
        mock_project.return_value = False, ValidatingNotAllowed.USER_NOT_VALIDATOR
        mock_user.return_value = True

        lock_dto = LockForValidationDTO()
        lock_dto.project_id = 1
        lock_dto.task_ids = [1, 2]
        lock_dto.user_id = 1234

        with self.assertRaises(ValidatatorServiceError):
            ValidatorService.lock_tasks_for_validation(lock_dto)

    @patch.object(UserService, 'is_user_a_project_manager')
    @patch.object(Task, 'get')
    @patch.object(ProjectService, 'is_user_permitted_to_validate')
    def test_lock_tasks_raises_error_if_user_has_not_accepted_license(self, mock_project, mock_task, mock_user):
        # Arrange
        task_stub = Task()
        task_stub.task_status = TaskStatus.MAPPED.value
        mock_task.return_value = task_stub

        mock_project.return_value = False, ValidatingNotAllowed.USER_NOT_ACCEPTED_LICENSE
        mock_user.return_value = True

        lock_dto = LockForValidationDTO()
        lock_dto.project_id = 1
        lock_dto.task_ids = [1, 2]

        with self.assertRaises(UserLicenseError):
            ValidatorService.lock_tasks_for_validation(lock_dto)

    @patch.object(Task, 'get')
    def test_unlock_tasks_for_validation_raises_error_if_task_not_found(self, mock_task):
        # Arrange
        mock_task.return_value = None

        validated_task = ValidatedTask()
        validated_task.task_id = 1
        validated_tasks = [validated_task]

        unlock_dto = UnlockAfterValidationDTO()
        unlock_dto.project_id = 1
        unlock_dto.validated_tasks = validated_tasks

        # Act / Assert
        with self.assertRaises(NotFound):
            ValidatorService.unlock_tasks_after_validation(unlock_dto)

    @patch.object(Task, 'get')
    def test_unlock_tasks_for_validation_raises_error_if_task_not_done_or_validated(self, mock_task):
        # Arrange
        self.unlock_task_stub.task_status = TaskStatus.READY.value
        mock_task.return_value = self.unlock_task_stub

        validated_task = ValidatedTask()
        validated_task.task_id = 1
        validated_tasks = [validated_task]

        unlock_dto = UnlockAfterValidationDTO()
        unlock_dto.project_id = 1
        unlock_dto.validated_tasks = validated_tasks

        # Act / Assert
        with self.assertRaises(ValidatatorServiceError):
            ValidatorService.unlock_tasks_after_validation(unlock_dto)

    @patch.object(Task, 'get')
    def test_unlock_tasks_for_validation_raises_error_if_task_not_locked(self, mock_task):
        # Arrange
        self.unlock_task_stub.task_locked = False
        mock_task.return_value = self.unlock_task_stub

        validated_task = ValidatedTask()
        validated_task.task_id = 1
        validated_tasks = [validated_task]

        unlock_dto = UnlockAfterValidationDTO()
        unlock_dto.project_id = 1
        unlock_dto.validated_tasks = validated_tasks

        # Act / Assert
        with self.assertRaises(ValidatatorServiceError):
            ValidatorService.unlock_tasks_after_validation(unlock_dto)

    @patch.object(Task, 'get')
    def test_unlock_tasks_for_validation_raises_error_if_user_doesnt_own_the_lock(self, mock_task):
        mock_task.return_value = self.unlock_task_stub

        validated_task = ValidatedTask()
        validated_task.task_id = 1
        validated_tasks = [validated_task]

        unlock_dto = UnlockAfterValidationDTO()
        unlock_dto.project_id = 1
        unlock_dto.validated_tasks = validated_tasks
        unlock_dto.user_id = 12

        # Act / Assert
        with self.assertRaises(ValidatatorServiceError):
            ValidatorService.unlock_tasks_after_validation(unlock_dto)

    @patch.object(UserService, 'is_user_a_project_manager')
    def test_user_can_validate_task_returns_false_when_user_not_a_pm_and_validating_own_task(self, mock_user):
        # Arrange
        mock_user.return_value = False
        user_id = 1234
        mapped_by = 1234

        # act
        user_can_validate_task = ValidatorService._user_can_validate_task(user_id, mapped_by)

        # assert
        self.assertFalse(user_can_validate_task)

    @patch.object(UserService, 'is_user_a_project_manager')
    def test_user_can_validate_task_returns_true_when_user_a_pm_and_validating_own_task(self, mock_user):
        # Arrange
        mock_user.return_value = True
        user_id = 1234
        mapped_by = 1234

        # act
        user_can_validate_task = ValidatorService._user_can_validate_task(user_id, mapped_by)

        # assert
        self.assertTrue(user_can_validate_task)

    @patch.object(UserService, 'is_user_a_project_manager')
    def test_user_can_validate_task_returns_true_when_user_a_pm_and_not_validating_own_task(self, mock_user):
        # Arrange
        mock_user.return_value = True
        user_id = 5678
        mapped_by = 1234

        # act
        user_can_validate_task = ValidatorService._user_can_validate_task(user_id, mapped_by)

        # assert
        self.assertTrue(user_can_validate_task)

    @patch.object(UserService, 'is_user_a_project_manager')
    def test_user_can_validate_task_returns_true_when_user_not_a_pm_and_not_validating_own_task(self, mock_user):
        # Arrange
        mock_user.return_value = False
        user_id = 5678
        mapped_by = 1234

        # act
        user_can_validate_task = ValidatorService._user_can_validate_task(user_id, mapped_by)

        # assert
        self.assertTrue(user_can_validate_task)

