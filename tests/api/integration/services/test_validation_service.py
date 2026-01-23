from backend.services.project_service import ProjectService
import pytest

from backend.services.validator_service import ValidatorService, ValidatorServiceError
from backend.models.dtos.validator_dto import RevertUserTasksDTO
from backend.models.postgis.task import Task
from backend.models.postgis.statuses import TaskStatus
from tests.api.helpers.test_helpers import (
    create_canned_project,
    create_canned_user,
    return_canned_user,
)


@pytest.mark.anyio
class TestValidationService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        test_user = await return_canned_user(self.db, "test_user", 123456789)
        self.test_user = await create_canned_user(self.db, test_user)

        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

    async def test_validate_all_sets_counters_correctly(self):
        # Arrange
        total_mapped_tasks = self.test_project.tasks_mapped
        total_validated_tasks = self.test_project.tasks_validated

        # Act
        await ValidatorService.validate_all_tasks(
            self.test_project_id, self.test_user.id, db=self.db
        )

        # Assert
        proj = await ProjectService.get_project_by_id(self.test_project_id, self.db)
        assert proj.tasks_validated == total_mapped_tasks + total_validated_tasks
        assert proj.tasks_mapped == 0

    async def test_invalidate_all_sets_counters_correctly(self):
        # Arrange
        mapped_tasks = self.test_project.tasks_mapped

        # Act
        await ValidatorService.invalidate_all_tasks(
            self.test_project_id, self.test_user.id, db=self.db
        )

        # Assert
        proj = await ProjectService.get_project_by_id(self.test_project_id, self.db)

        assert mapped_tasks == proj.tasks_mapped
        assert 0 == proj.tasks_validated

    async def test_mapped_by_and_validated_by_are_null_after_invalidating_all(self):
        # validate then invalidate
        await ValidatorService.validate_all_tasks(
            self.test_project_id, self.test_user.id, db=self.db
        )
        await ValidatorService.invalidate_all_tasks(
            self.test_project_id, self.test_user.id, db=self.db
        )

        proj = await ProjectService.get_project_by_id(self.test_project_id, self.db)
        for task_id in range(1, 1 + proj.total_tasks):

            query = """
                SELECT mapped_by, validated_by, task_status
                FROM tasks
                WHERE id = :task_id
                AND project_id = :project_id
            """
            row = await self.db.fetch_one(
                query,
                {"task_id": task_id, "project_id": self.test_project_id},
            )

            mapped_by = row["mapped_by"]
            validated_by = row["validated_by"]
            task_status = row["task_status"]
            if task_status == TaskStatus.INVALIDATED.value:
                assert mapped_by is None
                assert validated_by is None

    async def test_mapped_by_and_validated_by_is_set_after_validating_all(self):
        # collect current mapped tasks before validation
        tasks_to_validate = []

        proj = await ProjectService.get_project_by_id(self.test_project_id, self.db)
        for task_id in range(1, 1 + proj.total_tasks):
            t = await Task.get(task_id, self.test_project_id, self.db)
            if t.task_status == TaskStatus.MAPPED.value:
                tasks_to_validate.append(t)

        # Act
        await ValidatorService.validate_all_tasks(
            self.test_project_id, self.test_user.id, db=self.db
        )

        # Assert — fetch those tasks again and check mapped_by/validated_by
        for t_before in tasks_to_validate:
            query = """
                SELECT mapped_by, validated_by, task_status
                FROM tasks
                WHERE id = :task_id
                AND project_id = :project_id
            """
            t_after = await self.db.fetch_one(
                query,
                {"task_id": t_before.id, "project_id": t_before.project_id},
            )
            assert t_after.mapped_by is not None
            assert t_after.validated_by == self.test_user.id

    async def test_revert_user_tasks_requires_user_with_PM_permission_for_successful_operation(
        self,
    ):
        # Arrange

        revert_dto = RevertUserTasksDTO(
            project_id=self.test_project_id,
            user_id=self.test_user.id,
            action_by=self.test_user.id,
            action="VALIDATED",
        )

        # Act / Assert
        with pytest.raises(ValidatorServiceError):
            await ValidatorService.revert_user_tasks(revert_dto, db=self.db)

    async def test_revert_user_tasks_revert_validated_task_to_mapped_status(self):
        """
        Two tasks: one validated by test_user and the other by test_author.
        Only the task validated by test_user should be reverted to MAPPED.
        """
        # Arrange: pick two tasks
        t1 = await Task.get(1, self.test_project_id, self.db)
        t2 = await Task.get(2, self.test_project_id, self.db)

        # Lock/unlock sequence to set MAPPED -> then VALIDATED for both users
        await Task.lock_task_for_mapping(
            t1.id, t1.project_id, self.test_user.id, self.db
        )
        await Task.unlock_task(
            t1.id, t1.project_id, self.test_user.id, TaskStatus.MAPPED, self.db
        )

        await Task.lock_task_for_mapping(
            t2.id, t2.project_id, self.test_author.id, self.db
        )
        await Task.unlock_task(
            t2.id, t2.project_id, self.test_author.id, TaskStatus.MAPPED, self.db
        )

        await Task.lock_task_for_validating(
            t1.id, t1.project_id, self.test_user.id, self.db
        )
        await Task.unlock_task(
            t1.id, t1.project_id, self.test_user.id, TaskStatus.VALIDATED, self.db
        )

        await Task.lock_task_for_validating(
            t2.id, t2.project_id, self.test_author.id, self.db
        )
        await Task.unlock_task(
            t2.id, t2.project_id, self.test_author.id, TaskStatus.VALIDATED, self.db
        )

        # Create DTO (action_by is the author here)

        revert_dto = RevertUserTasksDTO(
            project_id=self.test_project_id,
            user_id=self.test_user.id,
            action_by=self.test_author.id,
            action="VALIDATED",
        )
        # Act
        await ValidatorService.revert_user_tasks(revert_dto, db=self.db)

        # Assert — re-fetch tasks from DB and check statuses
        t1_after = await Task.get(t1.id, t1.project_id, self.db)
        t2_after = await Task.get(t2.id, t2.project_id, self.db)

        assert t1_after.task_status == TaskStatus.MAPPED.value
        assert t2_after.task_status == TaskStatus.VALIDATED.value

    async def test_revert_user_tasks_reverts_bad_imagery_tasks_to_ready(self):
        """
        Two tasks: one set to BADIMAGERY by test_user and one by test_author.
        Only the one set by test_user should be reverted to READY.
        """
        # Arrange: pick two tasks
        t1 = await Task.get(1, self.test_project_id, self.db)
        t2 = await Task.get(2, self.test_project_id, self.db)

        # Lock/unlock to BADIMAGERY
        await Task.lock_task_for_mapping(
            t1.id, t1.project_id, self.test_user.id, self.db
        )
        await Task.unlock_task(
            t1.id, t1.project_id, self.test_user.id, TaskStatus.BADIMAGERY, self.db
        )

        await Task.lock_task_for_mapping(
            t2.id, t2.project_id, self.test_author.id, self.db
        )
        await Task.unlock_task(
            t2.id, t2.project_id, self.test_author.id, TaskStatus.BADIMAGERY, self.db
        )

        revert_dto = RevertUserTasksDTO(
            project_id=self.test_project_id,
            user_id=self.test_user.id,
            action_by=self.test_author.id,
            action="BADIMAGERY",
        )

        # Act
        await ValidatorService.revert_user_tasks(revert_dto, db=self.db)

        # Assert
        t1_after = await Task.get(t1.id, t1.project_id, self.db)
        t2_after = await Task.get(t2.id, t2.project_id, self.db)

        assert t1_after.task_status == TaskStatus.READY.value
        assert t2_after.task_status == TaskStatus.BADIMAGERY.value
