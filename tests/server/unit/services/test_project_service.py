import unittest
from unittest.mock import patch
from server.services.project_service import ProjectService, Project, NotFound, ProjectStatus, ProjectServiceError


class TestProjectService(unittest.TestCase):

    project_service = None

    @patch.object(Project, 'get')
    def set_up_service(self, mock_task, stub_project):
        """ Helper that sets ups the mapping service with the supplied project test stub"""
        mock_task.return_value = stub_project
        self.project_service = ProjectService(1)

    def test_project_service_raises_error_if_project_not_found(self):
        with self.assertRaises(NotFound):
            self.set_up_service(stub_project=None)

    def test_get_project_dto_for_mapping_raises_error_if_project_not_published(self):
        # Arrange
        test_project = Project()
        test_project.status = ProjectStatus.DRAFT.value
        self.set_up_service(stub_project=test_project)

        # Act / Assert
        with self.assertRaises(ProjectServiceError):
            self.project_service.get_project_dto_for_mapper('en')
