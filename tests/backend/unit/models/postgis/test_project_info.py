from backend.models.postgis.project_info import ProjectInfo
from tests.backend.base import BaseTestCase


class TestProjectInfo(BaseTestCase):
    def test_create_from_name(self):
        # Arrange
        name = "Test Project"
        # Act
        project_info = ProjectInfo.create_from_name(name)
        # Assert
        self.assertEqual(name, project_info.name)
