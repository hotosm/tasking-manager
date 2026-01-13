import pytest

from backend.exceptions import NotFound
from backend.services.license_service import LicenseService
from backend.models.dtos.licenses_dto import LicenseDTO


@pytest.mark.anyio
class TestLicenseService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

    async def test_license_crud_works_as_expected(self):
        # Arrange
        license_id = None
        license_dto = LicenseDTO()
        license_dto.name = "thinkWhere"
        license_dto.description = "thinkWhere test"
        license_dto.plain_text = "thinkWhere test"

        # Act / Assert inside try to ensure cleanup
        try:
            license_id = await LicenseService.create_license(license_dto, self.db)

            actual_license = await LicenseService.get_license_as_dto(
                license_id, self.db
            )
            # Assert PUT and GET
            assert actual_license.name == license_dto.name

            # Update
            license_dto.license_id = license_id
            license_dto.name = "Updated name"
            await LicenseService.update_license(license_dto, license_id, self.db)
            updated_license = await LicenseService.get_license_as_dto(
                license_id, self.db
            )

            # Assert update persisted
            assert updated_license.name == license_dto.name

            # Get all
            all_licenses = await LicenseService.get_all_licenses(self.db)

            # support different DTO shapes: .licenses, .results, or the object itself
            licenses_list = (
                getattr(all_licenses, "licenses", None)
                or getattr(all_licenses, "results", None)
                or all_licenses
            )
            assert len(licenses_list) >= 1

            # Delete and verify NotFound
            await LicenseService.delete_license(license_id, self.db)
            with pytest.raises(NotFound):
                await LicenseService.get_license_as_dto(license_id, self.db)
        finally:
            # best-effort cleanup
            if license_id is not None:
                try:
                    await LicenseService.delete_license(license_id, self.db)
                except Exception:
                    pass
