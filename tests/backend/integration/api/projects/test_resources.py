import geojson

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    add_manager_to_organisation,
    create_canned_team,
    add_user_to_team,
    assign_team_to_project,
    create_canned_organisation,
    create_canned_project,
    generate_encoded_token,
    return_canned_user,
    return_canned_draft_project_json,
)
from backend.models.postgis.utils import NotFound
from backend.models.postgis.statuses import (
    UserRole,
    ProjectStatus,
    TeamMemberFunctions,
    TeamRoles,
)
from backend.services.project_service import ProjectService, ProjectAdminService
from backend.models.dtos.project_dto import (
    is_known_project_status,
    is_known_project_priority,
    is_known_project_difficulty,
    is_known_editor,
    is_known_mapping_type,
    is_known_task_creation_mode,
    is_known_validation_permission,
    is_known_mapping_permission,
)


class TestDeleteProjectsRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.url = f"/api/v2/projects/{self.test_project.id}/"
        self.test_user = return_canned_user(username="Test User", id=11111)
        self.test_user.create()
        test_organistion = create_canned_organisation()
        self.test_project.organisation = test_organistion
        self.test_project.save()
        self.author_session_token = generate_encoded_token(self.test_author.id)
        self.user_session_token = generate_encoded_token(self.test_user.id)

    def test_delete_project_returns_401_without_token(self):
        "Test returns 401 on request without session token."
        # Act
        response = self.client.delete(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_delete_project_returns_403_on_if_request_by_unauthorized_user(self):
        "Test Requesting user must have at least PM role on project"
        # Arrange
        # Reset all tasks to READY so that project can be deleted
        ProjectAdminService.reset_all_tasks(self.test_project.id, self.test_user.id)
        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json["SubCode"], "UserPermissionError")

    def test_project_with_mapped_tasks_cannot_be_deleted(self):
        "Test project with mapped tasks cannot be deleted"
        # Arrange
        # Only admin and org manager can delete project
        add_manager_to_organisation(self.test_project.organisation, self.test_author)
        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.author_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json["SubCode"], "HasMappedTasks")

    def test_org_manager_can_delete_project(self):
        "Test user with PM role can delete project"

        # Arrange
        # Only admin and org manager can delete project
        add_manager_to_organisation(self.test_project.organisation, self.test_author)
        # Reset all tasks to READY so that project can be deleted
        ProjectAdminService.reset_all_tasks(self.test_project.id, self.test_user.id)

        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.author_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        with self.assertRaises(NotFound):
            ProjectService.get_project_by_id(self.test_project.id)

    def test_admin_can_delete_project(self):
        "Test project can be deleted by admins."

        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        # Reset all tasks to READY so that project can be deleted
        ProjectAdminService.reset_all_tasks(self.test_project.id, self.test_user.id)

        # Act
        response = self.client.delete(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        with self.assertRaises(NotFound):
            ProjectService.get_project_by_id(self.test_project.id)


class TestCreateProjectsRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_user = return_canned_user(username="Test User", id=11111)
        self.test_user.create()
        self.test_organisation = create_canned_organisation()
        self.url = "/api/v2/projects/"
        self.session_token = generate_encoded_token(self.test_user.id)
        self.canned_project_json = return_canned_draft_project_json()

    @staticmethod
    def assert_draft_project_response(project_response, expected_project):
        "Test project response"
        assert expected_project["organisation"] == project_response.organisation_id
        # Only assert coordinates as the rest of the geometry is not converted before saving to db.
        expected_aoi = [
            expected_project["areaOfInterest"]["features"][0]["geometry"]["coordinates"]
        ]
        assert (
            expected_aoi
            == project_response.get_aoi_geometry_as_geojson()["coordinates"]
        )
        assert project_response.status == ProjectStatus.DRAFT.value
        assert expected_project["projectName"] == project_response.get_project_title(
            "en"
        )

    def test_create_project_returns_401_without_token(self):
        "Test returns 401 on request without session token."
        # Act
        response = self.client.post(self.url, json=self.canned_project_json)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_create_project_returns_403_on_if_request_by_unauthorized_user(self):
        "Test Requesting user must have at least PM role on project"
        # Act
        response = self.client.post(
            self.url,
            json=self.canned_project_json,
            headers={"Authorization": self.session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json["SubCode"], "NotPermittedToCreate")

    def test_create_project_returns_400_if_invalid_json(self):
        "Test returns 400 if invalid json"
        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        # Act
        response = self.client.post(
            self.url, json={}, headers={"Authorization": self.session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "InvalidData")

    def test_org_manager_can_create_project(self):
        "Test user with PM role can create project"
        # Arrange
        add_manager_to_organisation(self.test_organisation, self.test_user)
        # Act
        response = self.client.post(
            self.url,
            json=self.canned_project_json,
            headers={"Authorization": self.session_token},
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("projectId", response.json)
        draft_project = ProjectService.get_project_by_id(response.json["projectId"])
        TestCreateProjectsRestAPI.assert_draft_project_response(
            draft_project, self.canned_project_json
        )

    def test_admin_can_create_project(self):
        "Test project can be created by admins."
        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        # Act
        response = self.client.post(
            self.url,
            json=self.canned_project_json,
            headers={"Authorization": self.session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 201)
        self.assertIn("projectId", response.json)
        draft_project = ProjectService.get_project_by_id(response.json["projectId"])
        TestCreateProjectsRestAPI.assert_draft_project_response(
            draft_project, self.canned_project_json
        )


class TestGetProjectsRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_project.status = ProjectStatus.PUBLISHED.value
        self.url = f"/api/v2/projects/{self.test_project.id}/"
        self.test_user = return_canned_user(username="Test User", id=11111)
        self.test_user.create()
        test_organistion = create_canned_organisation()
        self.test_project.organisation = test_organistion
        self.test_project.save()
        self.user_session_token = generate_encoded_token(self.test_user.id)

    @staticmethod
    def assert_project_response(project_response, expected_project, assert_type="full"):
        "Test project response"
        assert expected_project.id == project_response["projectId"]
        assert (
            expected_project.get_project_title(expected_project.default_locale)
            == project_response["projectInfo"]["name"]
        )
        # Since some of the fields are not returned in summary mode we need to skip them
        if assert_type != "summary":
            assert geojson.is_valid(project_response["areaOfInterest"])
            assert ["type", "coordinates"] == list(
                project_response["areaOfInterest"].keys()
            )

            assert geojson.is_valid(project_response["tasks"])
            assert (
                is_known_task_creation_mode(project_response["taskCreationMode"])
                is None
            )
            assert "activeMappers" in project_response
            assert "interests" in project_response
            assert "priorityAreas" in project_response
            assert "projectInfoLocales" in project_response

        else:  # assert fields that are returned in summary mode are present
            assert "aoiCentroid" in project_response
            assert "shortDescription" in project_response
            assert "allowedUsernames" in project_response

        assert [
            "locale",
            "name",
            "shortDescription",
            "description",
            "instructions",
            "perTaskInstructions",
        ] == list(project_response["projectInfo"].keys())

        # As these returns validation functions returns None for valid values assert that they are None
        assert is_known_project_status(project_response["status"]) is None
        assert is_known_project_priority(project_response["projectPriority"]) is None
        assert is_known_project_difficulty(project_response["difficulty"]) is None

        for mapping_type in project_response["mappingTypes"]:
            assert is_known_mapping_type(mapping_type) is None

        for editor in set(
            project_response["mappingEditors"] + project_response["validationEditors"]
        ):
            assert is_known_editor(editor) is None
        assert (
            is_known_mapping_permission(project_response["mappingPermission"]) is None
        )
        assert (
            is_known_validation_permission(project_response["validationPermission"])
            is None
        )

        assert expected_project.private == project_response["private"]
        assert (
            expected_project.changeset_comment == project_response["changesetComment"]
        )
        assert expected_project.default_locale == project_response["defaultLocale"]
        assert expected_project.organisation_id == project_response["organisation"]
        assert expected_project.author.username == project_response["author"]

        assert "enforceRandomTaskSelection" in project_response
        assert "osmchaFilterId" in project_response
        assert "dueDate" in project_response
        assert "imagery" in project_response
        assert "idPresets" in project_response
        assert "extraIdParams" in project_response
        assert "rapidPowerUser" in project_response
        assert "mappingTypes" in project_response
        assert "campaigns" in project_response
        assert "organisationName" in project_response
        assert "organisationSlug" in project_response
        assert "organisationLogo" in project_response
        assert "countryTag" in project_response
        assert "licenseId" in project_response
        assert "allowedUsernames" in project_response
        assert "created" in project_response
        assert "lastUpdated" in project_response
        assert "percentMapped" in project_response
        assert "percentValidated" in project_response
        assert "percentBadImagery" in project_response
        assert "teams" in project_response

    def test_published_public_project_can_be_accessed_without_token(self):
        "Test returns 200 on request by unauthenticated user."
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["projectId"], self.test_project.id)
        TestGetProjectsRestAPI.assert_project_response(response.json, self.test_project)

    def test_draft_project_can_only_be_accessed_by_user_with_OM_permissions(self):
        "Test draft project can only be accessed by user with PM permissions."
        # Arrange
        self.test_project.status = ProjectStatus.DRAFT.value
        self.test_project.save()

        # Authenticated user with that is not a manager or admin
        response = self.client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json["SubCode"], "ProjectNotFetched")

        # Authenticated user with that is a admin
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        response = self.client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        self.assertEqual(response.status_code, 200)
        TestGetProjectsRestAPI.assert_project_response(response.json, self.test_project)

        # Authenticated user with that is a manager
        self.test_user.role = UserRole.MAPPER.value
        self.test_user.save()
        add_manager_to_organisation(self.test_project.organisation, self.test_user)
        response = self.client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["projectId"], self.test_project.id)
        TestGetProjectsRestAPI.assert_project_response(response.json, self.test_project)

    def test_private_project_requires_atleast_PM_permissions(self):
        "Test provate project can only be accessed by user with PM permissions."
        # Arrange
        self.test_project.private = True
        self.test_project.save()

        # Authenticated user with that is not a manager or admin
        response = self.client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json["SubCode"], "PrivateProject")

        # Authenticated user with that is a admin
        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        TestGetProjectsRestAPI.assert_project_response(response.json, self.test_project)

        # Authenticated user with that is a member of team associated with project
        # Arrange
        self.test_user.role = UserRole.MAPPER.value  # Reset user role to Mapper
        self.test_user.save()
        # Create a team and add user to it
        test_team = create_canned_team()
        add_user_to_team(
            test_team, self.test_user, TeamMemberFunctions.MEMBER.value, True
        )
        # Assign team to project
        assign_team_to_project(self.test_project, test_team, TeamRoles.MAPPER.value)
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        TestGetProjectsRestAPI.assert_project_response(response.json, self.test_project)

        # Authenticated user with that is a organisation manager
        # Arrange
        add_manager_to_organisation(self.test_project.organisation, self.test_user)
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        TestGetProjectsRestAPI.assert_project_response(response.json, self.test_project)

    def test_get_project_returns_tasks_with_geometry_while_abbreviated_is_set_false(
        self,
    ):
        "Test get project returns tasks with geometry while abbreviated is set false."
        # Act
        response = self.client.get(
            f"{self.url}?abbreviated=false",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        TestGetProjectsRestAPI.assert_project_response(response.json, self.test_project)
        for task in response.json["tasks"]["features"]:
            self.assertIsNotNone(task["geometry"])

    def test_get_project_returns_tasks_with_no_geometry_while_abbreviated_is_set_true(
        self,
    ):
        "Test get project returns tasks with no geom while abbreviated is set true."
        # Act
        response = self.client.get(
            f"{self.url}?abbreviated=true",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        TestGetProjectsRestAPI.assert_project_response(response.json, self.test_project)
        for task in response.json["tasks"]["features"]:
            self.assertIsNone(task["geometry"])

    def test_get_project_returns_file_if_as_file_is_set_true(self):
        "Test get project returns file if as_file is set true."
        # Act
        response = self.client.get(
            f"{self.url}?as_file=true",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Content-Type"], "application/json")
        self.assertEqual(
            response.headers["Content-Disposition"],
            f"attachment; filename=project_{self.test_project.id}.json",
        )
        TestGetProjectsRestAPI.assert_project_response(response.json, self.test_project)
