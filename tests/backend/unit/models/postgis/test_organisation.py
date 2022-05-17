from backend.models.postgis.organisation import Organisation
from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_user,
)


class TestOrganisation(BaseTestCase):
    def test_get_organisations_managed_by_user(self):
        # Arrange
        test_user = create_canned_user()
        test_org = create_canned_organisation()
        test_org.managers = [test_user]
        # Act
        organisations = Organisation.get_organisations_managed_by_user(test_user.id)
        # Assert
        self.assertEqual(test_org.name, organisations[0].name)
