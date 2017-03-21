import unittest
from server.services.validator_service import ValidatorService, Task, TaskNotFound, LockForValidationDTO
from unittest.mock import patch
from server import create_app


class TestValidatorService(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    @patch.object(Task, 'get')
    def test_get_project_dto_for_mapping_returns_none_if_project_not_found(self, mock_task):
        # Arrange
        mock_task.return_value = None

        lock_dto = LockForValidationDTO()
        lock_dto.project_id = 1
        lock_dto.task_ids = [1, 2]

        # Act / Assert
        with self.assertRaises(TaskNotFound):
            ValidatorService().lock_tasks_for_validation(lock_dto)