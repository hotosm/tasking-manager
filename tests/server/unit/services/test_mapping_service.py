import unittest
from server.services.mapping_service import MappingService, Task, MappingServiceError, TaskStatus, \
     ProjectService, NotFound
from server.models.dtos.mapping_dto import MappedTaskDTO, LockTaskDTO
from server.models.postgis.task import TaskHistory, TaskAction, User
from unittest.mock import patch, MagicMock
from server import create_app


class TestMappingService(unittest.TestCase):
    task_stub = Task
    lock_task_dto = LockTaskDTO
    mapped_task_dto = MappedTaskDTO
    mapping_service = None

    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        test_user = User()
        test_user.id = 123456
        test_user.username = 'Thinkwhere'

        self.task_stub = Task()
        self.task_stub.id = 1
        self.task_stub.project_id = 1
        self.task_stub.task_status = 0
        self.task_stub.lock_holder_id = 123456
        self.task_stub.task_locked = False
        self.task_stub.lock_holder = test_user

        self.lock_task_dto = LockTaskDTO()
        self.lock_task_dto.user_id = 123456

        self.mapped_task_dto = MappedTaskDTO()
        self.mapped_task_dto.status = TaskStatus.DONE.name
        self.mapped_task_dto.user_id = 123456

    def tearDown(self):
        self.ctx.pop()

    @patch.object(Task, 'get')
    def set_up_service(self, mock_task, stub_task):
        """ Helper that sets ups the mapping service with the supplied task test stub"""
        mock_task.return_value = stub_task
        self.mapping_service = MappingService(1, 1, ProjectService())

    def test_mapping_service_raises_error_if_task_not_found(self):
        with self.assertRaises(NotFound):
            self.set_up_service(stub_task=None)

    @patch.object(MappingService, 'get_task')
    def test_lock_task_for_mapping_raises_error_if_task_already_locked(self, mock_task):
        # Arrange
        self.task_stub.task_locked = True
        mock_task.return_value = self.task_stub

        # Act / Assert
        with self.assertRaises(MappingServiceError):
            MappingService.lock_task_for_mapping(self.lock_task_dto)

    @patch.object(MappingService, 'get_task')
    def test_lock_task_for_mapping_raises_error_if_task_in_invalid_state(self, mock_task):
        # Arrange
        self.task_stub.task_status = 2
        mock_task.return_value = self.task_stub

        # Act / Assert
        with self.assertRaises(MappingServiceError):
            MappingService.lock_task_for_mapping(self.lock_task_dto)

    @patch.object(ProjectService, 'is_user_permitted_to_map')
    @patch.object(MappingService, 'get_task')
    def test_lock_task_for_mapping_raises_error_if_user_already_has_locked_task(self, mock_task, mock_project):
        # Arrange
        mock_task.return_value = self.task_stub
        mock_project.return_value = False, 'Not allowed'

        # Act / Assert
        with self.assertRaises(MappingServiceError):
            MappingService.lock_task_for_mapping(self.lock_task_dto)

    @patch.object(ProjectService, 'is_user_permitted_to_map')
    @patch.object(Task, 'update')
    @patch.object(MappingService, 'get_task')
    def test_lock_task_for_mapping_sets_locked_status_when_valid(self, mock_task, mock_update, mock_project):
        # Arrange
        mock_task.return_value = self.task_stub
        mock_project.return_value = True, 'Allowed'
        self.mapped_task_dto.comment = 'Test comment'

        # Act
        test_task = MappingService.lock_task_for_mapping(self.lock_task_dto)

        # Assert
        self.assertTrue(test_task.task_locked, 'Locked should be set to True')

    def test_unlock_of_already_unlocked_task_is_safe(self):
        # Arrange
        self.set_up_service(stub_task=self.task_stub)

        # Act
        test_task = self.mapping_service.unlock_task_after_mapping(MagicMock())

        # Assert
        self.assertEqual(test_task.task_id, self.task_stub.id)

    def test_unlock_badimagery_to_invalid_status_raises_error(self):
        # Arrange
        self.task_stub.task_status = TaskStatus.BADIMAGERY.value
        self.task_stub.task_locked = True
        self.set_up_service(stub_task=self.task_stub)

        # Act / Assert
        with self.assertRaises(MappingServiceError):
            self.mapping_service.unlock_task_after_mapping(self.mapped_task_dto)

    @patch.object(Task, 'update')
    @patch.object(TaskHistory, 'update_task_locked_with_duration')
    def test_unlock_with_comment_sets_history(self, mock_history, mock_update):
        # Arrange
        self.task_stub.task_status = TaskStatus.READY.value
        self.task_stub.task_locked = True
        self.set_up_service(stub_task=self.task_stub)

        self.mapped_task_dto.comment = 'Test comment'

        # Act
        test_task = self.mapping_service.unlock_task_after_mapping(self.mapped_task_dto)

        # Assert
        self.assertEqual(TaskAction.COMMENT.name, test_task.task_history[0].action)
        self.assertEqual(test_task.task_history[0].action_text, 'Test comment')

    @patch.object(Task, 'update')
    @patch.object(TaskHistory, 'update_task_locked_with_duration')
    def test_unlock_with_status_change_sets_history(self, mock_history, mock_update):
        # Arrange
        self.task_stub.task_status = TaskStatus.READY.value
        self.task_stub.task_locked = True
        self.set_up_service(stub_task=self.task_stub)

        # Act
        test_task = self.mapping_service.unlock_task_after_mapping(self.mapped_task_dto)

        # Assert
        self.assertEqual(TaskAction.STATE_CHANGE.name, test_task.task_history[0].action)
        self.assertEqual(test_task.task_history[0].action_text, TaskStatus.DONE.name)
        self.assertEqual(TaskStatus.DONE.name, test_task.task_status)

    @patch.object(Task, 'update')
    @patch.object(TaskHistory, 'update_task_locked_with_duration')
    def test_unlock_task_sets_lock_status(self, mock_history, mock_update):
        # Arrange
        self.task_stub.task_locked = True
        self.task_stub.task_status = TaskStatus.READY.value
        self.set_up_service(stub_task=self.task_stub)

        # Act
        test_task = self.mapping_service.unlock_task_after_mapping(self.mapped_task_dto)

        # Assert
        self.assertFalse(test_task.task_locked)

    def test_cant_unlock_a_task_you_dont_own(self):
        # Arrange
        self.task_stub.task_locked = True
        self.task_stub.lock_holder_id = 12
        self.set_up_service(stub_task=self.task_stub)

        # Act / Assert
        with self.assertRaises(MappingServiceError):
            self.mapping_service.unlock_task_after_mapping(self.mapped_task_dto)
