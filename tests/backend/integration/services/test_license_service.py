from backend.exceptions import NotFound
from backend.services.license_service import LicenseService, LicenseDTO
from tests.backend.base import BaseTestCase


class TestLicenseService(BaseTestCase):
    def test_license_crud_works_as_expected(self):
        # Arrange
        license_dto = LicenseDTO()
        license_dto.name = "thinkWhere"
        license_dto.description = "thinkWhere test"
        license_dto.plain_text = "thinkWhere test"

        # Act
        license_id = LicenseService.create_licence(license_dto)

        try:
            actual_license = LicenseService.get_license_as_dto(license_id)

            # Assert PUT and GET
            self.assertEqual(actual_license.name, license_dto.name)

            license_dto.license_id = license_id
            license_dto.name = "Updated name"
            LicenseService.update_licence(license_dto)
            updated_license = LicenseService.get_license_as_dto(license_id)

            # Assert POST
            self.assertEqual(updated_license.name, license_dto.name)

            all_licenses = LicenseService.get_all_licenses()

            # Assert Get all
            self.assertGreaterEqual(1, len(all_licenses))

            # Assert Delete
            LicenseService.delete_license(license_id)
            with self.assertRaises(NotFound):
                LicenseService.get_license_as_dto(license_id)
        except Exception:
            # If any problem occurs try and tidy up
            LicenseService.delete_license(license_id)
