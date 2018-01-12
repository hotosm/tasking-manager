import os
import unittest
from server import create_app
from server.services.license_service import LicenseService, LicenseDTO, NotFound


class TestLicenseService(unittest.TestCase):
    skip_tests = False

    @classmethod
    def setUpClass(cls):
        env = os.getenv('CI', 'false')

        # Firewall rules mean we can't hit Postgres from Shippable so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

    def setUp(self):
        if self.skip_tests:
            return

        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        if self.skip_tests:
            return

        self.ctx.pop()

    def test_license_crud_works_as_expected(self):
        if self.skip_tests:
            return

        # Arrange
        license_dto = LicenseDTO()
        license_dto.name = "thinkWhere"
        license_dto.description = 'thinkWhere test'
        license_dto.plain_text = 'thinkWhere test'

        # Act
        license_id = LicenseService.create_licence(license_dto)

        try:
            actual_license = LicenseService.get_license_as_dto(license_id)

            # Assert PUT and GET
            self.assertEqual(actual_license.name, license_dto.name)

            license_dto.license_id = license_id
            license_dto.name = 'Updated name'
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
