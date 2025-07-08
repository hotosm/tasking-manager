import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from backend.services.mapping_service import (
    MappingService,
    MappingServiceError,
    UserLicenseError,
)
from backend.models.postgis.task import Task, TaskStatus, TaskHistory, TaskAction
from backend.models.dtos.mapping_dto import LockTaskDTO, MappedTaskDTO
from backend.services.project_service import ProjectService, MappingNotAllowed
from backend.exceptions import NotFound
from tests.api.helpers.test_helpers import (
    create_canned_project,
    create_canned_user,
    return_canned_user,
)


@pytest.mark.anyio
class TestMappingService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        assert db_connection_fixture is not None, "Database connection is not available"
        request.cls.db = db_connection_fixture

        test_user = MagicMock()
        test_user.id = 123456
        test_user.username = "Thinkwhere"

        self.task_stub = Task()
        self.task_stub.id = 1
        self.task_stub.project_id = 1
        self.task_stub.task_status = 0
        self.task_stub.locked_by = 123456
        self.task_stub.lock_holder = test_user

        self.lock_task_dto = LockTaskDTO(user_id=123456, task_id=1, project_id=1)

        self.mapped_task_dto = MappedTaskDTO(
            user_id=123456, task_id=1, project_id=1, status=TaskStatus.MAPPED.name
        )

    @patch.object(Task, "get")
    async def test_get_task_raises_error_if_task_not_found(self, mock_task):
        mock_task.return_value = None

        with pytest.raises(NotFound):
            await MappingService.get_task(12, 12, self.db)

    @patch.object(MappingService, "get_task")
    async def test_lock_task_for_mapping_raises_error_if_task_in_invalid_state(
        self, mock_task
    ):
        # Arrange
        self.task_stub.task_status = TaskStatus.MAPPED.value
        self.task_stub.locked_by = None
        mock_task.return_value = self.task_stub

        # Act / Assert
        with pytest.raises(MappingServiceError):
            await MappingService.lock_task_for_mapping(self.lock_task_dto, self.db)

    @patch.object(ProjectService, "is_user_permitted_to_map")
    @patch.object(MappingService, "get_task")
    async def test_lock_task_for_mapping_raises_error_if_user_already_has_locked_task(
        self, mock_task, mock_project
    ):
        # Arrange
        self.task_stub.locked_by = None
        mock_task.return_value = self.task_stub
        mock_project.return_value = (
            False,
            MappingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED,
        )

        # Act / Assert
        with pytest.raises(MappingServiceError):
            await MappingService.lock_task_for_mapping(self.lock_task_dto, self.db)

    @patch.object(ProjectService, "is_user_permitted_to_map")
    @patch.object(MappingService, "get_task")
    async def test_lock_task_for_mapping_raises_error_if_user_has_not_accepted_license(
        self, mock_task, mock_project
    ):
        # Arrange
        self.task_stub.locked_by = None
        mock_task.return_value = self.task_stub
        mock_project.return_value = (False, MappingNotAllowed.USER_NOT_ACCEPTED_LICENSE)

        # Act / Assert
        with pytest.raises(UserLicenseError):
            await MappingService.lock_task_for_mapping(self.lock_task_dto, self.db)

    async def test_unlock_of_not_locked_for_mapping_raises_error(self):
        # Arrange
        project, user, project_id = await create_canned_project(self.db)
        query = """
            SELECT * FROM tasks
            WHERE project_id = :project_id AND task_status = :task_status
        """
        task = await self.db.fetch_one(
            query=query,
            values={"project_id": project_id, "task_status": TaskStatus.READY.value},
        )
        mapped_task_dto = MappedTaskDTO(
            user_id=user.id,
            task_id=task.id,
            project_id=project_id,
            status=TaskStatus.MAPPED.name,
        )

        # Act / Assert
        with pytest.raises(MappingServiceError):
            await MappingService.unlock_task_after_mapping(
                mapped_task_dto, self.db, MagicMock()
            )

    @patch.object(ProjectService, "is_user_permitted_to_map")
    async def test_cant_unlock_a_task_you_dont_own(self, mock_mapping_permitted):
        # Arrange
        project, user, project_id = await create_canned_project(self.db)
        test_user = return_canned_user("TEST", 12)
        test_user = await create_canned_user(self.db, test_user)
        query = """
            SELECT * FROM tasks
            WHERE project_id = :project_id AND task_status = :task_status
        """
        task = await self.db.fetch_one(
            query=query,
            values={"project_id": project_id, "task_status": TaskStatus.READY.value},
        )
        lock_task_dto = LockTaskDTO(
            project_id=project_id, task_id=task.id, user_id=test_user.id
        )
        mock_mapping_permitted.return_value = True, "User allowed to map"
        await MappingService.lock_task_for_mapping(lock_task_dto, self.db)

        mapped_task_dto = MappedTaskDTO(
            user_id=user.id,
            task_id=task.id,
            project_id=project_id,
            status=TaskStatus.MAPPED.name,
        )

        # Act / Assert
        with pytest.raises(MappingServiceError):
            await MappingService.unlock_task_after_mapping(
                mapped_task_dto, self.db, MagicMock()
            )

    @patch.object(MappingService, "get_task_locked_by_user")
    async def test_if_new_state_not_acceptable_raise_error(self, mock_task):
        # Arrange
        self.task_stub.task_status = TaskStatus.LOCKED_FOR_MAPPING.value
        mock_task.return_value = self.task_stub
        self.mapped_task_dto.status = TaskStatus.LOCKED_FOR_VALIDATION.name

        # Act / Assert
        with pytest.raises(MappingServiceError):
            await MappingService.unlock_task_after_mapping(
                self.mapped_task_dto, self.db, MagicMock()
            )

    @patch.object(ProjectService, "is_user_permitted_to_map")
    async def test_unlock_with_comment_sets_history(self, mock_mapping_permitted):
        # Arrange
        project, user, project_id = await create_canned_project(self.db)
        query = """
            SELECT * FROM tasks
            WHERE project_id = :project_id AND task_status = :task_status
        """
        task = await self.db.fetch_one(
            query=query,
            values={"project_id": project_id, "task_status": TaskStatus.READY.value},
        )
        lock_task_dto = LockTaskDTO(
            project_id=project_id, task_id=task.id, user_id=user.id
        )
        mock_mapping_permitted.return_value = True, "User allowed to map"
        await MappingService.lock_task_for_mapping(lock_task_dto, self.db)
        mapped_task_dto = MappedTaskDTO(
            user_id=user.id,
            task_id=task.id,
            project_id=project_id,
            status=TaskStatus.MAPPED.name,
            comment="Test comment",
        )

        # Act
        await MappingService.unlock_task_after_mapping(
            mapped_task_dto, self.db, AsyncMock()
        )
        query = """
            SELECT * FROM task_history
            WHERE project_id = :project_id AND task_id = :task_id
        """
        task_history = await self.db.fetch_all(
            query=query, values={"project_id": project_id, "task_id": task.id}
        )

        # Assert
        assert task_history[1].action == TaskAction.COMMENT.name
        assert task_history[1].action_text == "Test comment"

    @patch.object(ProjectService, "is_user_permitted_to_map")
    async def test_unlock_with_status_change_sets_history(self, mock_mapping_permitted):
        # Arrange
        project, user, project_id = await create_canned_project(self.db)

        # Select a READY task
        query = """
            SELECT * FROM tasks
            WHERE project_id = :project_id AND task_status = :task_status
        """
        task = await self.db.fetch_one(
            query=query,
            values={"project_id": project_id, "task_status": TaskStatus.READY.value},
        )

        # Lock the task
        lock_task_dto = LockTaskDTO(
            project_id=project_id, task_id=task.id, user_id=user.id
        )
        mock_mapping_permitted.return_value = True, "User allowed to map"
        await MappingService.lock_task_for_mapping(lock_task_dto, self.db)

        # Prepare mapped task DTO without a comment, just a status change
        mapped_task_dto = MappedTaskDTO(
            user_id=user.id,
            task_id=task.id,
            project_id=project_id,
            status=TaskStatus.MAPPED.name,
        )

        # Act
        test_task = await MappingService.unlock_task_after_mapping(
            mapped_task_dto, self.db, AsyncMock()
        )

        query = """
            SELECT * FROM task_history
            WHERE project_id = :project_id AND task_id = :task_id
            ORDER BY id
        """
        task_history = await self.db.fetch_all(
            query=query, values={"project_id": project_id, "task_id": task.id}
        )

        # Assert
        assert test_task.task_status == TaskStatus.MAPPED.name
        assert task_history[0].action == TaskAction.LOCKED_FOR_MAPPING.name
        assert task_history[1].action == TaskAction.STATE_CHANGE.name
        assert task_history[1].action_text == TaskStatus.MAPPED.name

    @patch.object(ProjectService, "is_user_permitted_to_validate")
    @patch.object(TaskHistory, "get_last_action")
    async def test_task_is_undoable_if_last_change_made_by_you(
        self, last_action, mock_project
    ):
        # Arrange
        task_history = TaskHistory(1, 1, 1)
        task_history.user_id = 1
        last_action.return_value = task_history

        task = Task()
        task.task_status = TaskStatus.MAPPED.value
        task.mapped_by = 1

        # Act
        mock_project.return_value = (True, None)
        is_undoable = await MappingService._is_task_undoable(1, task, self.db)

        # Assert
        assert is_undoable

    @patch.object(ProjectService, "is_user_permitted_to_validate")
    @patch.object(TaskHistory, "get_last_action")
    async def test_task_is_not_undoable_if_last_change_not_made_by_you(
        self, last_action, mock_project
    ):
        # Arrange
        task_history = TaskHistory(1, 1, 1)
        task_history.user_id = 2
        last_action.return_value = task_history

        task = Task()
        task.task_status = TaskStatus.MAPPED.value
        task.mapped_by = 1

        # Act
        mock_project.return_value = (False, None)
        is_undoable = await MappingService._is_task_undoable(1, task, self.db)

        # Assert
        assert not is_undoable
