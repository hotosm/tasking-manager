import pytest
from backend.models.postgis.project_info import ProjectInfo


@pytest.mark.anyio
class TestProjectInfo:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        """Setup test database fixture."""
        assert db_connection_fixture is not None, "Database connection is not available"
        request.cls.db = db_connection_fixture

    async def test_create_from_name(self):
        """Test creating a project info instance from a name."""
        # Arrange
        name = "Test Project"

        # Act
        project_info = ProjectInfo.create_from_name(name)

        # Assert
        assert project_info is not None
        assert project_info.name == name
