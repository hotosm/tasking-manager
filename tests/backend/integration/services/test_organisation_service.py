from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_organisation,
    TEST_ORGANISATION_ID,
    TEST_USER_ID,
    create_canned_user,
)
from backend.services.organisation_service import OrganisationService, NotFound


class TestOrgansitaionService(BaseTestCase):
    def test_is_user_an_org_manager_raises_error_if_organistion_not_found(self):
        # Assert/Act
        with self.assertRaises(NotFound):
            OrganisationService.is_user_an_org_manager(
                TEST_ORGANISATION_ID, TEST_USER_ID
            )

    def test_is_user_an_org_manager_returns_false_if_user_not_manager_of_organisation(
        self,
    ):
        # Arrange
        test_org = create_canned_organisation()
        test_user = create_canned_user()
        # Act
        is_org_manager = OrganisationService.is_user_an_org_manager(
            test_org.id, test_user.id
        )
        # Assert
        self.assertFalse(is_org_manager)

    def test_is_user_an_org_manager_returns_true_if_user_is_manager_of_organisation(
        self,
    ):
        # Arrange
        test_org = create_canned_organisation()
        test_user = create_canned_user()
        test_org.managers = [test_user]
        # Act
        is_org_manager = OrganisationService.is_user_an_org_manager(
            test_org.id, test_user.id
        )
        # Assert
        self.assertTrue(is_org_manager)
