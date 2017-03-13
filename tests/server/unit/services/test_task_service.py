import unittest
from server.services.task_service import TaskService, Task, TaskServiceError, TaskStatus
from unittest.mock import patch, MagicMock
from server.services.project_service import ProjectService, InvalidGeoJson, Project


class TestProject(unittest.TestCase):

    @patch.object(Task, 'get')
    def test_lock_task_returns_none_if_task_not_found(self, mock_task):
        # Arrange
        mock_task.return_value = None

        # Act
        test_task = TaskService.lock_task(1, 1)

        # Assert
        self.assertIsNone(test_task)

    @patch.object(Task, 'get')
    def test_lock_task_raises_error_if_task_already_locked(self, mock_task):
        # Arrange
        task_stub = Task()
        task_stub.task_locked = True

        mock_task.return_value = task_stub

        # Act / Assert
        with self.assertRaises(TaskServiceError):
            TaskService.lock_task(1, 1)

    @patch.object(Task, 'update')
    @patch.object(Task, 'get')
    def test_lock_tasks_sets_locked_status_when_valid(self, mock_task, mock_update):
        # Arrange
        task_stub = Task()
        task_stub.task_locked = False
        mock_task.return_value = task_stub

        # Act
        test_task = TaskService.lock_task(1, 1)

        # Assert
        self.assertTrue(test_task.task_locked, 'Locked should be set to True')

    @patch.object(Task, 'get')
    def test_unlock_task_returns_none_when_task_not_found(self, mock_task):
        # Arrange
        mock_task.return_value = None

        # Act
        test_task = TaskService.unlock_task(1, 1, 'TEST')

        # Assert
        self.assertIsNone(test_task)

    @patch.object(Task, 'get')
    def test_unlock_of_already_unlocked_task_is_safe(self, mock_task):
        # Arrange
        task_stub = Task()
        task_stub.id = 888
        task_stub.task_locked = False
        mock_task.return_value = task_stub

        # Act
        test_task = TaskService.unlock_task(1, 1, 'TEST')

        # Assert
        self.assertEqual(test_task.id, task_stub.id)

    @patch.object(Task, 'get')
    def test_unlock_with_unknown_status_raises_error(self, mock_task):
        # Arrange
        task_stub = Task()
        task_stub.task_locked = True
        mock_task.return_value = task_stub

        # Act / Assert
        with self.assertRaises(TaskServiceError):
            TaskService.unlock_task(1, 1, 'IAIN')

    @patch.object(Task, 'get')
    def test_unlock_with_status_changes_sets_history(self, mock_task):
        # Arrange
        task_stub = Task()
        task_stub.task_locked = True
        task_stub.task_status = TaskStatus.READY.value
        mock_task.return_value = task_stub

        # Act
        test_task = TaskService.unlock_task(1, 1, TaskStatus.DONE.name)

        # Assert
