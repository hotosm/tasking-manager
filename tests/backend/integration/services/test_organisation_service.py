from datetime import datetime
from schematics.exceptions import UndefinedValueError

from tests.backend.base import BaseTestCase
from backend.models.postgis.statuses import ProjectStatus, TeamVisibility
from tests.backend.helpers.test_helpers import (
    add_manager_to_organisation,
    create_canned_organisation,
    TEST_ORGANISATION_ID,
    TEST_USER_ID,
    create_canned_project,
    create_canned_user,
    return_canned_team,
)
from backend.services.organisation_service import OrganisationService, NotFound


class TestOrgansitaionService(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_org = create_canned_organisation()

    def test_is_user_an_org_manager_raises_error_if_organistion_not_found(self):
        # Assert/Act
        with self.assertRaises(NotFound):
            OrganisationService.is_user_an_org_manager(
                TEST_ORGANISATION_ID, TEST_USER_ID
            )

    def test_is_user_an_org_manager_returns_false_if_user_not_manager_of_organisation(
        self,
    ):
        test_user = create_canned_user()
        # Act
        is_org_manager = OrganisationService.is_user_an_org_manager(
            self.test_org.id, test_user.id
        )
        # Assert
        self.assertFalse(is_org_manager)

    def test_is_user_an_org_manager_returns_true_if_user_is_manager_of_organisation(
        self,
    ):
        # Arrange
        test_user = create_canned_user()
        self.test_org.managers = [test_user]
        # Act
        is_org_manager = OrganisationService.is_user_an_org_manager(
            self.test_org.id, test_user.id
        )
        # Assert
        self.assertTrue(is_org_manager)

    def test_get_organisations_as_dto(self):
        # Test returns stats when omit stats enabled
        # Act
        orgs_dto = OrganisationService.get_organisations_as_dto(
            manager_user_id=None,
            authenticated_user_id=False,
            omit_managers=True,
            omit_stats=True,
        )
        # Assert
        self.assertEqual(len(orgs_dto.organisations), 1)
        self.assertEqual(orgs_dto.organisations[0].organisation_id, self.test_org.id)
        self.assertEqual(orgs_dto.organisations[0].name, self.test_org.name)
        # Since omitManagers is set to true
        with self.assertRaises(UndefinedValueError):
            orgs_dto.organisations[0].managers
        self.assertEqual(orgs_dto.organisations[0].stats, None)

        # Test returns stats when omit_stats_disabled
        # Arrange
        test_project, test_author = create_canned_project()
        test_project.organisation = self.test_org
        test_project.save()
        # Act
        orgs_dto = OrganisationService.get_organisations_as_dto(
            manager_user_id=None,
            authenticated_user_id=False,
            omit_managers=True,
            omit_stats=False,
        )
        # Assert
        self.assertEqual(orgs_dto.organisations[0].stats.projects.draft, 1)
        self.assertEqual(orgs_dto.organisations[0].stats.projects.archived, 0)
        self.assertEqual(orgs_dto.organisations[0].stats.projects.published, 0)

        # Test returns managers when omit managers disabled
        # Arrange
        add_manager_to_organisation(self.test_org, test_author)
        # Act
        orgs_dto = OrganisationService.get_organisations_as_dto(
            manager_user_id=None,
            authenticated_user_id=True,
            omit_managers=False,
            omit_stats=True,
        )
        # Assert
        self.assertEqual(len(orgs_dto.organisations[0].managers), 1)
        self.assertEqual(
            orgs_dto.organisations[0].managers[0].username, test_author.username
        )

    def test_get_organisation_stats(self):
        # Test returns all time stats if year is None
        # Arrange
        test_project, _ = create_canned_project()
        test_project.organisation = self.test_org
        test_project.status = ProjectStatus.PUBLISHED.value
        test_project.save()
        # Act
        org_stats = OrganisationService.get_organisation_stats(self.test_org.id)
        # Assert
        self.assertEqual(org_stats.projects.published, 1)
        self.assertEqual(org_stats.projects.draft, 0)
        self.assertEqual(org_stats.projects.archived, 0)
        self.assertEqual(org_stats.active_tasks.mapped, 1)
        self.assertEqual(org_stats.active_tasks.ready, 1)
        self.assertEqual(org_stats.active_tasks.badimagery, 1)
        self.assertEqual(org_stats.active_tasks.validated, 1)
        self.assertEqual(org_stats.active_tasks.invalidated, 0)

        # Test returns yeat to date stats if year is not None
        # Arrange
        test_project.created = datetime.strptime("2018/07/06", "%Y/%m/%d")
        test_project.save()
        # Act
        org_stats = OrganisationService.get_organisation_stats(
            self.test_org.id, datetime.today().strftime("%Y")
        )
        # Assert
        self.assertEqual(org_stats.projects.published, 0)
        self.assertEqual(org_stats.projects.draft, 0)
        self.assertEqual(org_stats.projects.archived, 0)
        self.assertEqual(org_stats.active_tasks.mapped, 0)
        self.assertEqual(org_stats.active_tasks.ready, 0)
        self.assertEqual(org_stats.active_tasks.badimagery, 0)
        self.assertEqual(org_stats.active_tasks.validated, 0)
        self.assertEqual(org_stats.active_tasks.invalidated, 0)

    def assert_org_dto(self, org_dto):
        """Asserts that the organisation DTO is correct"""
        self.assertEqual(org_dto.organisation_id, self.test_org.id)
        self.assertEqual(org_dto.name, self.test_org.name)
        self.assertEqual(org_dto.description, None)
        self.assertEqual(org_dto.url, None)

    def test_get_organisation_dto(self):
        """Test get_organisation_dto returns correct DTO"""
        # Arrange
        test_user = create_canned_user()
        test_team_1 = return_canned_team("test_team_1", self.test_org.name)
        test_team_1.visibility = TeamVisibility.PUBLIC.value
        test_team_1.create()
        test_team_2 = return_canned_team("test_team_2", self.test_org.name)
        test_team_2.visibility = TeamVisibility.PRIVATE.value
        test_team_2.create()

        # Test with valid org and user id as non manager
        org_dto = OrganisationService.get_organisation_dto(
            self.test_org, test_user.id, abbreviated=False
        )
        self.assert_org_dto(org_dto)
        self.assertFalse(org_dto.is_manager)
        self.assertEqual(len(org_dto.teams), 1)
        self.assertEqual(org_dto.teams[0].team_id, test_team_1.id)

        # Test with valid org with abbreviated=True
        org_dto = OrganisationService.get_organisation_dto(
            self.test_org, test_user.id, abbreviated=True
        )
        self.assertEqual(org_dto.organisation_id, self.test_org.id)
        self.assertEqual(org_dto.name, self.test_org.name)
        self.assertEqual(org_dto.description, None)
        self.assertEqual(org_dto.url, None)
        self.assertFalse(org_dto.is_manager)
        self.assertEqual(org_dto.teams, None)

        # Test with valid org and user id as manager
        add_manager_to_organisation(self.test_org, test_user)
        org_dto = OrganisationService.get_organisation_dto(
            self.test_org, test_user.id, abbreviated=False
        )
        self.assert_org_dto(org_dto)
        self.assertTrue(org_dto.is_manager)
        self.assertEqual(len(org_dto.teams), 2)
        self.assertEqual(org_dto.teams[0].team_id, test_team_1.id)
        self.assertEqual(org_dto.teams[1].team_id, test_team_2.id)

        # Test with valid org and user id as 0
        org_dto = OrganisationService.get_organisation_dto(
            self.test_org, 0, abbreviated=False
        )
        self.assert_org_dto(org_dto)
        self.assertFalse(org_dto.is_manager)
        self.assertEqual(len(org_dto.teams), 1)
        self.assertEqual(org_dto.teams[0].team_id, test_team_1.id)

        # Test with invalid org
        with self.assertRaises(NotFound):
            OrganisationService.get_organisation_dto(
                None, test_user.id, abbreviated=False
            )
