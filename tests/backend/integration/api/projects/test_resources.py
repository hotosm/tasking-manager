import geojson
from datetime import datetime, timedelta

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    add_manager_to_organisation,
    create_canned_team,
    return_canned_team,
    add_user_to_team,
    assign_team_to_project,
    create_canned_organisation,
    return_canned_organisation,
    create_canned_project,
    generate_encoded_token,
    return_canned_user,
    return_canned_draft_project_json,
    get_canned_json,
    return_canned_campaign,
    create_canned_interest,
    update_project_with_info,
)
from backend.exceptions import NotFound
from backend.models.postgis.project import Project, ProjectDTO
from backend.models.postgis.task import Task
from backend.services.campaign_service import CampaignService
from backend.models.dtos.campaign_dto import CampaignProjectDTO
from backend.models.postgis.statuses import (
    UserRole,
    ProjectStatus,
    TeamMemberFunctions,
    TeamRoles,
    ValidationPermission,
    MappingPermission,
    ProjectDifficulty,
    ProjectPriority,
    MappingTypes,
    TaskStatus,
)
from backend.services.project_service import ProjectService, ProjectAdminService
from backend.services.validator_service import ValidatorService
from backend.services.mapping_service import MappingService
from backend.services.interests_service import InterestService
from backend.models.dtos.project_dto import (
    DraftProjectDTO,
    is_known_project_status,
    is_known_project_priority,
    is_known_project_difficulty,
    is_known_editor,
    is_known_mapping_type,
    is_known_task_creation_mode,
    is_known_validation_permission,
    is_known_mapping_permission,
)

TEST_USER_USERNAME = "Test User"
TEST_USER_ID = 11111


class TestDeleteProjectsRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.url = f"/api/v2/projects/{self.test_project.id}/"
        self.test_user = return_canned_user(
            username=TEST_USER_USERNAME, id=TEST_USER_ID
        )
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
        self.test_user = return_canned_user(
            username=TEST_USER_USERNAME, id=TEST_USER_ID
        )
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
        self.test_user = return_canned_user(
            username=TEST_USER_USERNAME, id=TEST_USER_ID
        )
        self.test_user.create()
        test_organistion = create_canned_organisation()
        self.test_project.organisation = test_organistion
        self.test_project.save()
        self.user_session_token = generate_encoded_token(self.test_user.id)

    @staticmethod
    def assert_project_response(project_response, expected_project, assert_type="full"):
        "Test project response"
        assert expected_project.id == project_response["projectId"]
        # Since some of the fields are not returned in summary mode we need to skip them
        if assert_type != "summary":
            assert geojson.loads(
                geojson.dumps(project_response["areaOfInterest"])
            ).is_valid
            assert ["type", "coordinates"] == list(
                project_response["areaOfInterest"].keys()
            )
            if assert_type == "notasks":
                assert "tasks" not in project_response
            else:
                assert geojson.loads(geojson.dumps(project_response["tasks"])).is_valid
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
        # Since projectInfo is not present in notasks mode we need to skip it
        if assert_type != "notasks":
            assert (
                expected_project.get_project_title(expected_project.default_locale)
                == project_response["projectInfo"]["name"]
            )
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

    def test_draft_project_can_only_be_accessed_by_user_with_PM_permissions(self):
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

        # Authenticated user with that is a organisation manager
        # Arrange
        self.test_user.role = UserRole.MAPPER.value  # Reset user role to Mapper
        self.test_user.save()
        add_manager_to_organisation(self.test_project.organisation, self.test_user)
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        TestGetProjectsRestAPI.assert_project_response(response.json, self.test_project)

        # Authenticated user with that is a member of team associated with project
        # Arrange
        # Remove organisation from project
        self.test_project.organisation = None
        # Create a team and add user to it
        test_team = create_canned_team()
        test_user_1 = return_canned_user("TEST_USER_1", 222222)
        test_user_1.create()
        test_user_1_session_token = generate_encoded_token(test_user_1.id)
        add_user_to_team(test_team, test_user_1, TeamMemberFunctions.MEMBER.value, True)
        # Assign team to project
        assign_team_to_project(self.test_project, test_team, TeamRoles.MAPPER.value)
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": test_user_1_session_token}
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


class TestPatchProjectRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.url = f"/api/v2/projects/{self.test_project.id}/"
        self.test_user = return_canned_user(
            username=TEST_USER_USERNAME, id=TEST_USER_ID
        )
        self.test_user.create()
        test_organistion = create_canned_organisation()
        self.test_project.organisation = test_organistion
        self.test_project.save()
        self.author_session_token = generate_encoded_token(self.test_author.id)
        self.user_session_token = generate_encoded_token(self.test_user.id)
        self.project_update_body = get_canned_json("canned_project_detail.json")
        self.project_update_body["projectId"] = self.test_project.id

    def test_patch_project_requires_authentication(self):
        "Test patch project requires authentication."
        # Act
        response = self.client.patch(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_patch_project_returns_404_if_project_does_not_exist(self):
        "Test patch project returns 404 if project does not exist."
        # Act
        response = self.client.patch(
            "/api/v2/projects/1000/", headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_patch_project_returns_403_if_user_is_not_project_manager(self):
        "Test patch project returns 403 if user is not project manager."
        # Act
        response = self.client.patch(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json["SubCode"], "UserPermissionError")

    def test_patch_project_returns_400_if_invalid_body(self):
        "Test patch project returns 400 if invalid body."
        # Act
        response = self.client.patch(
            self.url,
            json={"message": "invalid body"},
            content_type="application/json",
            headers={"Authorization": self.author_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "InvalidData")

    def test_project_author_can_update_project(self):
        "Test project author can update project."
        # Act
        response = self.client.patch(
            self.url,
            json=self.project_update_body,
            content_type="application/json",
            headers={"Authorization": self.author_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        updated_project = ProjectService.get_project_by_id(self.test_project.id)
        TestGetProjectsRestAPI.assert_project_response(
            self.project_update_body, updated_project
        )

    def test_member_of_team_with_PM_permission_can_update_project(self):
        "Test member of team with PM permission can update project."
        # Arrange
        team = create_canned_team()
        add_user_to_team(team, self.test_user, TeamMemberFunctions.MEMBER.value, True)
        project_team = assign_team_to_project(
            self.test_project, team, TeamRoles.PROJECT_MANAGER.value
        )
        # Act
        response = self.client.patch(
            self.url,
            json=self.project_update_body,
            content_type="application/json",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        updated_project = ProjectService.get_project_by_id(self.test_project.id)
        TestGetProjectsRestAPI.assert_project_response(
            self.project_update_body, updated_project
        )
        # Cleanup
        project_team.delete()

    def test_member_of_team_with_non_PM_role_cannot_update_project(self):
        """Test member of team with non PM permission can't update project."""
        # Arrange
        team = create_canned_team()
        add_user_to_team(team, self.test_user, TeamMemberFunctions.MEMBER.value, True)
        project_team = assign_team_to_project(
            self.test_project, team, TeamRoles.VALIDATOR.value
        )
        # Act
        response = self.client.patch(
            self.url,
            json=self.project_update_body,
            content_type="application/json",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 403)
        # Cleanup
        project_team.delete()

    def test_user_with_admin_role_can_update_project(self):
        "Test project can be updated by admins."
        # Arrange
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        # Act
        response = self.client.patch(
            self.url,
            json=self.project_update_body,
            content_type="application/json",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        updated_project = ProjectService.get_project_by_id(self.test_project.id)
        TestGetProjectsRestAPI.assert_project_response(
            self.project_update_body, updated_project
        )
        # Cleanup
        self.test_user.role = UserRole.MAPPER.value
        self.test_user.save()

    def test_org_manager_can_update_project(self):
        "Test org manager can update project."
        # Arrange
        add_manager_to_organisation(self.test_project.organisation, self.test_user)
        # Act
        response = self.client.patch(
            self.url,
            json=self.project_update_body,
            content_type="application/json",
            headers={"Authorization": self.user_session_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        updated_project = ProjectService.get_project_by_id(self.test_project.id)
        TestGetProjectsRestAPI.assert_project_response(
            self.project_update_body, updated_project
        )


class TestProjectsAllAPI(BaseTestCase):
    """Tests for the projects/all endpoint."""

    def setUp(self):
        super().setUp()
        self.url = "/api/v2/projects/"
        self.test_project_1, self.test_author = create_canned_project()
        self.test_project_1.status = ProjectStatus.PUBLISHED.value
        self.test_project_1.save()
        self.test_project_2, _ = create_canned_project()
        self.test_project_2.status = ProjectStatus.PUBLISHED.value
        self.test_project_2.private = True
        self.test_project_2.save()
        self.test_project_3, _ = create_canned_project()
        self.test_project_3.status = ProjectStatus.DRAFT.value
        self.test_project_3.save()
        self.test_user = return_canned_user(username="Test User_2", id=11111)
        self.test_user.create()
        self.author_session_token = generate_encoded_token(self.test_author.id)
        self.user_session_token = generate_encoded_token(self.test_user.id)

    def test_get_all_projects_can_be_accessed_without_token(self):
        "Test get all projects can be accessed without token."
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)

    def test_get_all_project_returns_published_public_projects_if_token_not_supplied(
        self,
    ):
        "Test get all project returns published public projects if token not supplied."
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 1)
        self.assertEqual(
            response.json["results"][0]["projectId"], self.test_project_1.id
        )

    def test_get_all_projects_returns_user_permitted_published_projects_if_token_supplied(
        self,
    ):
        "Test get all projects returns published projects on which user has permission if token supplied."
        # Arrange
        self.test_project_2.private = False
        self.test_project_2.save()
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.author_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 2)
        self.assertEqual(
            response.json["results"][0]["projectId"], self.test_project_1.id
        )
        self.assertEqual(
            response.json["results"][1]["projectId"], self.test_project_2.id
        )

    def test_returns_projects_with_tasks_to_validate_if_action_set_to_validate(self):
        """
        Test returns only projects that have tasks ready for validation and
        they have permission to validate if action set to validate.
        """
        # Arrange
        self.test_project_2.private = False
        # Since test_author is BEGINNER, they can only validate projects with validation permission ANY.
        self.test_project_1.validation_permission = ValidationPermission.ANY.value
        self.test_project_1.save()
        self.test_project_2.validation_permission = ValidationPermission.ANY.value
        self.test_project_2.save()
        # Reset all tasks of test_project_2 so that there are no tasks ready to validate.
        MappingService.map_all_tasks(self.test_project_2.id, self.test_author.id)
        ValidatorService.validate_all_tasks(self.test_project_2.id, self.test_author.id)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.author_session_token},
            query_string={"action": "validate"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        # Test_project_2 has no tasks to validate, it should not be returned even when user has permsiion to validate.
        self.assertEqual(len(response.json["results"]), 1)
        self.assertEqual(
            response.json["results"][0]["projectId"], self.test_project_1.id
        )

    def test_returns_projects_with_tasks_to_map_if_action_set_to_map(self):
        """
        Test returns only projects that have tasks ready for mapping and
        they have permission to map if action set to map.
        """
        # Arrange
        self.test_project_2.private = False
        # Since test_author is BEGINNER, they can only map projects with mapping permission ANY.
        self.test_project_1.mapping_permission = MappingPermission.ANY.value
        self.test_project_1.save()
        self.test_project_2.mapping_permission = MappingPermission.ANY.value
        self.test_project_2.save()
        # Map all tasks of test_project_2 so that there are no tasks ready to map.
        MappingService.map_all_tasks(self.test_project_2.id, self.test_author.id)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"action": "map"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        # Test_project_2 has no tasks to map, it should not be returned even when user has permission to map.
        self.assertEqual(len(response.json["results"]), 1)
        self.assertEqual(
            response.json["results"][0]["projectId"], self.test_project_1.id
        )

    def test_returns_all_projects_that_user_is_permitted_if_action_set_to_any(self):
        """
        Test returns all projects that user has permission for if action set to any.
        """
        # Arrange
        self.test_project_2.private = False
        # Since test_author is BEGINNER, they can only map projects with mapping permission ANY.
        self.test_project_1.mapping_permission = MappingPermission.ANY.value
        self.test_project_1.save()
        self.test_project_2.mapping_permission = MappingPermission.ANY.value
        self.test_project_2.save()
        # Archive test_project_2 so that it is not returned if action set to any.
        test_project_4 = Project.clone(self.test_project_2.id, self.test_author.id)
        test_project_4.status = ProjectStatus.ARCHIVED.value
        # Validate all tasks of test_project_2 to check finished projects are not returned if action set to any.
        MappingService.map_all_tasks(self.test_project_2.id, self.test_author.id)
        ValidatorService.validate_all_tasks(self.test_project_2.id, self.test_author.id)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"action": "any"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 2)
        self.assertEqual(
            response.json["results"][0]["projectId"], self.test_project_1.id
        )
        self.assertEqual(
            response.json["results"][1]["projectId"], self.test_project_2.id
        )

    def test_returns_easy_projects_if_difficulty_set_to_easy(self):
        """
        Test returns only projects with difficulty set to easy if difficulty set to easy.
        """
        # Arrange
        self.test_project_2.private = False
        # Set difficulty of test_project_2 to easy.
        self.test_project_2.difficulty = ProjectDifficulty.EASY.value
        self.test_project_2.save()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"difficulty": "EASY"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 1)
        self.assertEqual(
            response.json["results"][0]["projectId"], self.test_project_2.id
        )

    def test_returns_moderate_projects_if_difficulty_set_to_moderate(self):
        """
        Test returns only projects with difficulty set to MODERATE if difficulty set to MODERATE.
        Since we have set difficulty of proects to MODERATE during setup, we should get all user permitted projects.
        """
        # Arrange
        self.test_project_2.private = False
        # Change difficulty of test_project_2 to easy so that it is not returned.
        self.test_project_2.difficulty = ProjectDifficulty.EASY.value
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"difficulty": "MODERATE"},
        )
        # User is only permitted to map test_project_1 and test_project_2, since test_project_3 is DRAFT.
        # So we should get only test_project_1 as it is the only project with difficulty set to MODERATE.
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 1)
        self.assertEqual(
            response.json["results"][0]["projectId"], self.test_project_1.id
        )

    def test_returns_challenging_projects_if_difficulty_set_to_changelling(self):
        """
        Test returns only projects with difficulty set to hard if difficulty set to challenging.
        """
        # Arrange
        self.test_project_2.private = False
        # Set difficulty of test_project_2 to hard.
        self.test_project_2.difficulty = ProjectDifficulty.CHALLENGING.value
        self.test_project_2.save()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"difficulty": "CHALLENGING"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 1)
        self.assertEqual(
            response.json["results"][0]["projectId"], self.test_project_2.id
        )

    def test_returns_all_projects_if_difficulty_set_to_all(self):
        """
        Test returns all projects if difficulty set to all.
        """
        # Arrange
        self.test_project_2.private = False
        # Set difficulty of test_project_2 to easy.
        self.test_project_2.difficulty = ProjectDifficulty.EASY.value
        self.test_project_2.save()
        self.test_project_1.difficulty = ProjectDifficulty.MODERATE.value
        self.test_project_1.save()
        test_project_4 = Project.clone(self.test_project_2.id, self.test_author.id)
        test_project_4.status = ProjectStatus.PUBLISHED.value
        test_project_4.difficulty = ProjectDifficulty.CHALLENGING.value
        test_project_4.save()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"difficulty": "ALL"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        # User is only permitted for test_project 1, 2 and 4, since test_project_3 is DRAFT.
        self.assertEqual(len(response.json["results"]), 3)
        self.assertNotIn(
            self.test_project_3.id, [i["projectId"] for i in response.json["results"]]
        )

    def test_returns_sorted_projects_by_priority_if_sort_by_set_to_priority(self):
        """
        Test returns sorted projects by priority if sort_by set to priority.
        """
        # Arrange
        # Set priority of test_project_1 to urgent.
        self.test_project_1.priority = ProjectPriority.URGENT.value
        self.test_project_1.save()
        # Set project_2 to be allowed for all users removing as private.
        self.test_project_2.private = False
        self.test_project_2.priority = ProjectPriority.HIGH.value
        self.test_project_2.save()
        # Set priority of test_project_1 to low and status to published.
        self.test_project_3.status = ProjectStatus.PUBLISHED.value
        self.test_project_3.priority = ProjectPriority.MEDIUM.value
        self.test_project_3.save()
        test_project_4 = Project.clone(self.test_project_2.id, self.test_author.id)
        test_project_4.status = ProjectStatus.PUBLISHED.value
        test_project_4.priority = ProjectPriority.LOW.value
        test_project_4.save()

        # Test for descending order
        # Act
        response_desc = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"orderBy": "priority", "orderByType": "DESC"},
        )
        # Assert
        self.assertEqual(response_desc.status_code, 200)
        self.assertEqual(len(response_desc.json["results"]), 4)
        expected_desc_order = [
            test_project_4.id,
            self.test_project_3.id,
            self.test_project_2.id,
            self.test_project_1.id,
        ]
        self.assertListEqual(
            [i["projectId"] for i in response_desc.json["results"]], expected_desc_order
        )

        # Test for ascending order
        # Act
        response_asc = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"orderBy": "priority", "orderByType": "ASC"},
        )
        # Assert
        self.assertEqual(response_asc.status_code, 200)
        self.assertEqual(len(response_asc.json["results"]), 4)
        self.assertListEqual(
            [i["projectId"] for i in response_asc.json["results"]],
            expected_desc_order[::-1],
        )

    def test_returns_sorted_projects_by_difficulty_if_sort_by_set_to_difficulty(self):
        """
        Test returns sorted projects by difficulty if sort_by set to difficulty.
        """
        # Arrange
        # Set difficulty of test_project_1 to easy.
        self.test_project_1.difficulty = ProjectDifficulty.EASY.value
        self.test_project_1.save()
        # Set project_2 to be allowed for all users removing as private.
        self.test_project_2.private = False
        self.test_project_2.difficulty = ProjectDifficulty.MODERATE.value
        self.test_project_2.save()
        # Set difficulty of test_project_1 to hard and status to published.
        self.test_project_3.status = ProjectStatus.PUBLISHED.value
        self.test_project_3.difficulty = ProjectDifficulty.CHALLENGING.value
        self.test_project_3.save()

        # Test for descending order
        # Act
        response_desc = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"orderBy": "difficulty", "orderByType": "DESC"},
        )
        # Assert
        self.assertEqual(response_desc.status_code, 200)
        self.assertEqual(len(response_desc.json["results"]), 3)
        expected_desc_order = [
            self.test_project_3.id,
            self.test_project_2.id,
            self.test_project_1.id,
        ]
        self.assertListEqual(
            [i["projectId"] for i in response_desc.json["results"]], expected_desc_order
        )

        # Test for ascending order
        # Act
        response_asc = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"orderBy": "difficulty", "orderByType": "ASC"},
        )
        # Assert
        self.assertEqual(response_asc.status_code, 200)
        self.assertEqual(len(response_asc.json["results"]), 3)
        self.assertListEqual(
            [i["projectId"] for i in response_asc.json["results"]],
            expected_desc_order[::-1],
        )

    def test_returns_sorted_projects_by_creation_date_if_sort_by_set_to_id(self):
        """
        Test returns sorted projects by created_at if sort_by set to id.
        """
        # Arrange
        # Set project_2 to be allowed for all users removing as private.
        self.test_project_2.private = False
        self.test_project_2.save()
        # Set status of test_project_3 to published.
        self.test_project_3.status = ProjectStatus.PUBLISHED.value
        self.test_project_3.save()

        # Test returns sorted projects by created_at in descending order.
        # Act
        response_desc = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"orderBy": "id", "orderByType": "DESC"},
        )
        # Assert
        self.assertEqual(response_desc.status_code, 200)
        self.assertEqual(len(response_desc.json["results"]), 3)
        expected_desc_order = [
            self.test_project_3.id,
            self.test_project_2.id,
            self.test_project_1.id,
        ]
        self.assertListEqual(
            [i["projectId"] for i in response_desc.json["results"]], expected_desc_order
        )

        # Test returns sorted projects by created_at in ascending order.
        # Act
        response_asc = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"orderBy": "id", "orderByType": "ASC"},
        )
        # Assert
        self.assertEqual(response_asc.status_code, 200)
        self.assertEqual(len(response_asc.json["results"]), 3)
        self.assertListEqual(
            [i["projectId"] for i in response_asc.json["results"]],
            expected_desc_order[::-1],
        )

    def test_returns_sorted_projects_by_last_updated_date_if_sort_by_set_to_updated_at(
        self,
    ):
        """
        Test returns sorted projects by last_updated_at if sort_by set to updated_at.
        """
        # Arrange
        self.test_project_1.last_updated = datetime.utcnow() - timedelta(days=1)
        # Set project_2 to be allowed for all users removing as private.
        self.test_project_2.last_updated = datetime.utcnow() - timedelta(days=2)
        self.test_project_2.private = False
        self.test_project_2.save()
        # Set status of test_project_3 to published.
        self.test_project_3.last_updated = datetime.utcnow() - timedelta(days=3)
        self.test_project_3.status = ProjectStatus.PUBLISHED.value
        self.test_project_3.save()

        # Test returns sorted projects by last_updated_in descending order.
        # Act
        response_desc = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"orderBy": "last_updated", "orderByType": "DESC"},
        )
        # Assert
        self.assertEqual(response_desc.status_code, 200)
        self.assertEqual(len(response_desc.json["results"]), 3)
        expected_desc_order = [
            self.test_project_1.id,
            self.test_project_2.id,
            self.test_project_3.id,
        ]
        self.assertListEqual(
            [i["projectId"] for i in response_desc.json["results"]], expected_desc_order
        )

        # Test returns sorted projects by last_updated_in ascending order.
        # Act
        response_asc = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"orderBy": "last_updated", "orderByType": "ASC"},
        )
        # Assert
        self.assertEqual(response_asc.status_code, 200)
        self.assertEqual(len(response_asc.json["results"]), 3)
        self.assertListEqual(
            [i["projectId"] for i in response_asc.json["results"]],
            expected_desc_order[::-1],
        )

    def test_returns_sorted_projects_by_due_date_if_sort_by_set_to_due_date(self):
        """
        Test returns sorted projects by due_date if sort_by set to due_date.
        """
        # Arrange
        self.test_project_1.due_date = datetime.utcnow() + timedelta(days=1)
        # Set project_2 to be allowed for all users removing as private.
        self.test_project_2.due_date = datetime.utcnow() + timedelta(days=2)
        self.test_project_2.private = False
        self.test_project_2.save()
        # Set status of test_project_3 to published.
        self.test_project_3.due_date = datetime.utcnow() + timedelta(days=3)
        self.test_project_3.status = ProjectStatus.PUBLISHED.value
        self.test_project_3.save()

        # Test returns sorted projects by descending order.
        # Act
        response_desc = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"orderBy": "due_date", "orderByType": "DESC"},
        )
        # Assert
        self.assertEqual(response_desc.status_code, 200)
        self.assertEqual(len(response_desc.json["results"]), 3)
        expected_desc_order = [
            self.test_project_3.id,
            self.test_project_2.id,
            self.test_project_1.id,
        ]
        self.assertListEqual(
            [i["projectId"] for i in response_desc.json["results"]], expected_desc_order
        )

        # Test returns sorted projects by due_date in ascending order.
        # Act
        response_asc = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"orderBy": "due_date", "orderByType": "ASC"},
        )
        # Assert
        self.assertEqual(response_asc.status_code, 200)
        self.assertEqual(len(response_asc.json["results"]), 3)
        self.assertListEqual(
            [i["projectId"] for i in response_asc.json["results"]],
            expected_desc_order[::-1],
        )

    def test_returns_projects_filter_by_statuses(self):
        """
        Test returns projects filter by projectStatuses.
        """
        # Arrange
        self.test_project_1.status = ProjectStatus.DRAFT.value
        self.test_project_1.save()
        # Set project_2 to be allowed for all users removing as private.
        self.test_project_2.private = False
        self.test_project_2.save()
        # Set status of test_project_3 to archived.
        self.test_project_3.status = ProjectStatus.ARCHIVED.value
        self.test_project_3.save()

        # Act
        response_pub = self.client.get(
            self.url,
            headers={"Authorization": self.author_session_token},
            query_string={"projectStatuses": [ProjectStatus.PUBLISHED.name]},
        )
        # Assert
        self.assertEqual(response_pub.status_code, 200)
        self.assertEqual(len(response_pub.json["results"]), 1)
        self.assertEqual(
            response_pub.json["results"][0]["projectId"], self.test_project_2.id
        )

        # Act
        response_draft = self.client.get(
            self.url,
            headers={"Authorization": self.author_session_token},
            query_string={"projectStatuses": [ProjectStatus.DRAFT.name]},
        )
        # Assert
        self.assertEqual(response_draft.status_code, 200)
        self.assertEqual(len(response_draft.json["results"]), 1)
        self.assertEqual(
            response_draft.json["results"][0]["projectId"], self.test_project_1.id
        )

        # Act
        response_archived = self.client.get(
            self.url,
            headers={"Authorization": self.author_session_token},
            query_string={"projectStatuses": [ProjectStatus.ARCHIVED.name]},
        )
        # Assert
        self.assertEqual(response_archived.status_code, 200)
        self.assertEqual(len(response_archived.json["results"]), 1)
        self.assertEqual(
            response_archived.json["results"][0]["projectId"], self.test_project_3.id
        )

        # Test multiple statuses returns all projects with those statuses.
        # Act
        response_all = self.client.get(
            self.url,
            headers={"Authorization": self.author_session_token},
            query_string={
                "projectStatuses": "PUBLISHED,DRAFT,ARCHIVED",
            },
        )
        # Assert
        self.assertEqual(response_all.status_code, 200)
        self.assertEqual(len(response_all.json["results"]), 3)
        self.assertListEqual(
            [i["projectId"] for i in response_all.json["results"]],
            [self.test_project_1.id, self.test_project_2.id, self.test_project_3.id],
        )

    @staticmethod
    def create_cloned_project_with_mapping_types(project_id, author_id, mapping_types):
        """
        Create a cloned project with mapping types.
        """
        test_project = Project.clone(project_id, author_id)
        test_project.mapping_types = mapping_types
        test_project.status = ProjectStatus.PUBLISHED.value
        test_project.save()
        return test_project

    def test_returns_projects_filter_by_mapping_types(self):
        """
        Test returns projects filter by mappingTypes.
        """
        # Arrange
        self.test_project_1.mapping_types = [MappingTypes.BUILDINGS.value]
        self.test_project_1.save()
        # Set project_2 to be allowed for all users removing as private.
        self.test_project_2.mapping_types = [MappingTypes.ROADS.value]
        self.test_project_2.private = False
        self.test_project_2.save()
        # Set mapping type of test_project_3 to waterways.
        self.test_project_3.mapping_types = [MappingTypes.WATERWAYS.value]
        self.test_project_3.status = ProjectStatus.PUBLISHED.value
        self.test_project_3.save()
        # Create a new project with other mapping type.

        test_project_4 = TestProjectsAllAPI.create_cloned_project_with_mapping_types(
            self.test_project_3.id, self.test_author.id, [MappingTypes.LAND_USE.value]
        )
        # Create a new project with land use mapping type.
        test_project_5 = TestProjectsAllAPI.create_cloned_project_with_mapping_types(
            self.test_project_3.id, self.test_author.id, [MappingTypes.OTHER.value]
        )
        # Create a new project with all mapping types.
        test_project_6 = TestProjectsAllAPI.create_cloned_project_with_mapping_types(
            self.test_project_3.id,
            self.test_author.id,
            [
                MappingTypes.BUILDINGS.value,
                MappingTypes.ROADS.value,
                MappingTypes.WATERWAYS.value,
                MappingTypes.LAND_USE.value,
                MappingTypes.OTHER.value,
            ],
        )

        # Act
        response_buildings = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"mappingTypes": [MappingTypes.BUILDINGS.name]},
        )
        # Assert
        self.assertEqual(response_buildings.status_code, 200)
        self.assertEqual(len(response_buildings.json["results"]), 2)
        self.assertListEqual(
            [i["projectId"] for i in response_buildings.json["results"]],
            [self.test_project_1.id, test_project_6.id],
        )

        # Act
        response_roads = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"mappingTypes": [MappingTypes.ROADS.name]},
        )
        # Assert
        self.assertEqual(response_roads.status_code, 200)
        self.assertEqual(len(response_roads.json["results"]), 2)
        self.assertListEqual(
            [i["projectId"] for i in response_roads.json["results"]],
            [self.test_project_2.id, test_project_6.id],
        )

        # Act
        response_waterways = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"mappingTypes": [MappingTypes.WATERWAYS.name]},
        )
        # Assert
        self.assertEqual(response_waterways.status_code, 200)
        self.assertEqual(len(response_waterways.json["results"]), 2)
        self.assertListEqual(
            [i["projectId"] for i in response_waterways.json["results"]],
            [self.test_project_3.id, test_project_6.id],
        )

        # Act
        response_land_use = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"mappingTypes": [MappingTypes.LAND_USE.name]},
        )
        # Assert
        self.assertEqual(response_land_use.status_code, 200)
        self.assertEqual(len(response_land_use.json["results"]), 2)
        self.assertListEqual(
            [i["projectId"] for i in response_land_use.json["results"]],
            [test_project_4.id, test_project_6.id],
        )

        # Act
        response_other = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"mappingTypes": [MappingTypes.OTHER.name]},
        )
        # Assert
        self.assertEqual(response_other.status_code, 200)
        self.assertEqual(len(response_other.json["results"]), 2)
        self.assertListEqual(
            [i["projectId"] for i in response_other.json["results"]],
            [test_project_5.id, test_project_6.id],
        )

        # Test filter by multiple mapping types returns projects with any of the mapping types in the list.
        # Act
        response_all = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"mappingTypes": "BUILDINGS,ROADS,WATERWAYS,LAND_USE,OTHER"},
        )
        # Assert
        self.assertEqual(response_all.status_code, 200)
        self.assertEqual(len(response_all.json["results"]), 6)

        # Test mappingTypesExact returns only projects with exact mapping types.
        # Act
        response_exact = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"mappingTypes": "BUILDINGS", "mappingTypesExact": "true"},
        )
        # Assert
        self.assertEqual(response_exact.status_code, 200)
        self.assertEqual(len(response_exact.json["results"]), 1)
        self.assertEqual(
            response_exact.json["results"][0]["projectId"], self.test_project_1.id
        )

    def test_returns_projects_filtered_by_organisation(self):
        # Arrange
        test_org_1 = create_canned_organisation()
        test_org_2 = return_canned_organisation(12, "test_org_2", "T2")
        test_org_2.create()

        self.test_project_1.organisation_id = test_org_1.id
        self.test_project_1.save()
        # Set project_2 to be allowed for all users removing as private.
        self.test_project_2.private = False
        self.test_project_2.organisation_id = test_org_2.id
        self.test_project_2.save()

        # Test organisationId filters projects by organisation.
        # Act
        response_org_id = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"organisationId": test_org_1.id},
        )
        # Assert
        self.assertEqual(response_org_id.status_code, 200)
        self.assertEqual(len(response_org_id.json["results"]), 1)
        self.assertEqual(
            response_org_id.json["results"][0]["projectId"], self.test_project_1.id
        )

        # Test organisationName filters projects organisation.
        # Act
        response_org_name = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"organisationName": test_org_2.name},
        )
        # Assert
        self.assertEqual(response_org_name.status_code, 200)
        self.assertEqual(len(response_org_name.json["results"]), 1)
        self.assertEqual(
            response_org_name.json["results"][0]["projectId"], self.test_project_2.id
        )

    def test_returns_projects_filtered_by_campaign(self):
        # Arrange
        test_campaign_1 = return_canned_campaign(10, "test_campaign_1")
        test_campaign_1.create()
        test_campaign_2 = return_canned_campaign(12, "test_campaign_2")
        test_campaign_2.create()

        campaign_dto = CampaignProjectDTO()
        campaign_dto.campaign_id = test_campaign_1.id
        campaign_dto.project_id = self.test_project_1.id
        CampaignService.create_campaign_project(campaign_dto)

        campaign_dto.campaign_id = test_campaign_2.id
        campaign_dto.project_id = self.test_project_2.id
        CampaignService.create_campaign_project(campaign_dto)
        # Set project_2 to be allowed for all users removing as private.
        self.test_project_2.private = False
        self.test_project_2.save()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"campaign": test_campaign_1.name},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 1)
        self.assertEqual(
            response.json["results"][0]["projectId"], self.test_project_1.id
        )

    def test_returns_projects_filtered_by_search(self):
        # Arrange
        self.test_project_1.name = "test_project_1"
        self.test_project_1.save()
        test_project_4, _ = create_canned_project(name="test_project_4")
        test_project_4.status = ProjectStatus.PUBLISHED.value
        test_project_4.save()

        # Test text search by project name
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"textSearch": "test_project_4"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        # Since all other projects are named test by default on test_helpers, only project_4 should be returned.
        self.assertEqual(len(response.json["results"]), 1)
        self.assertEqual(response.json["results"][0]["projectId"], test_project_4.id)

        # Test project search by project Id
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"textSearch": self.test_project_1.id},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 1)
        self.assertEqual(
            response.json["results"][0]["projectId"], self.test_project_1.id
        )

    def test_returns_projects_filtered_by_country(self):
        # Arrange
        self.test_project_1.country = ["England"]
        self.test_project_1.save()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"country": self.test_project_1.country},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 1)
        self.assertEqual(
            response.json["results"][0]["projectId"], self.test_project_1.id
        )

    def test_returns_projects_filtering_by_last_updated_param(self):
        # Arrange
        self.test_project_1.last_updated = datetime.utcnow() - timedelta(minutes=10)
        self.test_project_1.save()
        self.test_project_2.private = False
        self.test_project_2.last_updated = datetime.utcnow() - timedelta(days=2)
        self.test_project_2.save()
        self.test_project_3.last_updated = datetime.utcnow() - timedelta(days=3)
        self.test_project_3.status = ProjectStatus.PUBLISHED.value
        self.test_project_3.save()

        # Test last updated from filterf returns projects updated after the date
        # Act
        response_from = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"lastUpdatedFrom": self.test_project_1.last_updated.date()},
        )
        # Assert
        self.assertEqual(response_from.status_code, 200)
        self.assertEqual(len(response_from.json["results"]), 1)
        self.assertEqual(
            response_from.json["results"][0]["projectId"], self.test_project_1.id
        )

        # Test last updated from filter returns projects updated before the date
        # Act
        response_to = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={
                "lastUpdatedTo": (datetime.utcnow() - timedelta(days=1)).date()
            },
        )
        # Assert
        self.assertEqual(response_to.status_code, 200)
        self.assertEqual(len(response_to.json["results"]), 2)
        self.assertNotIn(
            self.test_project_1.id,
            [i["projectId"] for i in response_to.json["results"]],
        )

    def test_returns_projects_filtering_by_last_created_param(self):
        # Arrange
        self.test_project_1.created = datetime.utcnow() - timedelta(minutes=10)
        self.test_project_1.save()
        self.test_project_2.private = False
        self.test_project_2.created = datetime.utcnow() - timedelta(days=2)
        self.test_project_2.save()
        self.test_project_3.created = datetime.utcnow() - timedelta(days=3)
        self.test_project_3.status = ProjectStatus.PUBLISHED.value
        self.test_project_3.save()

        # Test  created from filter returns projects created after the date
        # Act
        response_from = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"createdFrom": self.test_project_1.created.date()},
        )
        # Assert
        self.assertEqual(response_from.status_code, 200)
        self.assertEqual(len(response_from.json["results"]), 1)
        self.assertEqual(
            response_from.json["results"][0]["projectId"], self.test_project_1.id
        )

        # Test created from filter returns projects created before the date
        # Act
        response_to = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"createdTo": (datetime.utcnow() - timedelta(days=1)).date()},
        )
        # Assert
        self.assertEqual(response_to.status_code, 200)
        self.assertEqual(len(response_to.json["results"]), 2)
        self.assertNotIn(
            self.test_project_1.id,
            [i["projectId"] for i in response_to.json["results"]],
        )

    def returns_filtered_projects_by_interests(self):
        # Arrange
        test_interest_1 = create_canned_interest("test_interest_1")
        test_interest_2 = create_canned_interest("test_interest_2")
        test_interest_3 = create_canned_interest("test_interest_3")

        InterestService.create_or_update_project_interests(
            self.test_project_1.id, [test_interest_1.id, test_interest_2.id]
        )
        InterestService.create_or_update_project_interests(
            self.test_project_2.id, [test_interest_2.id]
        )
        InterestService.create_or_update_project_interests(
            self.test_project_3.id, [test_interest_3.id]
        )

        # Make sure all projects can be accessed by the user
        self.test_project_2.private = False
        self.test_project_2.save()
        self.test_project_3.status = ProjectStatus.PUBLISHED.value
        self.test_project_3.save()

        # Act
        # Test filter by single interest returns projects with that interest
        response_single = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"interests": test_interest_2.name},
        )
        # Assert
        self.assertEqual(response_single.status_code, 200)
        self.assertEqual(len(response_single.json["results"]), 1)
        self.assertEqual(
            response_single.json["results"][0]["projectId"], self.test_project_1.id
        )

        # Test filter by multiple interests returns projects with union of interests provided
        # Act
        response_multiple = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={
                "interests": f"{test_interest_1.name},{test_interest_2.name}"
            },
        )
        # Assert
        self.assertEqual(response_multiple.status_code, 200)
        self.assertEqual(len(response_multiple.json["results"]), 2)
        self.assertNotIn(
            self.test_project_3.id,
            [i["projectId"] for i in response_multiple.json["results"]],
        )

    def test_returns_projects_created_by_me(self):
        # Arrange
        self.test_project_1.author_id = self.test_user.id
        self.test_project_1.save()
        self.test_project_2.private = False
        self.test_project_2.save()
        self.test_project_3.status = ProjectStatus.PUBLISHED.value
        self.test_project_3.save()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"createdByMe": "true"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 1)
        self.assertEqual(
            response.json["results"][0]["projectId"], self.test_project_1.id
        )

    def test_returns_projects_managed_by_me(self):
        """
        Test that the endpoint returns projects managed by the user i.e user must have PM role on the project
        """
        # Arrange
        # test_user is the member of team that has PM role in test_project_1 so it must be returned
        test_organisation_1 = return_canned_organisation(
            111, "test_organisation_2", "T2"
        )
        test_organisation_1.create()
        test_team = return_canned_team("test_team", test_organisation_1.name)
        add_user_to_team(
            test_team, self.test_user, TeamMemberFunctions.MEMBER.value, True
        )
        assign_team_to_project(
            self.test_project_1, test_team, TeamRoles.PROJECT_MANAGER.value
        )

        # test_user is the manager of organisation that test_project_2 belongs to so it must be returned
        test_organisation_2 = create_canned_organisation()
        add_manager_to_organisation(test_organisation_2, self.test_user)
        self.test_project_2.organisation_id = test_organisation_2.id
        self.test_project_2.private = False
        self.test_project_2.save()

        # test_user doesn't have PM role on test_project_3 so it must not be returned
        self.test_project_3.status = ProjectStatus.PUBLISHED.value
        self.test_project_3.organisation_id = test_organisation_1.id
        self.test_project_3.save()

        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"managedByMe": "true"},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 2)
        self.assertNotIn(
            self.test_project_3.id,
            [i["projectId"] for i in response.json["results"]],
        )

    def test_returns_all_projects_for_admin_if_managed_by_me_is_true(self):
        """
        Test all projects are returned for admin if managedByMe is true
        """
        # Arrange
        self.test_project_2.private = False
        self.test_project_2.save()
        self.test_project_3.status = ProjectStatus.PUBLISHED.value
        self.test_project_3.save()
        self.test_user.role = UserRole.ADMIN.value
        self.test_user.save()
        # Act
        response_admin = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"managedByMe": "true"},
        )
        self.assertEqual(response_admin.status_code, 200)
        self.assertEqual(len(response_admin.json["results"]), 3)

    def test_returns_projects_mapped_by_user_if_mapped_by_me_is_true(self):
        """
        Test all projects are returned for admin if managedByMe is true
        """
        # Arrange
        # Make all projects to be accessible for user
        self.test_project_2.private = False
        self.test_project_2.save()
        self.test_project_3.status = ProjectStatus.PUBLISHED.value
        self.test_project_3.save()
        self.test_user.projects_mapped = [self.test_project_1.id]
        self.test_user.save()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"mappedByMe": "true"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 1)
        self.assertEqual(
            response.json["results"][0]["projectId"], self.test_project_1.id
        )

    def test_returns_projects_favourited_by_user_if_favourited_by_me_is_true(self):
        """
        Test all projects are returned for admin if managedByMe is true
        """
        # Arrange
        # Make all projects to be accessible for user
        self.test_project_2.private = False
        self.test_project_2.save()
        self.test_project_3.status = ProjectStatus.PUBLISHED.value
        self.test_project_3.save()
        self.test_user.favorites = [self.test_project_1]
        self.test_user.save()
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"favoritedByMe": "true"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 1)
        self.assertEqual(
            response.json["results"][0]["projectId"], self.test_project_1.id
        )

    def test_omit_map_results_removes_mao_results_from_response(self):
        """
        Test omitMapResults removes map results from response
        """
        # Test map_results is not present if omitMapResults is set to true
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"omitMapResults": "true"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertListEqual(response.json["mapResults"], [])

        # Test map_results are present if omitMapResults is set to false
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"omitMapResults": "false"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["mapResults"]["type"], "FeatureCollection")


