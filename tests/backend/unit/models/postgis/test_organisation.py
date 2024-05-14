from backend.models.postgis.organisation import Organisation, OrganisationType
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_user,
)


class TestOrganisation(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.test_org = create_canned_organisation()
        self.test_org.logo = "Test Logo"
        self.test_org.description = "Test description"
        self.test_org.url = "Test URL"
        self.test_user = create_canned_user()

    def test_get_organisations_managed_by_user(self):
        # Arrange
        self.test_org.managers = [self.test_user]
        # Act
        organisations = Organisation.get_organisations_managed_by_user(
            self.test_user.id
        )
        # Assert
        self.assertEqual(self.test_org.name, organisations[0].name)

    def test_as_dto(self):
        # Test setting omit managers to false includes managers
        # Arrange
        self.test_org.managers = [self.test_user]
        # Act
        org_dto = self.test_org.as_dto(omit_managers=False)
        # Assert
        self.assertEqual(org_dto.organisation_id, self.test_org.id)
        self.assertEqual(org_dto.name, self.test_org.name)
        self.assertEqual(org_dto.slug, self.test_org.slug)
        self.assertEqual(org_dto.logo, self.test_org.logo)
        self.assertEqual(org_dto.description, self.test_org.description)
        self.assertEqual(org_dto.url, self.test_org.url)
        self.assertEqual(len(org_dto.managers), 1)
        self.assertEqual(org_dto.managers[0].username, self.test_user.username)
        self.assertEqual(org_dto.subscription_tier, self.test_org.subscription_tier)
        self.assertEqual(org_dto.type, OrganisationType(self.test_org.type).name)

        # Test setting omit managers to true excludes managers
        # Act
        org_dto = self.test_org.as_dto(omit_managers=True)
        self.assertEqual(len(org_dto.managers), 0)
