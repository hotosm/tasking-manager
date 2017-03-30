import unittest
from server.services.mapping_service import MappingService, Task, MappingServiceError, TaskStatus, \
     Project, ProjectDTO, ProjectStatus
from server.models.dtos.mapping_dto import MappedTaskDTO, LockTaskDTO
from server.models.postgis.task import TaskHistory, TaskAction
from unittest.mock import patch, MagicMock
from server import create_app


class TestMappingService(unittest.TestCase):
    task_stub = Task
    lock_task_dto = LockTaskDTO

    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        self.lock_task_dto = LockTaskDTO()
        self.lock_task_dto.task_id = 1
        self.lock_task_dto.project_id = 1
        self.lock_task_dto.user_id = 123456

        self.task_stub = Task()
        self.task_stub.id = 1
        self.task_stub.project_id = 1
        self.task_stub.task_status = 0

    def tearDown(self):
        self.ctx.pop()

    @patch.object(Project, 'as_dto_for_mapping')
    def test_get_project_dto_for_mapping_returns_none_if_project_not_found(self, mock_project):
        # Arrange
        mock_project.return_value = None

        # Act
        test_project = MappingService().get_project_dto_for_mapper(1, 'en')

        # Assert
        self.assertIsNone(test_project)

    @patch.object(Project, 'as_dto_for_mapping')
    def test_get_project_dto_for_mapping_raises_error_if_project_not_published(self, mock_project):
        # Arrange
        test_project = ProjectDTO()
        test_project.project_status = ProjectStatus.DRAFT.name
        mock_project.return_value = test_project

        # Act
        with self.assertRaises(MappingServiceError):
            MappingService().get_project_dto_for_mapper(1, 'en')

    @patch.object(Task, 'get')
    def test_lock_task_for_mapping_returns_none_if_task_not_found(self, mock_task):
        # Arrange
        mock_task.return_value = None
        test_task = 'test'

        # Act
        test_task = MappingService().lock_task_for_mapping(self.lock_task_dto)

        # Assert
        self.assertIsNone(test_task)

    @patch.object(Task, 'get')
    def test_lock_task_for_mapping_raises_error_if_task_already_locked(self, mock_task):
        # Arrange
        self.task_stub.task_locked = True

        mock_task.return_value = self.task_stub

        # Act / Assert
        with self.assertRaises(MappingServiceError):
            MappingService().lock_task_for_mapping(self.lock_task_dto)

    @patch.object(Task, 'get')
    def test_lock_task_for_mapping_raises_error_if_task_in_invalid_state(self, mock_task):
        # Arrange
        self.task_stub.task_locked = True
        self.task_stub.task_status = 2

        mock_task.return_value = self.task_stub

        # Act / Assert
        with self.assertRaises(MappingServiceError):
            MappingService().lock_task_for_mapping(self.lock_task_dto)

    @patch.object(Task, 'update')
    @patch.object(Task, 'get')
    def test_lock_task_for_mapping_sets_locked_status_when_valid(self, mock_task, mock_update):
        # Arrange
        self.task_stub.task_locked = False
        mock_task.return_value = self.task_stub

        # Act
        test_task = MappingService().lock_task_for_mapping(self.lock_task_dto)

        # Assert
        self.assertTrue(test_task.task_locked, 'Locked should be set to True')

    @patch.object(Task, 'get')
    def test_unlock_task_returns_none_when_task_not_found(self, mock_task):
        # Arrange
        mock_task.return_value = None

        # Act
        test_task = MappingService().unlock_task_after_mapping(MagicMock())

        # Assert
        self.assertIsNone(test_task)

    @patch.object(Task, 'get')
    def test_unlock_of_already_unlocked_task_is_safe(self, mock_task):
        # Arrange
        self.task_stub.task_locked = False
        mock_task.return_value = self.task_stub

        # Act
        test_task = MappingService().unlock_task_after_mapping(MagicMock())

        # Assert
        self.assertEqual(test_task.task_id, self.task_stub.id)

    @patch.object(Task, 'get')
    def test_unlock_badimagery_to_invalid_status_raises_error(self, mock_task):
        # Arrange
        self.task_stub.task_status = 4
        self.task_stub.task_locked = True
        mock_task.return_value = self.task_stub

        mapped_task = MappedTaskDTO()
        mapped_task.task_id = 1
        mapped_task.project_id = 1
        mapped_task.status = TaskStatus.DONE.name
        mapped_task.comment = 'Test comment'

        # Act / Assert
        with self.assertRaises(MappingServiceError):
            MappingService().unlock_task_after_mapping(mapped_task)

    @patch.object(Task, 'update')
    @patch.object(TaskHistory, 'update_task_locked_with_duration')
    @patch.object(Task, 'get')
    def test_unlock_with_comment_sets_history(self, mock_task, mock_history, mock_update):
        # Arrange
        self.task_stub.task_status = TaskStatus.READY.value
        self.task_stub.task_locked = True
        mock_task.return_value = self.task_stub

        mapped_task = MappedTaskDTO()
        mapped_task.task_id = 1
        mapped_task.project_id = 1
        mapped_task.status = TaskStatus.DONE.name
        mapped_task.comment = 'Test comment'

        # Act
        test_task = MappingService().unlock_task_after_mapping(mapped_task)

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

        mapped_task = MappedTaskDTO()
        mapped_task.task_id = 1
        mapped_task.project_id = 1
        mapped_task.status = TaskStatus.DONE.name

        # Act
        test_task = MappingService().unlock_task_after_mapping(mapped_task)

        # Assert
        self.assertEqual(TaskAction.STATE_CHANGE.name, test_task.task_history[0].action)
        self.assertEqual(test_task.task_history[0].action_text, TaskStatus.DONE.name)
        self.assertEqual(TaskStatus.DONE.name, test_task.task_status)

    @patch.object(Task, 'update')
    @patch.object(TaskHistory, 'update_task_locked_with_duration')
    @patch.object(Task, 'get')
    def test_unlock_task_sets_lock_status(self, mock_task, mock_history, mock_update):
        # Arrange
        self.task_stub.task_locked = True
        self.task_stub.task_status = TaskStatus.READY.value
        mock_task.return_value = self.task_stub

        mapped_task = MappedTaskDTO()
        mapped_task.task_id = 1
        mapped_task.project_id = 1
        mapped_task.status = TaskStatus.READY.name

        # Act
        test_task = MappingService().unlock_task_after_mapping(mapped_task)

        # Assert
        self.assertFalse(test_task.task_locked)