class TestSearchProjectByBBOX(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.url = "/api/v2/projects/queries/bbox/"
        self.test_user = return_canned_user(TEST_USER_USERNAME, TEST_USER_ID)
        self.test_user.create()
        self.test_project_1, self.test_author = create_canned_project()
        self.test_project_1.status = ProjectStatus.PUBLISHED.value
        self.test_project_1.save()
        self.test_project_2, _ = create_canned_project()
        self.test_project_2.status = ProjectStatus.PUBLISHED.value
        self.test_project_2.save()
        self.user_session_token = generate_encoded_token(self.test_user.id)

    def test_returns_401_if_user_not_logged_in(self):
        """
        Test 403 is returned if user is not logged in
        """
        # Act
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 401)

    def test_returns_403_if_user_doesnt_have_PM_role(self):
        """
        Test 403 is returned if user is not logged in
        """
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        self.assertEqual(response.status_code, 403)

    def test_returns_400_if_bbox_is_not_valid(self):
        """
        Test 400 is returned if bbox is not valid
        """
        # Arrange
        # This endpoint is only accessible to org managers and admins, so we need to add the user to an organisation.
        test_organisation = create_canned_organisation()
        add_manager_to_organisation(test_organisation, self.test_user)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"bbox": "1,2,3,100,200,3", "srid": 4326},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "InvalidData")

    def test_returns_400_if_bbox_too_large(self):
        """
        Test 400 is returned if bbox is too large
        """
        # Arrange
        # This endpoint is only accessible to org managers and admins, so we need to add the user to an organisation.
        test_organisation = create_canned_organisation()
        add_manager_to_organisation(test_organisation, self.test_user)
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            query_string={"bbox": "-17,-30,102,70", "srid": 4326},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "BBoxTooBigError")

    def test_returns_projects_within_bbox(self):
        """
        Test projects within bbox are returned
        """
        # Arrange
        # Create a project outside bbox
        draft_project_dto = DraftProjectDTO()
        draft_project_dto.area_of_interest = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "coordinates": [
                            [
                                [83.771175, 28.095768],
                                [83.773586, 28.095757],
                                [83.773428, 28.094146],
                                [83.770834, 28.094479],
                                [83.771175, 28.095768],
                            ]
                        ],
                        "type": "Polygon",
                    },
                }
            ],
        }
        self.test_project_2.save()
        self.test_project_2.set_project_aoi(draft_project_dto)
        test_organisation = create_canned_organisation()
        add_manager_to_organisation(test_organisation, self.test_user)
        # Act
        response = self.client.get(
            self.url,
            headers={
                "Authorization": self.user_session_token,
                " Accept-Language": "en",
            },
            query_string={
                "bbox": "-3.993530,56.095790,-3.890533,56.129480",
                "srid": 4326,
            },
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["features"]), 1)
        self.assertEqual(
            response.json["features"][0]["properties"]["projectId"],
            self.test_project_1.id,
        )


class TestProjectsQueriesSummaryAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_project.status = ProjectStatus.PUBLISHED.value
        self.test_project.private = True
        self.test_project.save()
        self.url = f"/api/v2/projects/{self.test_project.id}/queries/summary/"

    def test_authentication_is_not_required(self):
        """
        Test authentication is not required
        """
        # Act
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_returns_404_if_project_doesnt_exist(self):
        """
        Test 404 is returned if project doesn't exist
        """
        # Act
        response = self.client.get("/api/v2/projects/999/queries/summary/")
        self.assertEqual(response.status_code, 404)

    def test_project_summary_response(self):
        """
        Test project summary response
        """
        # Arrange
        json_data = get_canned_json("canned_project_detail.json")
        project_update_dto = ProjectDTO(json_data)
        create_canned_organisation()
        self.test_project.update(project_update_dto)

        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        TestGetProjectsRestAPI.assert_project_response(
            response.json, self.test_project, assert_type="summary"
        )


class TestProjectsQueriesTouchedAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_project.status = ProjectStatus.PUBLISHED.value
        self.test_project.private = False
        self.test_project.save()
        self.test_project_1, _ = create_canned_project()
        self.test_project_1.status = ProjectStatus.PUBLISHED.value
        self.test_project_1.save()
        task = Task.get(1, self.test_project.id)
        task.lock_task_for_validating(self.test_author.id)
        task.unlock_task(self.test_author.id, TaskStatus.VALIDATED)
        self.test_author.projects_mapped = [self.test_project.id]
        self.test_author.save()
        self.url = f"/api/v2/projects/queries/{self.test_author.username}/touched/"

    def test_authentication_is_not_required(self):
        """
        Test authentication is not required
        """
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["mappedProjects"]), 1)
        self.assertEqual(
            response.json["mappedProjects"][0]["projectId"],
            self.test_project.id,
        )

    def test_returns_404_if_user_doesnt_exist(self):
        """
        Test 404 is returned if project doesn't exist
        """
        # Act
        response = self.client.get("/api/v2/projects/queries/non_existent/touched/")
        self.assertEqual(response.status_code, 404)


class TestProjectsQueriesPriorityAreasAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_project.status = ProjectStatus.PUBLISHED.value
        self.test_project.private = False
        self.test_project.save()
        self.url = f"/api/v2/projects/{self.test_project.id}/queries/priority-areas/"

    def returns_404_if_project_doesnt_exist(self):
        """
        Test 404 is returned if project doesn't exist
        """
        # Act
        response = self.client.get("/api/v2/projects/999/queries/priority-areas/")
        self.assertEqual(response.status_code, 404)

    def test_authentication_is_not_required(self):
        """
        Test authentication is not required
        """
        # Arrange
        json_data = get_canned_json("canned_project_detail.json")
        project_update_dto = ProjectDTO(json_data)
        create_canned_organisation()
        self.test_project.update(project_update_dto)
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json), 1)
        self.assertDeepAlmostEqual(
            response.json[0], json_data["priorityAreas"][0], places=6
        )


class TestProjectsQueriesAoiAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_project.status = ProjectStatus.PUBLISHED.value
        self.test_project.private = False
        self.test_project.save()
        self.url = f"/api/v2/projects/{self.test_project.id}/queries/aoi/"

    def test_returns_404_if_project_doesnt_exist(self):
        """
        Test 404 is returned if project doesn't exist
        """
        # Act
        response = self.client.get("/api/v2/projects/999/queries/aoi/")
        self.assertEqual(response.status_code, 404)

    def test_authentication_is_not_required(self):
        """
        Test authentication is not required
        """
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, self.test_project.get_aoi_geometry_as_geojson())

    def test_returns_file_if_as_file_is_true(self):
        """
        Test authentication is not required
        """
        # Act
        response = self.client.get(self.url + "?as_file=true")
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, self.test_project.get_aoi_geometry_as_geojson())
        self.assertEqual(response.headers["Content-Type"], "application/json")
        self.assertEqual(
            response.headers["Content-Disposition"],
            f"attachment; filename={self.test_project.id}.geojson",
        )


class TestProjectsQueriesOwnerAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_project.status = ProjectStatus.PUBLISHED.value
        self.test_organisation = create_canned_organisation()
        # Add organisation to project
        self.test_project.organisation = self.test_organisation
        self.test_project.save()
        self.test_user = return_canned_user(TEST_USER_USERNAME, TEST_USER_ID)
        self.test_user.create()
        self.user_session_token = generate_encoded_token(self.test_user.id)
        self.author_session_token = generate_encoded_token(self.test_author.id)
        self.url = "/api/v2/projects/queries/myself/owner/"

    def test_returns_401_if_user_not_logged_in(self):
        """
        Test 403 is returned if user is not logged in
        """
        # Act
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 401)

    def test_returns_403_if_user_doesnt_have_PM_role(self):
        """
        Test 403 is returned if user doesn't have PM role
        """
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        self.assertEqual(response.status_code, 403)

    def test_returns_200_if_user_org_manager(self):
        """
        Test 200 is returned if user has a project owned
        """
        # Add user to organisation so that it has PM role
        add_manager_to_organisation(self.test_organisation, self.test_author)
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.author_session_token}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["activeProjects"]), 1)


class TestProjectsQueriesNoTasksAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_organisation = create_canned_organisation()
        self.test_project.status = ProjectStatus.PUBLISHED.value
        self.test_project.organisation = self.test_organisation
        self.test_project.save()
        self.test_user = return_canned_user(TEST_USER_USERNAME, TEST_USER_ID)
        self.test_user.create()
        self.user_session_token = generate_encoded_token(self.test_user.id)
        self.author_session_token = generate_encoded_token(self.test_author.id)
        self.url = f"/api/v2/projects/{self.test_project.id}/queries/notasks/"

    def test_returns_401_if_user_not_logged_in(self):
        """
        Test 403 is returned if user is not logged in
        """
        # Act
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 401)

    def test_returns_403_if_user_doesnt_have_PM_role(self):
        """
        Test 403 is returned if user doesn't have PM role
        """
        # Act
        response = self.client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
        )
        self.assertEqual(response.status_code, 403)

    def test_returns_404_if_project_doesnt_exist(self):
        """
        Test 404 is returned if project doesn't exist
        """
        # Act
        response = self.client.get(
            "/api/v2/projects/999/queries/notasks/",
            headers={"Authorization": self.user_session_token},
        )
        self.assertEqual(response.status_code, 404)

    def test_returns_200_for_admin(self):
        """
        Test 200 is returned if user is admin
        """
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
        TestGetProjectsRestAPI.assert_project_response(
            response.json, self.test_project, assert_type="notasks"
        )

    def test_returns_200_if_user_org_manager(self):
        """
        Test 200 is returned if user is org manager
        """
        # Arrange
        self.test_user.role = UserRole.MAPPER.value  # Make sure user role is Mapper
        self.test_user.save()
        add_manager_to_organisation(self.test_project.organisation, self.test_user)
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        TestGetProjectsRestAPI.assert_project_response(
            response.json, self.test_project, assert_type="notasks"
        )

    def test_returns_200_if_user_team_member(self):
        """
        Test 200 is returned if user is member of team associated with project
        """
        # Arrange
        # Create a team and add user to it
        test_team = create_canned_team()
        add_user_to_team(
            test_team, self.test_user, TeamMemberFunctions.MEMBER.value, True
        )
        # Assign team to project
        assign_team_to_project(
            self.test_project, test_team, TeamRoles.PROJECT_MANAGER.value
        )
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        TestGetProjectsRestAPI.assert_project_response(
            response.json, self.test_project, assert_type="notasks"
        )


class TestProjectQueriesSimilarProjectsAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_project, self.test_author = create_canned_project()
        self.test_project.status = ProjectStatus.PUBLISHED.value
        self.test_project.save()
        # Since project_info is required to retrun project summary in the response
        update_project_with_info(self.test_project)
        self.url = f"/api/v2/projects/queries/{self.test_project.id}/similar-projects/"
        self.user_session_token = generate_encoded_token(self.test_author.id)

    def create_project(self, status=ProjectStatus.PUBLISHED.value):
        project, _ = create_canned_project()
        project.status = status
        project.save()
        return project

    def arrange_projects(self):
        # Create test projects
        project_1 = self.create_project()
        project_2 = self.create_project()
        project_3 = self.create_project()
        self.create_project(ProjectStatus.DRAFT.value)
        # Since project_info is required to retrun project summary in the response
        update_project_with_info(project_1)
        update_project_with_info(project_2)
        update_project_with_info(project_3)
        return project_1, project_2, project_3

    def test_private_projects_are_not_returned_if_user_not_logged_in(self):
        """
        Test private projects are not returned if user is not logged in
        """
        # Arrange
        # Create and arrange test projects
        project_1, project_2, project_3 = self.arrange_projects()
        project_3.private = True
        project_3.save()
        # Act
        response = self.client.get(self.url)
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 2)
        self.assertEqual(response.json["results"][0]["projectId"], project_2.id)
        self.assertEqual(response.json["results"][1]["projectId"], project_1.id)

    def test_returns_404_if_project_doesnt_exist(self):
        """
        Test 404 is returned if project doesn't exist
        """
        # Act
        response = self.client.get(
            "/api/v2/projects/queries/999/similar-projects/",
            headers={"Authorization": self.user_session_token},
        )
        self.assertEqual(response.status_code, 404)

    def test_returns_private_projects_if_user_is_allowed(self):
        """
        Test private projects are returned if user is author of project
        """
        # Arrange
        # Create and arrange test projects
        project_1, project_2, project_3 = self.arrange_projects()
        project_3.private = True
        project_3.save()
        self.test_author.role = UserRole.ADMIN.value
        self.test_author.save()
        # Act
        response = self.client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 3)
        returned_project_ids = sorted(
            [i["projectId"] for i in response.json["results"]]
        )
        self.assertEqual(
            returned_project_ids, [project_1.id, project_2.id, project_3.id]
        )

    def test_returns_limit_projects(self):
        """
        Test limit is applied to projects returned
        """
        # Arrange
        # Create and arrange test projects
        self.arrange_projects()
        # Act
        response = self.client.get(
            f"{self.url}?limit=1", headers={"Authorization": self.user_session_token}
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["results"]), 1)
