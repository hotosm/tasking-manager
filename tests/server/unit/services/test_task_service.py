import unittest
from server.services.task_service import TaskService, Task, TaskServiceError, TaskAction, TaskStatus, TaskHistory
from unittest.mock import patch
from server import create_app


class TestProject(unittest.TestCase):

    task_stub = Task

    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        self.task_stub = Task()
        self.task_stub.id = 1
        self.task_stub.project_id = 1

    def tearDown(self):
        self.ctx.pop()

    @patch.object(Task, 'get')
    def test_lock_task_returns_none_if_task_not_found(self, mock_task):
        # Arrange
        mock_task.return_value = None

        # Act
        test_task = TaskService().lock_task(1, 1)

        # Assert
        self.assertIsNone(test_task)

    @patch.object(Task, 'get')
    def test_lock_task_raises_error_if_task_already_locked(self, mock_task):
        # Arrange
        self.task_stub.task_locked = True

        mock_task.return_value = self.task_stub

        # Act / Assert
        with self.assertRaises(TaskServiceError):
            TaskService().lock_task(1, 1)

    @patch.object(Task, 'update')
    @patch.object(Task, 'get')
    def test_lock_tasks_sets_locked_status_when_valid(self, mock_task, mock_update):
        # Arrange
        self.task_stub.task_locked = False
        mock_task.return_value = self.task_stub

        # Act
        test_task = TaskService().lock_task(1, 1)

        # Assert
        self.assertTrue(test_task.task_locked, 'Locked should be set to True')

    @patch.object(Task, 'update')
    @patch.object(Task, 'get')
    def test_lock_task_adds_locked_history(self, mock_task, mock_update):
        # Arrange
        mock_task.return_value = self.task_stub

        # Act
        test_task = TaskService().lock_task(1, 1)

        # Assert
        self.assertEqual(TaskAction.LOCKED.name, test_task.task_history[0].action)

    @patch.object(Task, 'get')
    def test_unlock_task_returns_none_when_task_not_found(self, mock_task):
        # Arrange
        mock_task.return_value = None

        # Act
        test_task = TaskService().unlock_task(1, 1, 'TEST')

        # Assert
        self.assertIsNone(test_task)

    @patch.object(Task, 'get')
    def test_unlock_of_already_unlocked_task_is_safe(self, mock_task):
        # Arrange
        self.task_stub.task_locked = False
        mock_task.return_value = self.task_stub

        # Act
        test_task = TaskService().unlock_task(1, 1, 'TEST')

        # Assert
        self.assertEqual(test_task.id, self.task_stub.id)

    @patch.object(Task, 'get')
    def test_unlock_with_unknown_status_raises_error(self, mock_task):
        # Arrange
        self.task_stub.task_locked = True
        mock_task.return_value = self.task_stub

        # Act / Assert
        with self.assertRaises(TaskServiceError):
            TaskService().unlock_task(1, 1, 'IAIN')

    @patch.object(Task, 'update')
    @patch.object(TaskHistory, 'update_task_locked_with_duration')
    @patch.object(Task, 'get')
    def test_unlock_with_comment_sets_history(self, mock_task, mock_history, mock_update):
        # Arrange
        self.task_stub.task_status = TaskStatus.DONE.value
        self.task_stub.task_locked = True
        mock_task.return_value = self.task_stub

        # Act
        test_task = TaskService().unlock_task(1, 1, TaskStatus.DONE.name, 'Test comment')

        # Assert
        self.assertEqual(TaskAction.COMMENT.name, test_task.task_history[0].action)
        self.assertEqual(test_task.task_history[0].action_text, 'Test comment')

    @patch.object(Task, 'update')
    @patch.object(TaskHistory, 'update_task_locked_with_duration')
    @patch.object(Task, 'get')
    def test_unlock_with_status_change_sets_history(self, mock_task, mock_history, mock_update):
        # Arrange
        self.task_stub.task_status = TaskStatus.READY.value
        self.task_stub.task_locked = True
        mock_task.return_value = self.task_stub

        # Act
        test_task = TaskService().unlock_task(1, 1, TaskStatus.DONE.name)

        # Assert
        self.assertEqual(TaskAction.STATE_CHANGE.name, test_task.task_history[0].action)
        self.assertEqual(test_task.task_history[0].action_text, TaskStatus.DONE.name)
        self.assertEqual(TaskStatus.DONE.value, test_task.task_status)

    @patch.object(Task, 'update')
    @patch.object(TaskHistory, 'update_task_locked_with_duration')
    @patch.object(Task, 'get')
    def test_unlock_task_sets_lock_status(self, mock_task, mock_history, mock_update):
        # Arrange
        self.task_stub.task_locked = True
        self.task_stub.task_status = TaskStatus.DONE.value
        mock_task.return_value = self.task_stub

        # Act
        test_task = TaskService().unlock_task(1, 1, TaskStatus.DONE.name)

        # Assert
        self.assertFalse(test_task.task_locked)
