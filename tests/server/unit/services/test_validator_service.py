import unittest
from server.services.validator_service import ValidatorService, Task, TaskNotFound, LockForValidationDTO, TaskStatus, \
    ValidatatorServiceError, UnlockAfterValidationDTO, Project, UserService
from server.models.dtos.validator_dto import ValidatedTask
from unittest.mock import patch, MagicMock
from server import create_app


class TestValidatorService(unittest.TestCase):
    unlock_task_stub = Task

    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        self.unlock_task_stub = Task()
        self.unlock_task_stub.task_status = TaskStatus.DONE.value
        self.unlock_task_stub.task_locked = True
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
        with self.assertRaises(TaskNotFound):
            ValidatorService().lock_tasks_for_validation(lock_dto)

    @patch.object(Task, 'get')
    def test_lock_tasks_for_validation_raises_error_if_task_not_done(self, mock_task):
        # Arrange
        task_stub = Task()
        task_stub.task_status = TaskStatus.READY.value
        mock_task.return_value = task_stub

        lock_dto = LockForValidationDTO()
        lock_dto.project_id = 1
        lock_dto.task_ids = [1, 2]

        # Act / Assert
        with self.assertRaises(ValidatatorServiceError):
            ValidatorService().lock_tasks_for_validation(lock_dto)

    @patch.object(Task, 'get')
    def test_lock_tasks_for_validation_raises_error_if_task_already_locked(self, mock_task):
        # Arrange
        task_stub = Task()
        task_stub.task_status = TaskStatus.DONE.value
        task_stub.task_locked = True
        mock_task.return_value = task_stub

        lock_dto = LockForValidationDTO()
        lock_dto.project_id = 1
        lock_dto.task_ids = [1, 2]

        # Act / Assert
        with self.assertRaises(ValidatatorServiceError):
            ValidatorService().lock_tasks_for_validation(lock_dto)

    @patch.object(UserService, 'is_user_validator')
    @patch.object(Project, 'get')
    def test_lock_tasks_raises_error_if_project_validator_only_and_user_not_validator(self, mock_project, mock_user):
        stub_project = Project()
        stub_project.enforce_validator_role = True
        mock_project.return_value = stub_project

        mock_user.return_value = False

        with self.assertRaises(ValidatatorServiceError):
            ValidatorService()._validate_user_permissions(MagicMock())

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
        with self.assertRaises(TaskNotFound):
            ValidatorService().unlock_tasks_after_validation(unlock_dto)

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
            ValidatorService().unlock_tasks_after_validation(unlock_dto)

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
            ValidatorService().unlock_tasks_after_validation(unlock_dto)

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
            ValidatorService().unlock_tasks_after_validation(unlock_dto)
