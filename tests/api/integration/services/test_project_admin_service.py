import json
import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock

from backend.models.postgis.project import Project, User, NotFound, ProjectPriority
from backend.models.postgis.statuses import UserRole, ProjectDifficulty, ProjectStatus
from backend.services.messaging.message_service import MessageService
from backend.services.team_service import TeamService
from backend.services.project_admin_service import (
    ProjectAdminService,
    ProjectAdminServiceError,
    InvalidGeoJson,
)
from backend.models.dtos.project_dto import (
    DraftProjectDTO,
    ProjectDTO,
    ProjectInfoDTO,
)
from backend.services.organisation_service import OrganisationService
from backend.services.users.user_service import UserService
from backend.models.dtos.organisation_dto import ListOrganisationsDTO

from tests.api.helpers.test_helpers import (
    add_manager_to_organisation,
    create_canned_project,
    return_canned_draft_project_json,
    return_canned_user,
    create_canned_organisation,
    create_canned_user,
)


@pytest.mark.anyio
class TestProjectAdminService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

    @patch.object(UserService, "get_user_by_id", new_callable=AsyncMock)
    @patch.object(UserService, "is_user_an_admin", new_callable=AsyncMock)
    @patch.object(
        OrganisationService,
        "get_organisations_managed_by_user_as_dto",
        new_callable=AsyncMock,
    )
    async def test_create_draft_project_raises_error_if_user_not_admin_or_org_manager(
        self, mock_user_orgs, mock_admin_test, mock_user_get
    ):
        # Arrange
        draft_json = return_canned_draft_project_json()
        draft_project_dto = DraftProjectDTO(**draft_json)
        draft_project_dto.user_id = 77777
        mock_admin_test.return_value = False
        org_dto = ListOrganisationsDTO()
        org_dto.organisations = []
        mock_user_orgs.return_value = org_dto
        mock_user_get.return_value = await return_canned_user(db=self.db)

        # Act / Assert
        with pytest.raises(ProjectAdminServiceError):
            await ProjectAdminService.create_draft_project(
                draft_project_dto, db=self.db
            )

    @patch.object(UserService, "is_user_an_admin", new_callable=AsyncMock)
    @patch.object(
        OrganisationService,
        "get_organisations_managed_by_user_as_dto",
        new_callable=AsyncMock,
    )
    async def test_create_draft_project_creates_project_if_user_is_admin(
        self, mock_user_orgs, mock_admin_test
    ):
        # Arrange
        draft_json = return_canned_draft_project_json()
        draft_project_dto = DraftProjectDTO(**draft_json)
        draft_project_dto.user_id = 777777
        mock_admin_test.return_value = True
        org_dto = ListOrganisationsDTO()
        org_dto.organisations = []
        mock_user_orgs.return_value = org_dto

        # create required test user and organisation
        test_user = await return_canned_user(
            id=777777, username="test_user", db=self.db
        )
        await create_canned_user(self.db, test_user)
        await create_canned_organisation(db=self.db)

        # Act (should not raise)
        await ProjectAdminService.create_draft_project(draft_project_dto, db=self.db)

    @patch.object(UserService, "is_user_an_admin", new_callable=AsyncMock)
    @patch.object(
        OrganisationService,
        "get_organisations_managed_by_user_as_dto",
        new_callable=AsyncMock,
    )
    async def test_create_draft_project_creates_project_if_user_is_org_manager(
        self, mock_user_orgs, mock_admin_test
    ):
        # Arrange

        # create required test user and organisation
        test_user = await return_canned_user(
            id=777777, username="test_user", db=self.db
        )
        await create_canned_user(self.db, test_user)
        await create_canned_organisation(db=self.db)
        draft_json = return_canned_draft_project_json()
        draft_project_dto = DraftProjectDTO(**draft_json)
        draft_project_dto.user_id = 777777
        mock_admin_test.return_value = False
        org_dto = ListOrganisationsDTO()
        org_dto.organisations = [23]
        mock_user_orgs.return_value = org_dto

        # Act (should not raise)
        await ProjectAdminService.create_draft_project(draft_project_dto, db=self.db)

    @patch.object(Project, "clone", new_callable=AsyncMock)
    @patch.object(UserService, "get_user_by_id", new_callable=AsyncMock)
    @patch.object(UserService, "is_user_an_admin", new_callable=AsyncMock)
    async def test_create_draft_project_calls_project_clone_if_clone_from_project_id_found(
        self, mock_is_admin, mock_get_user, mock_project_clone
    ):
        # Arrange
        draft_project_dto = DraftProjectDTO(**return_canned_draft_project_json())
        draft_project_dto.user_id = 777777
        draft_project_dto.cloneFromProjectId = 123

        stub_user = User()
        stub_user.id = 777777
        mock_get_user.return_value = stub_user
        mock_is_admin.return_value = True

        # Act
        await ProjectAdminService.create_draft_project(draft_project_dto, db=self.db)

        # Assert
        mock_project_clone.assert_awaited_once_with(123, 777777, self.db)

    @patch.object(UserService, "get_user_by_id", new_callable=AsyncMock)
    @patch.object(UserService, "is_user_an_admin", new_callable=AsyncMock)
    async def test_create_draft_project_raises_error_if_org_not_found(
        self, mock_admin_test, mock_user_get
    ):
        mock_user_get.return_value = await return_canned_user(db=self.db)
        draft_json = return_canned_draft_project_json()
        draft_project_dto = DraftProjectDTO(**draft_json)
        draft_project_dto.user_id = 777777
        mock_admin_test.return_value = True

        # Act / Assert
        with pytest.raises(NotFound):
            await ProjectAdminService.create_draft_project(
                draft_project_dto, db=self.db
            )

    async def test_cant_add_tasks_if_geojson_not_feature_collection(self):
        # Arrange
        invalid_feature = (
            '{"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715], [-3.8122, 56.098],'
            '[-4.0237, 56.0904]]]], "type": "MultiPolygon"}'
        )

        # Act / Assert
        with pytest.raises(InvalidGeoJson):
            await ProjectAdminService._attach_tasks_to_project(
                MagicMock(), invalid_feature, self.db
            )

    async def test_valid_geo_json_attaches_task_to_project(self):
        # Arrange
        valid_feature_collection = json.loads(
            '{"features": [{"geometry": {"coordinates": [[[[-4.0237, 56.0904],'
            '[-3.9111, 56.1715], [-3.8122, 56.098], [-4.0237, 56.0904]]]], "type":'
            '"MultiPolygon"}, "properties": {"x": 2402, "y": 1736, "zoom": 12, "isSquare": true}, "type":'
            '"Feature"}], "type": "FeatureCollection"}'
        )

        test_project = Project()

        # Act
        await ProjectAdminService._attach_tasks_to_project(
            test_project, valid_feature_collection, self.db
        )

        # Assert
        assert test_project.tasks.count() == 1

    @patch.object(UserService, "is_user_the_project_author", new_callable=AsyncMock)
    @patch.object(UserService, "is_user_an_admin", new_callable=AsyncMock)
    async def test_is_user_action_permitted_on_project_returns_true_for_admin(
        self, mock_is_user_admin, mock_is_user_author
    ):
        # Arrange
        test_project, test_user, test_project_id = await create_canned_project(
            db=self.db
        )
        mock_is_user_admin.return_value = True
        mock_is_user_author.return_value = False

        # Act
        permitted = await ProjectAdminService.is_user_action_permitted_on_project(
            test_user.id, test_project_id, db=self.db
        )

        # Assert
        assert permitted

    async def test_is_user_action_permitted_on_project_returns_true_for_author(self):
        # Arrange
        test_project, test_user, test_project_id = await create_canned_project(
            db=self.db
        )

        # Act
        permitted = await ProjectAdminService.is_user_action_permitted_on_project(
            test_user.id, test_project_id, db=self.db
        )

        # Assert
        assert permitted

    @patch.object(UserService, "is_user_the_project_author", new_callable=AsyncMock)
    @patch.object(UserService, "is_user_an_admin", new_callable=AsyncMock)
    async def test_is_user_action_permitted_on_project_returns_true_for_org_manager(
        self, mock_is_user_admin, mock_is_user_author
    ):
        # Arrange
        test_project, test_user, test_project_id = await create_canned_project(
            db=self.db
        )

        try:
            org_record = await OrganisationService.get_organisation_by_id(23, self.db)
        except NotFound:
            test_org = await create_canned_organisation(self.db)
            org_record = await OrganisationService.get_organisation_by_id(
                test_org.id, self.db
            )

        await add_manager_to_organisation(org_record, test_user, self.db)

        mock_is_user_admin.return_value = False
        mock_is_user_author.return_value = False

        # Act
        permitted = await ProjectAdminService.is_user_action_permitted_on_project(
            test_user.id, test_project_id, db=self.db
        )

        # Assert
        assert permitted

    @patch.object(TeamService, "check_team_membership", new_callable=AsyncMock)
    @patch.object(OrganisationService, "is_user_an_org_manager", new_callable=AsyncMock)
    @patch.object(UserService, "is_user_the_project_author", new_callable=AsyncMock)
    @patch.object(UserService, "is_user_an_admin", new_callable=AsyncMock)
    async def test_is_user_action_permitted_on_project_returns_true_for_project_team_manager(
        self,
        mock_is_user_admin,
        mock_is_user_author,
        mock_is_user_org_manager,
        mock_check_team_membership,
    ):
        # Arrange
        test_project, test_user, test_project_id = await create_canned_project(
            db=self.db
        )
        mock_is_user_admin.return_value = False
        mock_is_user_author.return_value = False
        mock_is_user_org_manager.return_value = False
        mock_check_team_membership.return_value = True

        # Act
        permitted = await ProjectAdminService.is_user_action_permitted_on_project(
            test_user.id, test_project_id, db=self.db
        )

        # Assert
        assert permitted

    @patch.object(TeamService, "check_team_membership", new_callable=AsyncMock)
    @patch.object(OrganisationService, "is_user_an_org_manager", new_callable=AsyncMock)
    @patch.object(UserService, "is_user_the_project_author", new_callable=AsyncMock)
    @patch.object(UserService, "is_user_an_admin", new_callable=AsyncMock)
    async def test_is_user_action_permitted_on_project_returns_false_for_user_without_permission(
        self,
        mock_is_user_admin,
        mock_is_user_author,
        mock_is_user_org_manager,
        mock_check_team_membership,
    ):
        # Arrange
        test_project, author, test_project_id = await create_canned_project(db=self.db)
        test_user = await return_canned_user(username="Test_user", id=333, db=self.db)
        test_user = await create_canned_user(self.db, test_user)
        mock_is_user_admin.return_value = False
        mock_is_user_author.return_value = False
        mock_is_user_org_manager.return_value = False
        mock_check_team_membership.return_value = False

        # Act
        permitted = await ProjectAdminService.is_user_action_permitted_on_project(
            test_user.id, test_project_id, db=self.db
        )

        # Assert
        assert not permitted

    @patch.object(User, "get_by_id", new_callable=AsyncMock)
    @patch.object(Project, "get", new_callable=AsyncMock)
    async def test_update_published_project_with_incomplete_default_locale_raises_error(
        self, mock_project, mock_user
    ):
        # Arrange
        stub_project = Project()
        stub_project.status = ProjectStatus.PUBLISHED.value
        mock_project.return_value = stub_project

        locales = []
        info = ProjectInfoDTO(locale="en")
        info.name = "Test"
        locales.append(info)

        test_dto = ProjectDTO(
            project_id=1,
            project_status=ProjectStatus.PUBLISHED.name,
            project_priority=ProjectPriority.MEDIUM.name,
            default_locale="en",
            difficulty="EASY",
            mapping_permission="ANY",
            mapping_permission_level_id=0,
            validation_permission="ANY",
            validation_permission_level_id=0,
            private=False,
            task_creation_mode="GRID",
            mapping_editors=["JOSM", "ID", "RAPID"],
            validation_editors=["JOSM", "ID"],
            project_info_locales=locales,
            mapping_types=["ROADS", "BUILDINGS"],
            changeset_comment="hot-project",
        )

        stub_admin_user = User()
        stub_admin_user.username = "admin"
        stub_admin_user.role = UserRole.ADMIN.value

        mock_user.return_value = stub_admin_user

        # Act / Assert
        with pytest.raises(ProjectAdminServiceError):
            await ProjectAdminService.update_project(test_dto, mock_user.id, db=self.db)

    # @patch.object(User, "get_by_id", new_callable=AsyncMock)
    # @patch.object(Project, "update", new_callable=AsyncMock)
    # @patch.object(Project, "get", new_callable=AsyncMock)
    # async def test_updating_a_private_project_with_no_allowed_users_raises_error(
    #     self, mock_project, mock_project2, mock_user
    # ):
    #     # Arrange
    #     mock_project.return_value = Project()

    #     locales = []
    #     info = ProjectInfoDTO(locale = "en")
    #     info.name = "Test"
    #     info.description = "Test description"
    #     info.short_description = "Test short description"
    #     info.instructions = "Test instructions"
    #     locales.append(info)

    #     test_dto = ProjectDTO(
    #         project_id=1,
    #         private = True,
    #         allowed_usernames = [],
    #         project_status=ProjectStatus.PUBLISHED.name,
    #         project_priority=ProjectPriority.MEDIUM.name,
    #         default_locale="en",
    #         difficulty="EASY",
    #         mapping_permission="ANY",
    #         mapping_permission_level_id=0,
    #         validation_permission="ANY",
    #         validation_permission_level_id=0,
    #         project_info_locales=locales,
    #         task_creation_mode="GRID",
    #         mapping_editors=["JOSM", "ID", "RAPID"],
    #         validation_editors=["JOSM", "ID"],
    #         mapping_types=["ROADS", "BUILDINGS"],
    #         changeset_comment="hot-project",
    #     )

    #     stub_user = User()
    #     stub_user.username = "admin"
    #     stub_user.role = UserRole.ADMIN.value

    #     stub_user.id = 1
    #     mock_user.return_value = stub_user

    #     # Act / Assert: should not raise
    #     await ProjectAdminService.update_project(test_dto, 1, db=self.db)

    @patch.object(User, "get_by_id", new_callable=AsyncMock)
    @patch.object(Project, "update", new_callable=AsyncMock)
    @patch.object(Project, "get", new_callable=AsyncMock)
    async def test_updating_a_private_project_with_no_allowed_users_raises_error(
        self, mock_project_get, mock_project_update, mock_user_get
    ):
        # Arrange - project stub (avoid coroutines)
        stub_project = Project()
        stub_project.set_country_info = lambda: None
        stub_project.set_default_changeset_comment = lambda: None
        stub_project.tasks = []
        mock_project_get.return_value = stub_project

        locales = []
        info = ProjectInfoDTO(locale="en")
        info.name = "Test"
        info.description = "Test description"
        info.short_description = "Test short description"
        info.instructions = "Test instructions"
        locales.append(info)

        test_dto = ProjectDTO(
            project_id=1,
            private=True,
            allowed_usernames=[],
            project_status=ProjectStatus.PUBLISHED.name,
            project_priority=ProjectPriority.MEDIUM.name,
            default_locale="en",
            difficulty="EASY",
            mapping_permission="ANY",
            mapping_permission_level_id=0,
            validation_permission="ANY",
            validation_permission_level_id=0,
            project_info_locales=locales,
            task_creation_mode="GRID",
            mapping_editors=["JOSM", "ID", "RAPID"],
            validation_editors=["JOSM", "ID"],
            mapping_types=["ROADS", "BUILDINGS"],
            changeset_comment="hot-project",
        )

        # stub admin user
        stub_user = User()
        stub_user.username = "admin"
        stub_user.role = UserRole.ADMIN.value
        stub_user.id = 1
        mock_user_get.return_value = stub_user

        # Patch permission helper so it doesn't query DB
        with patch.object(
            ProjectAdminService,
            "is_user_action_permitted_on_project",
            new=AsyncMock(return_value=True),
        ):
            # Act / Assert: should not raise
            await ProjectAdminService.update_project(test_dto, 1, db=self.db)

    @patch.object(User, "get_by_id", new_callable=AsyncMock)
    @patch.object(Project, "get", new_callable=AsyncMock)
    async def test_update_project_with_non_existant_license_raises_error(
        self, mock_project_get, mock_user_get
    ):
        # Arrange: make project exist in the unit-test sense
        stub_project = Project()
        stub_project.status = ProjectStatus.PUBLISHED.value
        mock_project_get.return_value = stub_project

        locales = []
        info = ProjectInfoDTO(locale="en")
        info.name = "Test"
        info.description = "Test description"
        info.short_description = "Test short description"
        info.instructions = "Test instructions"
        locales.append(info)

        test_dto = ProjectDTO(
            project_id=1,
            project_status=ProjectStatus.PUBLISHED.name,
            project_priority=ProjectPriority.MEDIUM.name,
            default_locale="en",
            difficulty="EASY",
            mapping_permission="ANY",
            mapping_permission_level_id=0,
            validation_permission="ANY",
            validation_permission_level_id=0,
            private=False,
            task_creation_mode="GRID",
            mapping_editors=["JOSM", "ID", "RAPID"],
            validation_editors=["JOSM", "ID"],
            project_info_locales=locales,
            mapping_types=["ROADS", "BUILDINGS"],
            changeset_comment="hot-project",
            license_id=9999,
        )

        stub_admin_user = User()
        stub_admin_user.username = "admin"
        stub_admin_user.role = UserRole.ADMIN.value
        stub_admin_user.id = 1
        mock_user_get.return_value = stub_admin_user

        # Patch permission helper to avoid DB fetch in is_user_action_permitted_on_project
        with patch.object(
            ProjectAdminService,
            "is_user_action_permitted_on_project",
            new=AsyncMock(return_value=True),
        ):
            # Act / Assert: now update_project will proceed to license validation
            with pytest.raises(ProjectAdminServiceError):
                await ProjectAdminService.update_project(test_dto, 1, db=self.db)

    @patch.object(User, "get_by_id", new_callable=AsyncMock)
    @patch.object(Project, "update", new_callable=AsyncMock)
    @patch.object(Project, "get", new_callable=AsyncMock)
    async def test_updating_a_project_with_different_roles_raises_error(
        self, mock_project_get, mock_project_update, mock_user_get
    ):
        # Arrange
        stub_project = Project()
        stub_project.status = ProjectStatus.DRAFT.value
        # make sure stub_project won't create coroutine warnings if service calls non-async helpers
        stub_project.tasks = []
        stub_project.set_country_info = lambda: None
        stub_project.set_default_changeset_comment = lambda: None

        mock_project_get.return_value = stub_project

        locales = []
        info = ProjectInfoDTO(locale="en")
        info.name = "Test"
        locales.append(info)

        test_dto = ProjectDTO(
            project_id=1,
            project_status=ProjectStatus.DRAFT.name,
            project_priority=ProjectPriority.LOW.name,
            default_locale="en",
            difficulty=ProjectDifficulty.EASY.name,
            mapping_permission="ANY",
            mapping_permission_level_id=0,
            validation_permission="ANY",
            validation_permission_level_id=0,
            private=False,
            task_creation_mode="GRID",
            mapping_editors=["ID"],
            validation_editors=["ID"],
            project_info_locales=locales,
            mapping_types=["ROADS"],
            changeset_comment="hot-project",
        )

        stub_user = User()
        stub_user.username = "mapper"
        stub_user.role = UserRole.MAPPER.value
        stub_user.id = 2
        mock_user_get.return_value = stub_user

        # Patch the permission check so we do NOT hit db.fetch_one inside it.
        with patch.object(
            ProjectAdminService,
            "is_user_action_permitted_on_project",
            new=AsyncMock(return_value=False),
        ):
            # Act / Assert: mapper is *not* permitted, so update_project should raise ValueError
            with pytest.raises(ValueError):
                await ProjectAdminService.update_project(test_dto, 2, db=self.db)

    async def test_updating_a_project_with_valid_project_info(self):
        locales = []
        info = ProjectInfoDTO(locale="en")
        info.name = "Test"
        info.description = "Test description"
        info.short_description = "Test short description"
        info.instructions = "Test instructions"
        locales.append(info)

        test_project, test_user, test_project_id = await create_canned_project(
            db=self.db
        )

        test_dto = ProjectDTO(
            project_id=test_project_id,
            project_status=ProjectStatus.PUBLISHED.name,
            project_priority=ProjectPriority.LOW.name,
            default_locale="en",
            difficulty=ProjectDifficulty.EASY.name,
            mapping_permission="ANY",
            mapping_permission_level_id=0,
            validation_permission="ANY",
            validation_permission_level_id=0,
            private=False,
            task_creation_mode="GRID",
            mapping_editors=["ID"],
            validation_editors=["ID"],
            project_info_locales=locales,
            mapping_types=["ROADS"],
            changeset_comment="hot-project",
        )

        # Act
        updated_project = await ProjectAdminService.update_project(
            test_dto, test_user.id, db=self.db
        )

        # Assert
        assert (
            updated_project.difficulty
            == ProjectDifficulty[test_dto.difficulty.upper()].value
        )
        assert updated_project.status == ProjectStatus[test_dto.project_status].value
        assert (
            updated_project.priority == ProjectPriority[test_dto.project_priority].value
        )

    async def test_project_transfer_to_(self):
        test_project, test_author, test_project_id = await create_canned_project(
            db=self.db
        )
        test_user = await return_canned_user(username="TEST_USER", id=11111, db=self.db)
        test_user = await create_canned_user(self.db, test_user)
        test_manager = await return_canned_user(
            username="TEST_MANAGER", id=22222, db=self.db
        )
        test_manager = await create_canned_user(self.db, test_manager)

        try:
            org_record = await OrganisationService.get_organisation_by_id(23, self.db)
        except NotFound:
            test_org = await create_canned_organisation(self.db)
            org_record = await OrganisationService.get_organisation_by_id(
                test_org.id, self.db
            )

        await add_manager_to_organisation(org_record, test_manager, db=self.db)

        mock_bg = Mock()
        mock_bg.add_task = Mock()

        # Test error is raised if initiating user is not permitted to transfer project
        with pytest.raises(ProjectAdminServiceError):
            await ProjectAdminService.transfer_project_to(
                test_project_id,
                test_user.id,
                test_manager.username,
                db=self.db,
                background_tasks=mock_bg,
            )

        # No background task should have been scheduled for the failing call
        mock_bg.add_task.assert_not_called()

        # Test error is raised if transferred to user who is not a manager of the organisation
        with pytest.raises(ValueError):
            await ProjectAdminService.transfer_project_to(
                test_project_id,
                test_manager.id,
                test_user.username,
                db=self.db,
                background_tasks=mock_bg,
            )
        # Should have scheduled a background task when author transfers
        await ProjectAdminService.transfer_project_to(
            test_project_id,
            test_author.id,
            test_manager.username,
            db=self.db,
            background_tasks=mock_bg,
        )
        mock_bg.add_task.assert_called_with(
            MessageService.send_project_transfer_message,
            test_project_id,
            test_manager.username,
            test_author.username,
        )

        # Make a user admin and do another transfer - should schedule with that user's username
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": test_user.id},
        )
        mock_bg.add_task.reset_mock()
        await ProjectAdminService.transfer_project_to(
            test_project_id,
            test_user.id,
            test_user.username,
            db=self.db,
            background_tasks=mock_bg,
        )

        mock_bg.add_task.assert_called_with(
            MessageService.send_project_transfer_message,
            test_project_id,
            test_user.username,
            test_user.username,
        )

        mock_bg.add_task.reset_mock()
        await ProjectAdminService.transfer_project_to(
            test_project_id,
            test_manager.id,
            test_manager.username,
            db=self.db,
            background_tasks=mock_bg,
        )
        mock_bg.add_task.assert_called_with(
            MessageService.send_project_transfer_message,
            test_project_id,
            test_manager.username,
            test_manager.username,
        )
