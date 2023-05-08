from schematics.exceptions import DataError
from backend.models.dtos.mapping_dto import MappedTaskDTO
from backend.models.postgis.statuses import TaskStatus
from tests.backend.base import BaseTestCase


class TestMappingDTO(BaseTestCase):
    def test_mapped_task_with_validated_status_is_invalid(self):
        mapped_task = MappedTaskDTO()
        mapped_task.task_id = 1
        mapped_task.project_id = 1
        mapped_task.status = TaskStatus.VALIDATED.name

        # Act / Assert
        with self.assertRaises(DataError):
            mapped_task.validate()

    def test_mapped_task_with_unknown_status_raises_error(self):
        # Arrange
        mapped_task = MappedTaskDTO()
        mapped_task.task_id = 1
        mapped_task.project_id = 1
        mapped_task.status = "IAIN"

        # Act / Assert
        with self.assertRaises(DataError):
            mapped_task.validate()
