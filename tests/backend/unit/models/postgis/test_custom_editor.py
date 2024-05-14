from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import create_canned_project
from backend.models.postgis.custom_editors import CustomEditor, CustomEditorDTO


class TestCustomEditor(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.author_id = create_canned_project()
        self.custom_editor = CustomEditor()
        self.custom_editor.name = "Test custom editor"
        self.custom_editor.description = "Test descrption"
        self.custom_editor.url = "Test URL"
        self.test_project.custom_editor = self.custom_editor
        self.custom_editor.create()

    def test_get_by_project_id(self):
        # Act
        custom_editor = CustomEditor.get_by_project_id(self.test_project.id)

        # Assert
        self.assertEqual(custom_editor.project_id, self.test_project.id)
        self.assertEqual(custom_editor.name, self.custom_editor.name)
        self.assertEqual(custom_editor.description, self.custom_editor.description)
        self.assertEqual(custom_editor.url, self.custom_editor.url)

    def test_create_from_dto(self):
        # Arrange
        self.custom_editor.delete()
        custom_editor_dto = CustomEditorDTO()
        custom_editor_dto.name = self.custom_editor.name
        custom_editor_dto.description = self.custom_editor.description
        custom_editor_dto.url = self.custom_editor.url

        # Act
        custom_editor = CustomEditor.create_from_dto(
            self.test_project.id, custom_editor_dto
        )

        # Assert
        self.assertEqual(custom_editor.project_id, self.test_project.id)
        self.assertEqual(custom_editor.name, self.custom_editor.name)
        self.assertEqual(custom_editor.description, self.custom_editor.description)
        self.assertEqual(custom_editor.url, self.custom_editor.url)

    def test_update_editor(self):
        # Arrange
        self.test_project.custom_editor = self.custom_editor
        custom_editor_dto = CustomEditorDTO()
        custom_editor_dto.name = "Updated Name"
        custom_editor_dto.description = "Updated Description"
        custom_editor_dto.url = "Updated URL"

        # Act
        self.custom_editor.update_editor(custom_editor_dto)

        # Assert
        self.assertEqual(self.custom_editor.project_id, self.test_project.id)
        self.assertEqual(self.custom_editor.name, custom_editor_dto.name)
        self.assertEqual(self.custom_editor.description, custom_editor_dto.description)
        self.assertEqual(self.custom_editor.url, custom_editor_dto.url)

    def test_delete(self):
        # Act
        self.custom_editor.delete()

        # Assert
        custom_editor = CustomEditor.get_by_project_id(self.test_project.id)
        self.assertIsNone(custom_editor)

    def test_as_dto(self):
        # Act
        custom_editor_dto = self.custom_editor.as_dto()

        # Assert
        self.assertIsInstance(custom_editor_dto, CustomEditorDTO)
        self.assertEqual(self.custom_editor.project_id, self.test_project.id)
        self.assertEqual(self.custom_editor.name, custom_editor_dto.name)
        self.assertEqual(self.custom_editor.description, custom_editor_dto.description)
        self.assertEqual(self.custom_editor.url, custom_editor_dto.url)

    def test_clone_to_project(self):
        # Act
        test_new_project_id = 123456
        cloned_custom_editor = self.custom_editor.clone_to_project(test_new_project_id)

        # Assert
        self.assertEqual(test_new_project_id, cloned_custom_editor.project_id)
        self.assertEqual(self.custom_editor.name, cloned_custom_editor.name)
        self.assertEqual(
            self.custom_editor.description, cloned_custom_editor.description
        )
        self.assertEqual(self.custom_editor.url, cloned_custom_editor.url)
