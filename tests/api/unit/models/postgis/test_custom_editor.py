import pytest
from backend.models.postgis.custom_editors import CustomEditor, CustomEditorDTO
from tests.api.helpers.test_helpers import create_canned_project


@pytest.mark.anyio
class TestCustomEditor:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        """Setup test database fixture."""
        assert db_connection_fixture is not None, "Database connection is not available"
        test_project, author_id, project_id = await create_canned_project(
            db_connection_fixture
        )

        custom_editor_dto = CustomEditorDTO(
            name="Test custom editor",
            description="Test description",
            url="Test URL",
        )

        request.cls.db = db_connection_fixture
        request.cls.test_project = test_project
        request.cls.project_id = project_id
        request.cls.author_id = author_id
        request.cls.custom_editor_dto = custom_editor_dto

        await CustomEditor.create_from_dto(project_id, custom_editor_dto, self.db)

    async def test_get_by_project_id(self):
        """Test fetching a custom editor by project ID."""
        custom_editor = await CustomEditor.get_by_project_id(self.project_id, self.db)

        assert custom_editor is not None
        assert custom_editor.project_id == self.project_id
        assert custom_editor.name == self.custom_editor_dto.name
        assert custom_editor.description == self.custom_editor_dto.description
        assert custom_editor.url == self.custom_editor_dto.url

    async def test_update_editor(self):
        """Test updating a custom editor from DTO."""
        custom_editor_dto = CustomEditorDTO(
            name="Updated Name",
            description="Updated Description",
            url="Updated URL",
        )

        await CustomEditor.update_editor(self.project_id, custom_editor_dto, self.db)

        updated_editor = await CustomEditor.get_by_project_id(self.project_id, self.db)

        assert updated_editor is not None
        assert updated_editor.project_id == self.project_id
        assert updated_editor.name == custom_editor_dto.name
        assert updated_editor.description == custom_editor_dto.description
        assert updated_editor.url == custom_editor_dto.url

    async def test_delete(self):
        """Test deleting a custom editor."""
        await CustomEditor.delete(self.project_id, self.db)
        custom_editor = await CustomEditor.get_by_project_id(self.project_id, self.db)

        assert custom_editor is None
