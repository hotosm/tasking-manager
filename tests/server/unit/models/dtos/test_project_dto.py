import unittest
from schematics.exceptions import DataError
from server.models.dtos.project_dto import ProjectDTO
from server.models.dtos.mapping_dto import is_valid_mapped_status

class TestProjectDTO(unittest.TestCase):

    def test_project_with_unknown_mapping_type_is_invalid(self):

        project_dto = ProjectDTO()
        project_dto.mapping_types = ['BAD', 'DATA']

        # Act / Assert
        with self.assertRaises(DataError):
            project_dto.validate()
