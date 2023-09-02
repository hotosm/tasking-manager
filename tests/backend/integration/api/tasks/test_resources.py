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
from backend.services.project_admin_service import ProjectAdminService
from backend.models.postgis.task import Task


class TestGetTasksQueriesJsonAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.url = f"/api/v2/projects/{self.test_project.id}/tasks/"

    def test_returns_404_if_project_does_not_exist(self):
        """Test that a 404 is returned if the project does not exist."""
        # Act
        response = self.client.get("/api/v2/projects/11111/tasks/")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_all_tasks_if_task_ids_not_specified(self):
        """Test that all tasks are returned if no task_ids are specified."""
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json.keys(), {"type", "features"})
        self.assertEqual(response.json["type"], "FeatureCollection")
        self.assertEqual(len(response.json["features"]), 4)

    def test_returns_only_specified_tasks_if_task_ids_specified(self):
        """Test that only the specified tasks are returned if task_ids are specified."""
        # Act
        response = self.client.get(self.url + "?tasks=1,2")
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["features"]), 2)
        self.assertEqual(response.json["features"][0]["properties"]["taskId"], 1)
        self.assertEqual(response.json["features"][1]["properties"]["taskId"], 2)

    def test_returns_tasks_as_file_id_as_file_set_true(self):
        """Test that the tasks are returned with the file_id as the file if file_set is true."""
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
        """Test that a 401 is returned if the user is not authorized."""
        # Act
        response = self.client.delete(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_403_if_user_not_admin(self):
        """Test that a 403 is returned if the user is not a project manager."""
        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.test_user_access_token}
        )
        # Assert
        self.assertEqual(response.status_code, 403)

    def test_returns_404_if_project_does_not_exist(self):
        """Test that a 404 is returned if the project does not exist."""
        # Arrange
        self.test_user.role = UserRole.ADMIN.value  # Since only admins can delete tasks
        self.test_user.save()
        body = {"tasks": [1, 2]}
        # Act
        response = self.client.delete(
            "/api/v2/projects/11111/tasks/",
            headers={"Authorization": self.test_user_access_token},
            json=body,
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_even_org_manager_cannot_delete_tasks(self):
        """Test that an org manager cannot delete tasks."""
        # Arrange
        add_manager_to_organisation(self.test_organization, self.test_user)
        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.test_user_access_token}
        )
        # Assert
        self.assertEqual(response.status_code, 403)

    def test_returns_400_if_no_task_ids_specified(self):
        """Test that a 400 is returned if no task_ids are specified."""
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
        """Test that a 400 is returned if the task is not found."""
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
        """Test that the specified tasks are deleted."""
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
        """Test that a 404 is returned if the project does not exist."""
        # Act
        response = self.client.get("/api/v2/projects/11111/tasks/1/")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_404_if_task_does_not_exist(self):
        """Test that a 404 is returned if the task does not exist."""
        # Act
        response = self.client.get(
            f"/api/v2/projects/{self.test_project.id}/tasks/999/"
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_200_if_task_exists(self):
        """Test that a 200 is returned if the task exists."""
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
        """Test that a 404 is returned if the project does not exist."""
        # Act
        response = self.client.get("/api/v2/projects/11111/tasks/queries/gpx/")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_all_tasks_if_no_tasks_specified(self):
        """Test that all tasks are returned if no tasks are specified."""
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
        """Test that the specified tasks are returned."""
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
        """Test that the file is returned if the as_file parameter is set to true."""
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
        """Test that a 404 is returned if the project does not exist."""
        # Act
        response = self.client.get("/api/v2/projects/11111/tasks/queries/xml/")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_all_tasks_if_no_tasks_specified(self):
        """Test that all tasks are returned if no tasks are specified."""
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
        """Test that the specified tasks are returned."""
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
        """Test that the file is returned if the as_file parameter is set to true."""
        # Act
        response = self.client.get(self.url + "?as_file=true")
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Content-Type"], "text.xml")
        self.assertEqual(
            response.headers["Content-Disposition"],
            f"attachment; filename=HOT-project-{self.test_project.id}.osm",
        )


class TestTasksQueriesOwnInvalidatedAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_author_access_token = generate_encoded_token(self.test_author.id)
        self.test_user = return_canned_user("TEST USER", 11111)
        self.test_user.create()
        self.test_user_access_token = generate_encoded_token(self.test_user.id)
        self.url = (
            f"/api/v2/projects/{self.test_user.username}/tasks/queries/own/invalidated/"
        )

    @staticmethod
    def invalidate_task(task: Task, mapper_id: int, validator_id: int):
        """
        Helper function to invalidate a task.
        ----------------
        Parameters:
        task: Task object
        mapper_id: int
        validator_id: int
        """
        if task.task_status == TaskStatus.MAPPED.value:
            task.task_status = TaskStatus.READY.value
            task.update()

        task.lock_task_for_mapping(mapper_id)
        task.unlock_task(mapper_id, TaskStatus.MAPPED)
        task.lock_task_for_validating(validator_id)
        task.unlock_task(validator_id, TaskStatus.INVALIDATED)

    def test_returns_401_if_user_not_authorized(self):
        """Test that a 401 is returned if the user is not authorized."""
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_404_if_user_does_not_exist(self):
        """Test that a 404 is returned if the user does not exist."""
        # Act
        response = self.client.get(
            "/api/v2/projects/non_existent/tasks/queries/own/invalidated/",
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_returns_invalidated_tasks_mapped_by_user_if_as_validator_set_false(self):
        """
        Test that the invalidated tasks mapped by user are returned if the as_validator parameter is set to false.
        """
        # Arrange
        # Lets map a task by test user
        task = Task.get(2, self.test_project.id)
        TestTasksQueriesOwnInvalidatedAPI.invalidate_task(
            task, self.test_user.id, self.test_author.id
        )
        # Act
        response = self.client.get(
            self.url + "?asValidator=false",
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["pagination"]["total"], 1)
        self.assertEqual(len(response.json["invalidatedTasks"]), 1)
        self.assertEqual(
            response.json["invalidatedTasks"][0]["taskId"], 2
        )  # Since we invalidated task 2

    def test_returns_tasks_invalidated_by_user_if_as_validator_set_true(self):
        """
        Test that the tasks invalidated by user are returned if the as_validator parameter is set to true.
        """
        # Arrange
        # Lets map a task by test author and invalidate it by test user
        task = Task.get(2, self.test_project.id)
        TestTasksQueriesOwnInvalidatedAPI.invalidate_task(
            task, self.test_author.id, self.test_user.id
        )
        # Act
        response = self.client.get(
            self.url + "?asValidator=true",
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["pagination"]["total"], 1)
        self.assertEqual(len(response.json["invalidatedTasks"]), 1)
        self.assertEqual(response.json["invalidatedTasks"][0]["taskId"], 2)

    def returns_404_if_no_tasks_found(self):
        """Test that a 404 is returned if no tasks are found."""
        # Act

        response = self.client.get(
            self.url + "?asValidator=true",
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_sort_by_sorts_task_by_specified_fields(self):
        """Test that the tasks are sorted by the specified_fields."""
        # Arrange
        test_project_2, _ = create_canned_project()
        test_project_3, _ = create_canned_project()
        # Lets map a task by test author and invalidate it by test user
        task_1 = Task.get(2, self.test_project.id)
        TestTasksQueriesOwnInvalidatedAPI.invalidate_task(
            task_1, self.test_author.id, self.test_user.id
        )
        task_3 = Task.get(2, test_project_3.id)
        TestTasksQueriesOwnInvalidatedAPI.invalidate_task(
            task_3, self.test_author.id, self.test_user.id
        )
        task_2 = Task.get(2, test_project_2.id)
        TestTasksQueriesOwnInvalidatedAPI.invalidate_task(
            task_2, self.test_author.id, self.test_user.id
        )
        # Sort by projectId in ascending order
        # Act
        response = self.client.get(
            self.url + "?asValidator=true&sortBy=projectId&sortDirection=asc",
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["pagination"]["total"], 3)
        self.assertEqual(len(response.json["invalidatedTasks"]), 3)
        self.assertEqual(
            response.json["invalidatedTasks"][0]["projectId"], self.test_project.id
        )
        self.assertEqual(
            response.json["invalidatedTasks"][1]["projectId"], test_project_2.id
        )
        self.assertEqual(
            response.json["invalidatedTasks"][2]["projectId"], test_project_3.id
        )
        # Act
        # Sort by projectId in descending order
        response = self.client.get(
            self.url + "?asValidator=true&sortBy=projectId&sortDirection=desc",
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["pagination"]["total"], 3)
        self.assertEqual(len(response.json["invalidatedTasks"]), 3)
        self.assertEqual(
            response.json["invalidatedTasks"][0]["projectId"], test_project_3.id
        )
        self.assertEqual(
            response.json["invalidatedTasks"][1]["projectId"], test_project_2.id
        )
        self.assertEqual(
            response.json["invalidatedTasks"][2]["projectId"], self.test_project.id
        )
        # Act
        # Sort by updatedDate in ascending order
        response = self.client.get(
            self.url + "?asValidator=true&sortBy=updatedDate&sortDirection=asc",
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["pagination"]["total"], 3)
        self.assertEqual(len(response.json["invalidatedTasks"]), 3)
        self.assertEqual(
            response.json["invalidatedTasks"][0]["projectId"], self.test_project.id
        )
        self.assertEqual(
            response.json["invalidatedTasks"][1]["projectId"], test_project_3.id
        )
        self.assertEqual(
            response.json["invalidatedTasks"][2]["projectId"], test_project_2.id
        )
        # Act
        # Sort by updatedDate in descending order
        response = self.client.get(
            self.url + "?asValidator=true&sortBy=updatedDate&sortDirection=desc",
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["pagination"]["total"], 3)
        self.assertEqual(len(response.json["invalidatedTasks"]), 3)
        self.assertEqual(
            response.json["invalidatedTasks"][0]["projectId"], test_project_2.id
        )
        self.assertEqual(
            response.json["invalidatedTasks"][1]["projectId"], test_project_3.id
        )
        self.assertEqual(
            response.json["invalidatedTasks"][2]["projectId"], self.test_project.id
        )

    def test_filters_by_closed(self):
        """Test that the tasks are filtered by closed."""
        # Arrange
        # Lets map a task by test author and invalidate it by test user
        task_1 = Task.get(2, self.test_project.id)
        TestTasksQueriesOwnInvalidatedAPI.invalidate_task(
            task_1, self.test_author.id, self.test_user.id
        )
        # Act
        response = self.client.get(
            self.url + "?asValidator=true&closed=true",
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json["pagination"]["total"], 0
        )  # No closed invalidated tasks
        self.assertEqual(len(response.json["invalidatedTasks"]), 0)

        # Arrange
        # Let's remap the task and validate it which will close it
        task_1.lock_task_for_mapping(self.test_user.id)
        task_1.unlock_task(self.test_user.id, TaskStatus.MAPPED)
        task_1.lock_task_for_validating(self.test_user.id)
        task_1.unlock_task(self.test_user.id, TaskStatus.VALIDATED)
        # Act
        response = self.client.get(
            self.url + "?asValidator=true&closed=true",
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["pagination"]["total"], 1)
        self.assertEqual(len(response.json["invalidatedTasks"]), 1)
        self.assertEqual(response.json["invalidatedTasks"][0]["taskId"], task_1.id)


class TestTasksQueriesMappedAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_user = return_canned_user("TEST USER", 1111111)
        self.test_user.create()
        self.url = f"/api/v2/projects/{self.test_project.id}/tasks/queries/mapped/"

    def test_returns_404_if_project_does_not_exist(self):
        """Test that the endpoint returns 404 if the project does not exist."""
        # Arrange
        # Act
        response = self.client.get("/api/v2/projects/999999/tasks/queries/mapped/")
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_get_mapped_tasks(self):
        # Arrange
        # Lets reset all tasks in a project to be available for mapping
        ProjectAdminService.reset_all_tasks(self.test_project.id, self.test_author.id)
        # Lets map a tasks
        task_1 = Task.get(1, self.test_project.id)
        task_2 = Task.get(2, self.test_project.id)
        task_1.lock_task_for_mapping(self.test_user.id)
        task_1.unlock_task(self.test_user.id, TaskStatus.MAPPED)
        task_2.lock_task_for_mapping(self.test_author.id)
        task_2.unlock_task(self.test_author.id, TaskStatus.MAPPED)
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json["mappedTasks"][0]["username"], self.test_user.username
        )
        self.assertEqual(
            response.json["mappedTasks"][1]["username"], self.test_author.username
        )
        self.assertEqual(response.json["mappedTasks"][0]["mappedTaskCount"], 1)
        self.assertEqual(response.json["mappedTasks"][1]["mappedTaskCount"], 1)
        self.assertEqual(response.json["mappedTasks"][0]["tasksMapped"], [1])
        self.assertEqual(response.json["mappedTasks"][1]["tasksMapped"], [2])
