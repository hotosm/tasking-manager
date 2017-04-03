import unittest
from server.services.validator_service import ValidatorService, Task, NotFound, LockForValidationDTO, TaskStatus, \
    ValidatatorServiceError, UnlockAfterValidationDTO, ProjectService
from server.models.dtos.validator_dto import ValidatedTask
from unittest.mock import patch, MagicMock
from server import create_app


class TestValidatorService(unittest.TestCase):
    task_stub = Task
    validator_service = None

    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        self.task_stub = Task()
        self.id = 1234
        self.task_stub.task_status = TaskStatus.DONE.value
        self.task_stub.task_locked = False
        self.task_stub.lock_holder_id = 123456

    def tearDown(self):
        self.ctx.pop()

    @patch.object(Task, 'get')
    def set_up_service(self, mock_task, stub_task):
        """ Helper that sets ups the mapping service with the supplied task test stub"""
        mock_task.return_value = stub_task
        self.validator_service = ValidatorService([1], 1)

    def test_validator_service_raises_error_if_task_not_found(self):
        with self.assertRaises(NotFound):
            self.set_up_service(stub_task=None)

    def test_lock_tasks_for_validation_raises_error_if_task_not_done(self):
        # Arrange
        self.task_stub.task_status = TaskStatus.READY.value
        self.set_up_service(stub_task=self.task_stub)

        lock_dto = LockForValidationDTO()

        # Act / Assert
        with self.assertRaises(ValidatatorServiceError):
            self.validator_service.lock_tasks_for_validation(lock_dto)

    def test_lock_tasks_for_validation_raises_error_if_task_already_locked(self):
        # Arrange
        self.task_stub.task_locked = True
        self.set_up_service(stub_task=self.task_stub)

        lock_dto = LockForValidationDTO()

        # Act / Assert
        with self.assertRaises(ValidatatorServiceError):
            self.validator_service.lock_tasks_for_validation(lock_dto)

    @patch.object(ProjectService, 'is_user_permitted_to_validate')
    def test_lock_tasks_raises_error_if_user_not_permitted_to_validate(self, mock_project):
        # Arrange
        self.set_up_service(stub_task=self.task_stub)
        mock_project.return_value = False, 'Not allowed'

        lock_dto = LockForValidationDTO()
        lock_dto.user_id = 123

        # Act / Assert
        with self.assertRaises(ValidatatorServiceError):
            self.validator_service.lock_tasks_for_validation(lock_dto)

    def test_unlock_tasks_for_validation_raises_error_if_task_not_done_or_validated(self):
        # Arrange
        self.task_stub.task_status = TaskStatus.READY.value
        self.set_up_service(stub_task=self.task_stub)

        validated_task = ValidatedTask()
        validated_task.task_id = 1
        validated_tasks = [validated_task]

        unlock_dto = UnlockAfterValidationDTO()
        unlock_dto.project_id = 1
        unlock_dto.validated_tasks = validated_tasks

        # Act / Assert
        with self.assertRaises(ValidatatorServiceError):
            self.validator_service.unlock_tasks_after_validation(unlock_dto)

    def test_unlock_tasks_for_validation_raises_error_if_task_not_locked(self):
        # Arrange
        self.task_stub.task_locked = False
        self.set_up_service(stub_task=self.task_stub)

        validated_task = ValidatedTask()
        validated_task.task_id = 1
        validated_tasks = [validated_task]

        unlock_dto = UnlockAfterValidationDTO()
        unlock_dto.project_id = 1
        unlock_dto.validated_tasks = validated_tasks

        # Act / Assert
        with self.assertRaises(ValidatatorServiceError):
            self.validator_service.unlock_tasks_after_validation(unlock_dto)

    def test_unlock_tasks_for_validation_raises_error_if_user_doesnt_own_the_lock(self):
        # Arrange
        self.task_stub.task_locked = True
        self.set_up_service(stub_task=self.task_stub)

        validated_task = ValidatedTask()
        validated_task.task_id = 1
        validated_tasks = [validated_task]

        unlock_dto = UnlockAfterValidationDTO()
        unlock_dto.project_id = 1
        unlock_dto.validated_tasks = validated_tasks
        unlock_dto.user_id = 12

        # Act / Assert
        with self.assertRaises(ValidatatorServiceError):
            self.validator_service.unlock_tasks_after_validation(unlock_dto)
