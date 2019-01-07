import geojson
import unittest
from server import create_app
from server.models.postgis.task import InvalidGeoJson, InvalidData, Task, TaskAction, TaskHistory
from server.models.postgis.statuses import TaskStatus
from unittest.mock import patch, MagicMock


class TestTask(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    @patch.object(Task, 'update')
    @patch.object(Task, 'set_task_history')
    def test_reset_task_sets_to_ready_status(self, mock_set_task_history, mock_update):
        user_id = 123

        test_task = Task()
        test_task.task_status = TaskStatus.MAPPED
        test_task.reset_task(user_id)

        mock_set_task_history.assert_called_with(TaskAction.STATE_CHANGE, user_id, None, TaskStatus.READY)
        mock_update.assert_called()
        self.assertEqual(test_task.task_status, TaskStatus.READY.value)

    @patch.object(Task, 'update')
    @patch.object(Task, 'record_auto_unlock')
    @patch.object(Task, 'set_task_history')
    def test_reset_task_clears_any_existing_locks(self, mock_set_task_history, mock_record_auto_unlock, mock_update):
        user_id = 123

        test_task = Task()
        test_task.task_status = TaskStatus.LOCKED_FOR_MAPPING
        test_task.reset_task(user_id)

        mock_record_auto_unlock.assert_called()
        self.assertEqual(test_task.task_status, TaskStatus.READY.value)

    def test_cant_add_task_if_feature_geometry_is_invalid(self):
        # Arrange
        invalid_feature = geojson.loads('{"geometry": {"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715],' \
                                        '[-3.8122, 56.098], [-4.0237]]]], "type": "MultiPolygon"}, "properties":' \
                                        '{"x": 2402, "y": 1736, "zoom": 12}, "type": "Feature"}')

        with self.assertRaises(InvalidGeoJson):
            Task.from_geojson_feature(1, invalid_feature)

    def test_cant_add_task_if_feature_has_missing_properties(self):
        # Arrange
        # Missing zoom
        invalid_properties = geojson.loads('{"geometry": {"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715],' \
                                           '[-3.8122, 56.098], [-4.0237, 56.0904]]]], "type": "MultiPolygon"},' \
                                           '"properties": {"x": 2402, "y": 1736}, "type": "Feature"}')

        with self.assertRaises(InvalidData):
            Task.from_geojson_feature(1, invalid_properties)

    def test_lock_task_for_mapping_adds_locked_history(self):
        # Arrange
        test_task = Task()

        # Act
        test_task.set_task_history(action=TaskAction.LOCKED_FOR_MAPPING, user_id=123454)

        # Assert
        self.assertEqual(TaskAction.LOCKED_FOR_MAPPING.name, test_task.task_history[0].action)

    def test_cant_add_task_if_not_supplied_feature_type(self):
        # Arrange
        invalid_feature = geojson.MultiPolygon([[(2.38, 57.322), (23.194, -20.28), (-120.43, 19.15), (2.38, 10.33)]])
        # Arrange

        with self.assertRaises(InvalidGeoJson):
            Task.from_geojson_feature(1, invalid_feature)

    def test_per_task_instructions_formatted_correctly(self):
        # Arrange
        test_task = Task()
        test_task.x = 1
        test_task.y = 2
        test_task.zoom = 3
        test_task.is_square = True

        # Act
        instructions = test_task.format_per_task_instructions('Test Url is http://test.com/{x}/{y}/{z}')

        # Assert
        self.assertEqual(instructions, 'Test Url is http://test.com/1/2/3')

    def test_per_task_instructions_with_underscores_formatted_correctly(self):
        test_task = Task()
        test_task.x = 1
        test_task.y = 2
        test_task.zoom = 3
        test_task.is_square = True

        # Act
        instructions = test_task.format_per_task_instructions('Test Url is http://test.com/{x}_{y}_{z}')

        # Assert
        self.assertEqual(instructions, 'Test Url is http://test.com/1_2_3')

    def test_per_task_instructions_returns_instructions_when_no_dynamic_url_and_task_not_splittable(self):
        # Arrange
        test_task = Task()
        test_task.x = 1
        test_task.y = 2
        test_task.zoom = 3
        test_task.is_square = False

        # Act
        instructions = test_task.format_per_task_instructions('Use map box')

        # Assert
        self.assertEqual(instructions, 'Use map box')

    def test_per_task_instructions_returns_instructions_with_extra_properties(self):
        # Arrange
        test_task = Task()
        test_task.extra_properties = '{"foo": "bar"}'
        test_task.x = 1
        test_task.y = 2
        test_task.zoom = 3
        test_task.is_square = True

        # Act
        instructions = test_task.format_per_task_instructions('Foo is replaced by {foo}')

        # Assert
        self.assertEqual(instructions, 'Foo is replaced by bar')

    @patch.object(TaskHistory, 'get_last_status')
    @patch.object(TaskHistory, 'get_last_locked_action')
    @patch.object(Task, 'set_task_history')
    @patch.object(Task, 'update')
    def test_record_auto_unlock_adds_autounlocked_action(self, mock_update, mock_set_task_history,
                                                         mock_get_last_action, mock_get_last_status):
        mock_history = MagicMock()
        mock_last_action = MagicMock()
        mock_last_action.action = 'LOCKED_FOR_MAPPING'
        mock_get_last_action.return_value = mock_last_action
        mock_get_last_status.return_value = TaskStatus.READY
        mock_set_task_history.return_value = mock_history

        test_task = Task()
        test_task.locked_by='testuser'
        lock_duration = "02:00"
        test_task.record_auto_unlock(lock_duration)

        mock_set_task_history.assert_called_with(action=TaskAction.AUTO_UNLOCKED_FOR_MAPPING, user_id='testuser')
        self.assertEqual(mock_history.action_text, lock_duration)
        self.assertEqual(test_task.locked_by, None)
        mock_last_action.delete.assert_called()
