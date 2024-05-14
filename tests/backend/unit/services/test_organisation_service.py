from unittest.mock import patch
from backend.models.postgis.statuses import UserRole
from tests.backend.base import BaseTestCase
from backend.services.organisation_service import OrganisationService, NotFound
from tests.backend.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_user,
    return_canned_user,
)


class TestOrganisationService(BaseTestCase):
    def test_get_get_organisation_by_id_returns_organisation(self):
        # Arrange
        test_org = create_canned_organisation()
        # Act
        result_org = OrganisationService.get_organisation_by_id(test_org.id)
        # Assert
        self.assertEqual(test_org, result_org)

    def test_get_get_organisation_by_id_raises_error_if_organisation_not_found(self):
        # Act/Assert
        with self.assertRaises(NotFound):
            OrganisationService.get_organisation_by_id(123)

    @patch.object(OrganisationService, "get_organisations_managed_by_user")
    def test_organisation_managed_by_user_as_dto(self, mock_get_user_org):
        # Arrange
        test_user = create_canned_user()
        test_org = create_canned_organisation()
        test_org.managers = [test_user]
        test_org.save()
        # Act
        OrganisationService.get_organisations_managed_by_user_as_dto(test_user.id)
        # Assert
        mock_get_user_org.assert_called_with(test_user.id)

    def test_organisation_managed_by_user(self):
        # Arrange
        test_user = create_canned_user()
        test_org = create_canned_organisation()
        test_org.managers = [test_user]
        test_org.save()
        # Act
        organisations = OrganisationService.get_organisations_managed_by_user(
            test_user.id
        )
        # Assert
        self.assertEqual(test_org.name, organisations[0].name)

    def test_organisation_managed_by_user_returns_all_organisations_for_admin(self):
        # Arrange
        test_user = return_canned_user()
        test_user.role = UserRole.ADMIN.value
        test_user.create()
        test_org = create_canned_organisation()

        # Act
        organisations = OrganisationService.get_organisations_managed_by_user(
            test_user.id
        )
        # Assert
        self.assertEqual(test_org.name, organisations[0].name)
