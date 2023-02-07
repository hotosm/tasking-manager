import xml.etree.ElementTree as ET

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_project,
    return_canned_user,
    create_canned_organisation,
    generate_encoded_token,
    add_manager_to_organisation,
)

from backend.models.postgis.statuses import UserRole, TaskStatus
from backend.services.project_service import ProjectService
from backend.models.postgis.task import Task


class TestGetTasksQueriesJsonAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.url = f"/api/v2/projects/{self.test_project.id}/tasks/"

    def test_returns_404_if_project_does_not_exist(self):
        """ Test that a 404 is returned if the project does not exist. """
        # Act
        response = self.client.get("/api/projects/999/tasks")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_all_tasks_if_task_ids_not_specified(self):
        """ Test that all tasks are returned if no task_ids are specified. """
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json.keys(), {"type", "features"})
        self.assertEqual(response.json["type"], "FeatureCollection")
        self.assertEqual(len(response.json["features"]), 4)

    def test_returns_only_specified_tasks_if_task_ids_specified(self):
        """ Test that only the specified tasks are returned if task_ids are specified. """
        # Act
        response = self.client.get(self.url + "?tasks=1,2")
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["features"]), 2)
        self.assertEqual(response.json["features"][0]["properties"]["taskId"], 1)
        self.assertEqual(response.json["features"][1]["properties"]["taskId"], 2)

    def test_returns_tasks_as_file_id_as_file_set_true(self):
        """ Test that the tasks are returned with the file_id as the file if file_set is true. """
        # Act
        response = self.client.get(self.url + "?as_file=true")
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Content-Type"], "application/json")
        self.assertEqual(
            response.headers["Content-Disposition"],
            f"attachment; filename={self.test_project.id}-tasks.geojson",
        )
        self.assertEqual(response.json.keys(), {"type", "features"})
        self.assertEqual(response.json["type"], "FeatureCollection")
        self.assertEqual(len(response.json["features"]), 4)


class TestDeleteTasksJsonAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.url = f"/api/v2/projects/{self.test_project.id}/tasks/"
        self.test_user = return_canned_user("test_user", 11111)
        self.test_user.create()
        self.test_user_access_token = generate_encoded_token(self.test_user.id)
        self.test_author_access_token = generate_encoded_token(self.test_author.id)
        self.test_organization = create_canned_organisation()
        self.test_project.organization = self.test_organization
        self.test_project.save()

    def test_returns_401_if_not_authorized(self):
        """ Test that a 401 is returned if the user is not authorized. """
        # Act
        response = self.client.delete(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_403_if_user_not_admin(self):
        """ Test that a 403 is returned if the user is not a project manager. """
        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.test_user_access_token}
        )
        # Assert
        self.assertEqual(response.status_code, 403)

    def test_returns_404_if_project_does_not_exist(self):
        """ Test that a 404 is returned if the project does not exist. """
        # Act
        response = self.client.delete("/api/projects/999/tasks")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_even_org_manager_cannot_delete_tasks(self):
        """ Test that an org manager cannot delete tasks. """
        # Arrange
        add_manager_to_organisation(self.test_organization, self.test_user)
        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.test_user_access_token}
        )
        # Assert
        self.assertEqual(response.status_code, 403)

    def test_returns_400_if_no_task_ids_specified(self):
        """ Test that a 400 is returned if no task_ids are specified. """
        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        # Act
        response = self.client.delete(
            self.url,
            headers={"Authorization": self.test_user_access_token},
            json={},
        )
        # Assert
        self.assertEqual(response.status_code, 400)

    def test_returns_404_if_task_not_found(self):
        """ Test that a 400 is returned if the task is not found. """
        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        # Act
        response = self.client.delete(
            self.url,
            headers={"Authorization": self.test_user_access_token},
            json={"tasks": [999]},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_deletes_specified_tasks_if_user_admin(self):
        """ Test that the specified tasks are deleted. """
        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        # Act
        response = self.client.delete(
            self.url,
            headers={"Authorization": self.test_user_access_token},
            json={"tasks": [1, 2]},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        project_tasks = ProjectService.get_project_tasks(self.test_project.id, None)
        self.assertEqual(len(project_tasks["features"]), 2)
        self.assertEqual(project_tasks["features"][0]["properties"]["taskId"], 3)
        self.assertEqual(project_tasks["features"][1]["properties"]["taskId"], 4)


class TestTaskRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_author_access_token = generate_encoded_token(self.test_author.id)
        self.url = f"/api/v2/projects/{self.test_project.id}/tasks/1/"

    def test_returrns_404_if_project_does_not_exist(self):
        """ Test that a 404 is returned if the project does not exist. """
        # Act
        response = self.client.get("/api/projects/999/tasks/1")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_404_if_task_does_not_exist(self):
        """ Test that a 404 is returned if the task does not exist. """
        # Act
        response = self.client.get(f"/api/projects/{self.test_project.id}/tasks/999")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_200_if_task_exists(self):
        """ Test that a 200 is returned if the task exists. """
        # Lets add task history
        task = Task.get(1, self.test_project.id)
        task.lock_task_for_validating(self.test_author.id)
        task.unlock_task(self.test_author.id, TaskStatus.VALIDATED, "Test comment")
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.json.keys()),
            set(
                {
                    "taskId",
                    "projectId",
                    "taskStatus",
                    "taskHistory",
                    "taskAnnotation",
                    "perTaskInstructions",
                    "autoUnlockSeconds",
                    "lastUpdated",
                    "numberOfComments",
                }
            ),
        )
        self.assertEqual(response.json["taskId"], 1)
        self.assertEqual(response.json["projectId"], self.test_project.id)
        self.assertEqual(response.json["taskStatus"], TaskStatus.VALIDATED.name)
        self.assertEqual(len(response.json["taskHistory"]), 3)
        self.assertEqual(
            response.json["taskHistory"][2]["action"], "LOCKED_FOR_VALIDATION"
        )
        self.assertEqual(response.json["taskHistory"][1]["action"], "COMMENT")
        self.assertEqual(response.json["taskHistory"][0]["action"], "STATE_CHANGE")


class TestTasksQueriesGpxAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_author_access_token = generate_encoded_token(self.test_author.id)
        self.url = f"/api/v2/projects/{self.test_project.id}/tasks/queries/gpx/"

    def test_returns_404_if_project_does_not_exist(self):
        """ Test that a 404 is returned if the project does not exist. """
        # Act
        response = self.client.get("/api/projects/999/tasks/queries/gpx")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_all_tasks_if_no_tasks_specified(self):
        """ Test that all tasks are returned if no tasks are specified. """
        # Act
        response = self.client.get(self.url)
        # Assert
        ns = {"gpx": "http://www.topografix.com/GPX/1/1"}
        self.assertEqual(response.status_code, 200)
        response_xml = ET.fromstring(response.get_data(as_text=True))
        self.assertEqual(
            response_xml.attrib, {"version": "1.1", "creator": "HOT Tasking Manager"}
        )
        trk = response_xml.find("gpx:trk", namespaces=ns)
        self.assertEqual(
            trk.find("gpx:name", ns).text,
            f"Task for project {self.test_project.id}. Do not edit outside of this area!",
        )
        self.assertEqual(
            len([i for i in trk.findall("gpx:trkseg", ns)]), 4
        )  # Since project has 4 tasks

    def test_returns_gpx_for_specified_tasks(self):
        """ Test that the specified tasks are returned. """
        # Act
        response = self.client.get(self.url + "?tasks=1,2")
        # Assert
        ns = {"gpx": "http://www.topografix.com/GPX/1/1"}
        self.assertEqual(response.status_code, 200)
        response_xml = ET.fromstring(response.get_data(as_text=True))
        self.assertEqual(
            response_xml.attrib, {"version": "1.1", "creator": "HOT Tasking Manager"}
        )
        trk = response_xml.find("gpx:trk", namespaces=ns)
        self.assertEqual(
            trk.find("gpx:name", ns).text,
            f"Task for project {self.test_project.id}. Do not edit outside of this area!",
        )
        self.assertEqual(
            len([i for i in trk.findall("gpx:trkseg", ns)]), 2
        )  # Since we only asked for tasks 1 and 2

    def test_returns_file_if_as_file_set_true(self):
        """ Test that the file is returned if the as_file parameter is set to true. """
        # Act
        response = self.client.get(self.url + "?as_file=true")
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Content-Type"], "text.xml")
        self.assertEqual(
            response.headers["Content-Disposition"],
            f"attachment; filename=HOT-project-{self.test_project.id}.gpx",
        )


class TestTasksQueriesXmlAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_author_access_token = generate_encoded_token(self.test_author.id)
        self.url = f"/api/v2/projects/{self.test_project.id}/tasks/queries/xml/"

    def test_returns_404_if_project_does_not_exist(self):
        """ Test that a 404 is returned if the project does not exist. """
        # Act
        response = self.client.get("/api/projects/999/tasks/queries/xml")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_all_tasks_if_no_tasks_specified(self):
        """ Test that all tasks are returned if no tasks are specified. """
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        response_xml = ET.fromstring(response.get_data(as_text=True))
        self.assertEqual(
            response_xml.attrib,
            {"version": "0.6", "upload": "never", "creator": "HOT Tasking Manager"},
        )
        self.assertEqual(
            len([i for i in response_xml.findall("way")]), 4
        )  # Since project has 4 tasks

    def test_returns_xml_for_specified_tasks(self):
        """ Test that the specified tasks are returned. """
        # Act
        response = self.client.get(self.url + "?tasks=1,2")
        # Assert
        self.assertEqual(response.status_code, 200)
        response_xml = ET.fromstring(response.get_data(as_text=True))
        self.assertEqual(
            response_xml.attrib,
            {"version": "0.6", "upload": "never", "creator": "HOT Tasking Manager"},
        )
        self.assertEqual(
            len([i for i in response_xml.findall("way")]), 2
        )  # Since we are only requesting 2 tasks

    def test_returns_file_if_as_file_set_true(self):
        """ Test that the file is returned if the as_file parameter is set to true. """
        # Act
        response = self.client.get(self.url + "?as_file=true")
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Content-Type"], "text.xml")
        self.assertEqual(
            response.headers["Content-Disposition"],
            f"attachment; filename=HOT-project-{self.test_project.id}.osm",
        )
