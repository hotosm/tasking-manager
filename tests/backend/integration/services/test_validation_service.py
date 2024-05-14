from backend.services.validator_service import (
    ValidatorService,
    ValidatorServiceError,
    TaskStatus,
    Task,
)
from backend.models.dtos.validator_dto import RevertUserTasksDTO
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import create_canned_project, return_canned_user


class TestValidationService(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = return_canned_user(username="test_user", id=123456789)
        self.test_user.create()
        self.test_project, self.test_author = create_canned_project()

    def test_validate_all_sets_counters_correctly(self):
        # Arrange
        total_mapped_tasks = self.test_project.tasks_mapped
        total_validated_tasks = self.test_project.tasks_validated
        # Act
        ValidatorService.validate_all_tasks(self.test_project.id, self.test_user.id)
        # Assert
        self.assertEqual(
            self.test_project.tasks_validated,
            total_mapped_tasks + total_validated_tasks,
        )
        self.assertEqual(self.test_project.tasks_mapped, 0)

    def test_invalidate_all_sets_counters_correctly(self):
        # Arrange
        mapped_tasks = self.test_project.tasks_mapped

        # Act
        ValidatorService.invalidate_all_tasks(self.test_project.id, self.test_user.id)

        # Assert
        self.assertEqual(mapped_tasks, self.test_project.tasks_mapped)
        self.assertEqual(0, self.test_project.tasks_validated)

    def test_mapped_by_and_validated_by_are_null_after_invalidating_all(self):
        ValidatorService.validate_all_tasks(self.test_project.id, self.test_user.id)
        ValidatorService.invalidate_all_tasks(self.test_project.id, self.test_user.id)

        for task in self.test_project.tasks:
            # Only check for validated tasks as there is one task is set as  bad imagery while creating test_project
            if task.task_status == TaskStatus.VALIDATED.value:
                self.assertIsNone(task.mapped_by)
                self.assertIsNone(task.validated_by)

    def test_mapped_by_and_validated_by_is_set_after_validating_all(self):
        tasks_to_validate = Task.query.filter(
            Task.project_id == self.test_project.id,
            Task.task_status == TaskStatus.MAPPED.value,
        ).all()
        ValidatorService.validate_all_tasks(self.test_project.id, self.test_user.id)
        for task in tasks_to_validate:
            self.assertIsNotNone(task.mapped_by)
            self.assertEqual(task.validated_by, self.test_user.id)

    def test_revert_user_tasks_requires_user_with_PM_permission_for_successful_operation(
        self,
    ):
        # Arrange
        revert_dto = RevertUserTasksDTO()
        revert_dto.project_id = self.test_project.id
        revert_dto.user_id = self.test_user.id
        revert_dto.action_by = self.test_user.id
        revert_dto.action = "VALIDATED"
        # Act/Assert
        with self.assertRaises(ValidatorServiceError):
            ValidatorService.revert_user_tasks(revert_dto)

    def test_revert_user_tasks_revert_validated_task_to_mapped_status(self):
        """
        Lets test this funtion for two tasks one by test_user and other by test_author.
        so that  we can test if the task validated by test_user is reverted to mapped status
        and task validated by test_author is not reverted to mapped status
        """
        # Arrange
        task_1 = Task.get(1, self.test_project.id)
        task_2 = Task.get(2, self.test_project.id)
        # Lock the task for mapping
        task_1.lock_task_for_mapping(self.test_user.id)
        task_2.lock_task_for_mapping(self.test_author.id)
        # Unlock the task
        task_1.unlock_task(self.test_user.id, new_state=TaskStatus.MAPPED)
        task_2.unlock_task(self.test_author.id, new_state=TaskStatus.MAPPED)
        # Lock the task for validation
        task_1.lock_task_for_validating(self.test_user.id)
        task_2.lock_task_for_validating(self.test_author.id)
        # Unlock the task
        task_1.unlock_task(self.test_user.id, new_state=TaskStatus.VALIDATED)
        task_2.unlock_task(self.test_author.id, new_state=TaskStatus.VALIDATED)
        # Create DTO
        revert_dto = RevertUserTasksDTO()
        revert_dto.project_id = self.test_project.id
        revert_dto.user_id = self.test_user.id
        revert_dto.action_by = self.test_author.id
        revert_dto.action = "VALIDATED"
        # Act
        ValidatorService.revert_user_tasks(revert_dto)
        # Assert
        # Check that the task is now mapped
        self.assertEqual(task_1.task_status, TaskStatus.MAPPED.value)
        # task_2 is validated by test_author so it should not be reverted to mapped status
        self.assertEqual(task_2.task_status, TaskStatus.VALIDATED.value)

    def test_revert_user_tasks_reverts_bad_imagery_tasks_to_ready(self):
        """
        Lets test this funtion for two tasks one by test_user and other by test_author.
        so that  we can test if the task set as bad imagery by test_user is reverted to ready status
        and task set as bad imagery by test_author is not reverted to ready status
        """
        # Arrange
        task_1 = Task.get(1, self.test_project.id)
        task_2 = Task.get(2, self.test_project.id)
        # Lock the task for mapping
        task_1.lock_task_for_mapping(self.test_user.id)
        task_2.lock_task_for_mapping(self.test_author.id)
        # Unlock the task
        task_1.unlock_task(self.test_user.id, new_state=TaskStatus.BADIMAGERY)
        task_2.unlock_task(self.test_author.id, new_state=TaskStatus.BADIMAGERY)
        # Create DTO
        revert_dto = RevertUserTasksDTO()
        revert_dto.project_id = self.test_project.id
        revert_dto.user_id = self.test_user.id
        revert_dto.action_by = self.test_author.id
        revert_dto.action = "BADIMAGERY"
        # Act
        ValidatorService.revert_user_tasks(revert_dto)
        # Assert
        # Check that the task is now ready
        self.assertEqual(task_1.task_status, TaskStatus.READY.value)
        # task_2 is set as bad imagery by test_author so it should not be reverted to ready status
        self.assertEqual(task_2.task_status, TaskStatus.BADIMAGERY.value)
