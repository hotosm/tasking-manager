import unittest
from server.services.mapping_service import MappingService, Task, MappingServiceError, TaskStatus, \
     ProjectService, NotFound, StatsService, MappingNotAllowed, UserLicenseError
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
        self.task_stub.locked_by = 123456
        self.task_stub.lock_holder = test_user

        self.lock_task_dto = LockTaskDTO()
        self.lock_task_dto.user_id = 123456

        self.mapped_task_dto = MappedTaskDTO()
        self.mapped_task_dto.status = TaskStatus.MAPPED.name
        self.mapped_task_dto.user_id = 123456

    def tearDown(self):
        self.ctx.pop()

    @patch.object(Task, 'get')
    def test_get_task_raises_error_if_task_not_found(self, mock_task):
        mock_task.return_value = None

        with self.assertRaises(NotFound):
            MappingService.get_task(12, 12)

    @patch.object(MappingService, 'get_task')
    def test_lock_task_for_mapping_raises_error_if_task_in_invalid_state(self, mock_task):
        # Arrange
        self.task_stub.task_status = TaskStatus.MAPPED.value
        mock_task.return_value = self.task_stub

        # Act / Assert
        with self.assertRaises(MappingServiceError):
            MappingService.lock_task_for_mapping(self.lock_task_dto)

    @patch.object(ProjectService, 'is_user_permitted_to_map')
    @patch.object(MappingService, 'get_task')
    def test_lock_task_for_mapping_raises_error_if_user_already_has_locked_task(self, mock_task, mock_project):
        # Arrange
        mock_task.return_value = self.task_stub
        mock_project.return_value = False, MappingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED

        # Act / Assert
        with self.assertRaises(MappingServiceError):
            MappingService.lock_task_for_mapping(self.lock_task_dto)

    @patch.object(ProjectService, 'is_user_permitted_to_map')
    @patch.object(MappingService, 'get_task')
    def test_lock_task_for_mapping_raises_error_if_user_has_not_accepted_license(self, mock_task, mock_project):
        # Arrange
        mock_task.return_value = self.task_stub
        mock_project.return_value = False, MappingNotAllowed.USER_NOT_ACCEPTED_LICENSE

        # Act / Assert
        with self.assertRaises(UserLicenseError):
            MappingService.lock_task_for_mapping(self.lock_task_dto)

    @patch.object(MappingService, 'get_task')
    def test_unlock_of_not_locked_for_mapping_raises_error(self, mock_task):
        # Arrange
        mock_task.return_value = self.task_stub

        # Act / Assert
        with self.assertRaises(MappingServiceError):
            MappingService.unlock_task_after_mapping(MagicMock())

    @patch.object(MappingService, 'get_task')
    def test_cant_unlock_a_task_you_dont_own(self, mock_task):
        # Arrange
        self.task_stub.task_status = TaskStatus.LOCKED_FOR_MAPPING.value
        self.task_stub.locked_by = 12
        mock_task.return_value = self.task_stub

        # Act / Assert
        with self.assertRaises(MappingServiceError):
            MappingService.unlock_task_after_mapping(self.mapped_task_dto)

    @patch.object(MappingService, 'get_task')
    def test_if_new_state_not_acceptable_raise_error(self, mock_task):
        # Arrange
        self.task_stub.task_status = TaskStatus.LOCKED_FOR_MAPPING.value
        mock_task.return_value = self.task_stub

        self.mapped_task_dto.status = TaskStatus.LOCKED_FOR_VALIDATION.name

        # Act / Assert
        with self.assertRaises(MappingServiceError):
            MappingService.unlock_task_after_mapping(self.mapped_task_dto)

    @patch.object(StatsService, 'update_stats_after_task_state_change')
    @patch.object(Task, 'update')
    @patch.object(TaskHistory, 'update_task_locked_with_duration')
    @patch.object(MappingService, 'get_task')
    def test_unlock_with_comment_sets_history(self, mock_task, mock_history, mock_update, mock_stats):
        # Arrange
        self.task_stub.task_status = TaskStatus.LOCKED_FOR_MAPPING.value
        mock_task.return_value = self.task_stub

        self.mapped_task_dto.comment = 'Test comment'

        # Act
        test_task = MappingService.unlock_task_after_mapping(self.mapped_task_dto)

        # Assert
        self.assertEqual(TaskAction.COMMENT.name, test_task.task_history[0].action)
        self.assertEqual(test_task.task_history[0].action_text, 'Test comment')

    @patch.object(StatsService, 'update_stats_after_task_state_change')
    @patch.object(Task, 'update')
    @patch.object(TaskHistory, 'update_task_locked_with_duration')
    @patch.object(MappingService, 'get_task')
    def test_unlock_with_status_change_sets_history(self, mock_task, mock_history, mock_update, mock_stats):
        # Arrange
        self.task_stub.task_status = TaskStatus.LOCKED_FOR_MAPPING.value
        mock_task.return_value = self.task_stub

        # Act
        test_task = MappingService.unlock_task_after_mapping(self.mapped_task_dto)

        # Assert
        self.assertEqual(TaskAction.STATE_CHANGE.name, test_task.task_history[0].action)
        self.assertEqual(test_task.task_history[0].action_text, TaskStatus.MAPPED.name)
        self.assertEqual(TaskStatus.MAPPED.name, test_task.task_status)

