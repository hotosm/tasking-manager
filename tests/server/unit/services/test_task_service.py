import unittest
from server.services.task_service import TaskService, Task, TaskServiceError
from unittest.mock import patch, MagicMock
from server.services.project_service import ProjectService, InvalidGeoJson, Project


class TestProject(unittest.TestCase):

    @patch.object(Task, 'get')
    def test_task_not_found_returns_none_when_setting_lock(self, mock_task):
        # Arrange
        mock_task.return_value = None

        # Act
        test_task = TaskService.set_locked_status(1, 1, True)

        # Assert
        self.assertIsNone(test_task)

    @patch.object(Task, 'get')
    def test_task_already_locked_raises_when_setting_lock(self, mock_task):
        # Arrange
        task_stub = Task()
        task_stub.task_locked = True

        mock_task.return_value = task_stub

        # Act / Assert
        with self.assertRaises(TaskServiceError):
            TaskService.set_locked_status(1, 1, True)

    @patch.object(Task, 'update')
    @patch.object(Task, 'get')
    def test_task_locked_status_set_when_valid(self, mock_task, mock_update):
        # Arrange
        task_stub = Task()
        task_stub.task_locked = False
        mock_task.return_value = task_stub

        # Act
        test_task = TaskService.set_locked_status(1, 1, True)

        # Assert
        self.assertTrue(test_task.task_locked, 'Locked should be set to True')

