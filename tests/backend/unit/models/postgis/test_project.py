from unittest.mock import MagicMock
from flask import current_app

from backend.exceptions import NotFound
from backend.models.dtos.project_dto import DraftProjectDTO
from backend.models.postgis.project import Project
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_project,
    return_canned_draft_project_json,
    create_canned_user,
    create_canned_organisation,
)


class TestProject(BaseTestCase):
    def test_clone_project_raises_error_if_project_not_found(self):
        # Arrange
        Project.query.get = MagicMock(return_value=None)
        # Act/Assert
        with self.assertRaises(NotFound):
            Project.clone(12, 777777)

    def test_clone_project_creates_copy_of_orig_project(self):
        # Arrange
        orig_project, author = create_canned_project()
        orig_project_info = orig_project.project_info.one()
        # Act
        new_proj = Project.clone(orig_project.id, author.id)
        new_proj_info = new_proj.project_info.one()
        # Assert
        self.assertEqual(orig_project.author_id, new_proj.author_id)
        self.assertEqual(orig_project.geometry, new_proj.geometry)
        self.assertEqual(orig_project_info.name, new_proj_info.name)

    def test_create_draft_project(self):
        # Arrange
        draft_project_dto = DraftProjectDTO(return_canned_draft_project_json())
        test_user = create_canned_user()  # Create user to assign as author of project
        test_org = (
            create_canned_organisation()
        )  # Create org with id "23" which is specified on draft project dto
        draft_project_dto.user_id = test_user.id
        draft_project_dto.organisation = test_org
        draft_project = Project()
        # Act/Assert
        draft_project.create_draft_project(draft_project_dto)

    def test_set_default_changeset_comment(self):
        # Arrange
        test_project = Project()
        expected_comment = current_app.config["DEFAULT_CHANGESET_COMMENT"]
        expected_comment = f"{expected_comment}-{test_project.id}"
        # Act
        test_project.set_default_changeset_comment()
        # Assert
        self.assertEqual(expected_comment, test_project.changeset_comment)

    def test_set_country_info(self):
        # Arrange
        test_project, _author_id = create_canned_project()
        # Act
        test_project.set_country_info()
        # Assert
        self.assertNotEqual(
            0, len(test_project.country), "Nominatim may have given a bad response"
        )
        self.assertEqual(["United Kingdom"], test_project.country)
