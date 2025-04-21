import pytest
import geojson
from backend.models.postgis.statuses import TaskStatus
from backend.models.postgis.task import (
    InvalidData,
    InvalidGeoJson,
    Task,
    TaskAction,
)
from tests.api.helpers.test_helpers import create_canned_project
import json


@pytest.mark.anyio
class TestTask:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        """Fixture to set up test task data."""
        assert db_connection_fixture is not None, "Database connection is not available"

        (
            request.cls.project,
            request.cls.user,
            request.cls.project_id,
        ) = await create_canned_project(db_connection_fixture)
        request.cls.mapped_task = self.project.tasks[0]
        request.cls.ready_task = self.project.tasks[1]
        request.cls.bad_imagery_task = self.project.tasks[2]
        request.cls.validated_task = self.project.tasks[3]
        request.cls.db = db_connection_fixture

    async def test_reset_task_sets_to_ready_status(self):
        """Test resetting a task sets it to READY status."""
        user_id = self.user.id

        await Task.reset_task(1, self.project_id, user_id, self.db)
        await Task.set_task_history(
            1,
            self.project_id,
            user_id,
            TaskAction.STATE_CHANGE,
            self.db,
            None,
            TaskStatus.READY,
        )

        task = await Task.get(1, self.project_id, self.db)

        query = """
            SELECT * FROM task_history
            WHERE task_id = :task_id AND project_id = :project_id
            LIMIT 1
        """
        task_history = await self.db.fetch_one(
            query, {"task_id": 1, "project_id": self.project_id}
        )

        assert task.task_status == TaskStatus.READY.value
        assert task_history is not None

    async def test_reset_task_clears_any_existing_locks(self):
        """Test resetting a task clears any existing locks and sets it to READY status."""
        user_id = self.user.id
        task_id = 9
        await self.db.execute(
            """
            INSERT INTO tasks (id, project_id, task_status, x, y, zoom, extra_properties)
            VALUES (:id, :project_id, :task_status, :x, :y, :zoom, :extra_properties)
            """,
            {
                "id": task_id,
                "project_id": self.project_id,
                "task_status": TaskStatus.MAPPED.value,
                "x": 1,
                "y": 2,
                "zoom": 3,
                "extra_properties": None,
            },
        )

        await Task.reset_task(9, self.project_id, user_id, self.db)
        task = await Task.get(9, self.project_id, self.db)

        # Ensure task status is now READY
        assert task.task_status == TaskStatus.READY.value

    def test_cant_add_task_if_feature_geometry_is_invalid(self):
        """Test that a task cannot be added if the feature geometry is invalid."""
        invalid_feature = geojson.loads(
            '{"geometry": {"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715],'
            '[-3.8122, 56.098], [-4.0237]]]], "type": "MultiPolygon"}, "properties":'
            '{"x": 2402, "y": 1736, "zoom": 12}, "type": "Feature"}'
        )

        with pytest.raises(InvalidGeoJson):
            Task.from_geojson_feature(1, invalid_feature)

    def test_cant_add_task_if_feature_has_missing_properties(self):
        """Test that a task cannot be added if the feature is missing required properties."""
        invalid_properties = geojson.loads(
            '{"geometry": {"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715],'
            '[-3.8122, 56.098], [-4.0237, 56.0904]]]], "type": "MultiPolygon"},'
            '"properties": {"x": 2402, "y": 1736}, "type": "Feature"}'
        )

        with pytest.raises(InvalidData):
            Task.from_geojson_feature(1, invalid_properties)

    def test_can_add_task_if_feature_geometry_is_valid(self):
        """Test that a task can be added if the feature geometry is valid."""
        valid_feature_collection = geojson.loads(
            '{"geometry": {"coordinates": [[[[-4.0237, 56.0904],'
            '[-3.9111, 56.1715], [-3.8122, 56.098], [-4.0237, 56.0904]]]], "type":'
            '"MultiPolygon"}, "properties": {"x": 2402, "y": 1736, "zoom": 12, "isSquare": true}, "type":'
            '"Feature"}'
        )

        task = Task.from_geojson_feature(1, valid_feature_collection)
        assert task is not None  # Ensures a valid task is created

    def test_cant_add_task_if_not_supplied_feature_type(self):
        """Test that a task cannot be added if the feature type is missing or incorrect."""
        invalid_feature = geojson.MultiPolygon(
            [[(2.38, 57.322), (23.194, -20.28), (-120.43, 19.15), (2.38, 10.33)]]
        )

        with pytest.raises(InvalidGeoJson):
            Task.from_geojson_feature(1, invalid_feature)

    @pytest.mark.anyio
    async def test_per_task_instructions_formatted_correctly(self):
        """Test that task instructions format correctly using placeholders."""
        task_id = 10
        await self.db.execute(
            """
            INSERT INTO tasks (id, project_id, x, y, zoom, extra_properties)
            VALUES (:id, :project_id, :x, :y, :zoom, :extra_properties)
            """,
            {
                "id": task_id,
                "project_id": self.project_id,
                "x": 1,
                "y": 2,
                "zoom": 3,
                "extra_properties": None,
            },
        )

        instructions = await Task.format_per_task_instructions(
            "Test URL is http://test.com/{x}/{y}/{z}", task_id, self.project_id, self.db
        )

        assert instructions == "Test URL is http://test.com/1/2/3"

    @pytest.mark.anyio
    async def test_per_task_instructions_with_underscores_formatted_correctly(self):
        """Test task instructions with underscore placeholders."""
        task_id = 11
        await self.db.execute(
            """
            INSERT INTO tasks (id, project_id, x, y, zoom, extra_properties)
            VALUES (:id, :project_id, :x, :y, :zoom, :extra_properties)
            """,
            {
                "id": task_id,
                "project_id": self.project_id,
                "x": 1,
                "y": 2,
                "zoom": 3,
                "extra_properties": None,
            },
        )

        instructions = await Task.format_per_task_instructions(
            "Test URL is http://test.com/{x}_{y}_{z}", task_id, self.project_id, self.db
        )

        assert instructions == "Test URL is http://test.com/1_2_3"

    @pytest.mark.anyio
    async def test_per_task_instructions_without_dynamic_url(self):
        """Test task instructions when no dynamic URL is provided and the task is not splittable."""
        task_id = 12
        await self.db.execute(
            """
            INSERT INTO tasks (id, project_id, x, y, zoom, extra_properties)
            VALUES (:id, :project_id, :x, :y, :zoom, :extra_properties)
            """,
            {
                "id": task_id,
                "project_id": self.project_id,
                "x": 1,
                "y": 2,
                "zoom": 3,
                "extra_properties": None,
            },
        )

        instructions = await Task.format_per_task_instructions(
            "Use map box", task_id, self.project_id, self.db
        )

        assert instructions == "Use map box"

    @pytest.mark.anyio
    async def test_per_task_instructions_with_extra_properties(self):
        """Test task instructions with extra properties."""
        task_id = 13
        await self.db.execute(
            """
            INSERT INTO tasks (id, project_id, x, y, zoom, extra_properties)
            VALUES (:id, :project_id, :x, :y, :zoom, :extra_properties)
            """,
            {
                "id": task_id,
                "project_id": self.project_id,
                "x": 1,
                "y": 2,
                "zoom": 3,
                "extra_properties": json.dumps({"foo": "bar"}),
            },
        )

        instructions = await Task.format_per_task_instructions(
            "Foo is replaced by {foo}", task_id, self.project_id, self.db
        )

        assert instructions == "Foo is replaced by bar"

    async def test_record_auto_unlock_adds_autounlocked_action(self):
        """Test that an auto-unlocked task gets the correct history action."""
        lock_duration = "02:00"
        user_id = self.user.id
        task_id = 19

        await self.db.execute(
            """
            INSERT INTO tasks (id, project_id, task_status, x, y, zoom, extra_properties, locked_by)
            VALUES (:id, :project_id, :task_status, :x, :y, :zoom, :extra_properties, :locked_by)
            """,
            {
                "id": task_id,
                "project_id": self.project_id,
                "task_status": TaskStatus.READY.value,
                "x": 1,
                "y": 2,
                "zoom": 3,
                "extra_properties": None,
                "locked_by": user_id,
            },
        )

        await Task.record_auto_unlock(task_id, self.project_id, lock_duration, self.db)

        query = """
            SELECT * FROM task_history
            WHERE task_id = :task_id AND project_id = :project_id
            LIMIT 1
        """
        task_history = await self.db.fetch_one(
            query, {"task_id": task_id, "project_id": self.project_id}
        )
        assert task_history["action_text"] == lock_duration
        assert task_history["user_id"] == user_id
