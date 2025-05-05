import pytest
from backend.models.postgis.project import Project
from backend.models.postgis.user import User
from backend.services.stats_service import StatsService, TaskStatus
from tests.api.helpers.test_helpers import create_canned_project


@pytest.mark.anyio
class TestStatsService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        assert db_connection_fixture is not None, "Database connection is not available"
        request.cls.db = db_connection_fixture

    async def test_update_after_mapping_increments_counter(self):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 0

        test_user = User()
        test_user.tasks_mapped = 0

        # Act
        test_project, test_user = await StatsService._update_tasks_stats(
            test_project, test_user, TaskStatus.READY, TaskStatus.MAPPED, self.db
        )

        # Assert
        assert test_project.tasks_mapped == 1
        assert test_user.tasks_mapped == 1

    async def test_same_state_keeps_counter(self):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 0

        test_user = User()
        test_user.tasks_mapped = 0

        # Act
        test_project, test_user = await StatsService._update_tasks_stats(
            test_project, test_user, TaskStatus.MAPPED, TaskStatus.MAPPED, self.db
        )

        # Assert
        assert test_project.tasks_mapped == 0
        assert test_user.tasks_mapped == 0

    async def test_update_after_validating_increments_counter(self):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 1
        test_project.tasks_validated = 0

        test_user = User()
        test_user.tasks_validated = 0

        # Act
        test_project, test_user = await StatsService._update_tasks_stats(
            test_project, test_user, TaskStatus.MAPPED, TaskStatus.VALIDATED, self.db
        )

        # Assert
        assert test_project.tasks_mapped == 0
        assert test_project.tasks_validated == 1
        assert test_user.tasks_validated == 1

    async def test_update_after_flagging_bad_imagery(self):
        # Arrange
        test_project = Project()
        test_project.tasks_bad_imagery = 0

        test_user = User()
        test_user.tasks_invalidated = 0

        # Act
        test_project, test_user = await StatsService._update_tasks_stats(
            test_project, test_user, TaskStatus.READY, TaskStatus.BADIMAGERY, self.db
        )

        # Assert
        assert test_project.tasks_bad_imagery == 1

    async def test_update_after_invalidating_mapped_task_sets_counters_correctly(self):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 1

        test_user = User()
        test_user.tasks_invalidated = 0

        # Act
        test_project, test_user = await StatsService._update_tasks_stats(
            test_project, test_user, TaskStatus.MAPPED, TaskStatus.INVALIDATED, self.db
        )

        # Assert
        assert test_project.tasks_mapped == 0
        assert test_user.tasks_invalidated == 1

    async def test_update_after_invalidating_bad_imagery_task_sets_counters_correctly(
        self,
    ):
        # Arrange
        test_project = Project()
        test_project.tasks_bad_imagery = 1

        test_user = User()
        test_user.tasks_invalidated = 0

        # Act
        test_project, test_user = await StatsService._update_tasks_stats(
            test_project,
            test_user,
            TaskStatus.BADIMAGERY,
            TaskStatus.INVALIDATED,
            self.db,
        )

        # Assert
        assert test_project.tasks_bad_imagery == 0
        assert test_user.tasks_invalidated == 1

    async def test_update_after_invalidating_validated_task_sets_counters_correctly(
        self,
    ):
        # Arrange
        test_project = Project()
        test_project.tasks_validated = 1

        test_user = User()
        test_user.tasks_invalidated = 0

        # Act
        test_project, test_user = await StatsService._update_tasks_stats(
            test_project,
            test_user,
            TaskStatus.VALIDATED,
            TaskStatus.INVALIDATED,
            self.db,
        )

        # Assert
        assert test_project.tasks_validated == 0
        assert test_user.tasks_invalidated == 1

    async def test_tasks_state_representation(self):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 0
        test_project.tasks_validated = 0
        test_project.tasks_bad_imagery = 0

        test_mapper = User()
        test_mapper.tasks_mapped = 0
        test_mapper.tasks_validated = 0
        test_mapper.tasks_invalidated = 0

        test_validator = User()
        test_validator.tasks_mapped = 0
        test_validator.tasks_validated = 0
        test_validator.tasks_invalidated = 0

        test_admin = User()
        test_admin.tasks_mapped = 0
        test_admin.tasks_validated = 0
        test_admin.tasks_invalidated = 0

        # Mapper marks task as mapped
        test_project, test_mapper = await StatsService._update_tasks_stats(
            test_project, test_mapper, TaskStatus.READY, TaskStatus.MAPPED, self.db
        )

        # Validator marks task as bad imagery
        test_project, test_validator = await StatsService._update_tasks_stats(
            test_project,
            test_validator,
            TaskStatus.MAPPED,
            TaskStatus.BADIMAGERY,
            self.db,
        )

        # Admin undoes marking task as bad imagery
        test_project, test_admin = await StatsService._update_tasks_stats(
            test_project,
            test_admin,
            TaskStatus.BADIMAGERY,
            TaskStatus.MAPPED,
            self.db,
            "undo",
        )

        # Validator marks task as invalid
        test_project, test_validator = await StatsService._update_tasks_stats(
            test_project,
            test_validator,
            TaskStatus.MAPPED,
            TaskStatus.INVALIDATED,
            self.db,
        )

        # Mapper marks task as mapped
        test_project, test_mapper = await StatsService._update_tasks_stats(
            test_project,
            test_mapper,
            TaskStatus.INVALIDATED,
            TaskStatus.MAPPED,
            self.db,
        )

        # Admin undoes mapping (but test_mapper is passed as the function parameter)
        test_project, test_mapper = await StatsService._update_tasks_stats(
            test_project,
            test_mapper,
            TaskStatus.MAPPED,
            TaskStatus.INVALIDATED,
            self.db,
            "undo",
        )

        # Mapper marks task as mapped again
        test_project, test_mapper = await StatsService._update_tasks_stats(
            test_project,
            test_mapper,
            TaskStatus.INVALIDATED,
            TaskStatus.MAPPED,
            self.db,
        )

        # Validator marks task as valid
        test_project, test_validator = await StatsService._update_tasks_stats(
            test_project,
            test_validator,
            TaskStatus.MAPPED,
            TaskStatus.VALIDATED,
            self.db,
        )

        # Assert
        assert test_project.tasks_mapped == 0
        assert test_project.tasks_validated == 1
        assert test_project.tasks_bad_imagery == 0
        assert test_mapper.tasks_mapped == 2
        assert test_mapper.tasks_validated == 0
        assert test_mapper.tasks_invalidated == 0
        assert test_validator.tasks_mapped == 0
        assert test_validator.tasks_validated == 1
        assert test_validator.tasks_invalidated == 1
        assert test_admin.tasks_mapped == 0
        assert test_admin.tasks_validated == 0
        assert test_admin.tasks_invalidated == 0

    async def test_get_user_contributions(self):
        # Arrange
        project, user, project_id = await create_canned_project(self.db, "test project")

        await self.db.execute("""
        INSERT INTO task_history (project_id, task_id, action, action_text, action_date, user_id)
        VALUES (:project_id, :task_id, :action, :action_text, current_timestamp, :user_id)
        """, {
            "project_id": project_id,
            "task_id": 1,
            "action": "STATE_CHANGE",
            "action_text": "state change",
            "user_id": user.id,
        })

        # Act
        contributions = await StatsService.get_user_contributions(project_id, self.db)

        # Assert
        assert contributions.user_contributions[0].mapping_level == 'BEGINNER'
