import pytest
from backend.models.postgis.statuses import UserRole
from backend.services.organisation_service import NotFound, OrganisationService
from tests.api.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_user,
    return_canned_user,
)


@pytest.mark.anyio
class TestOrganisationService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        assert db_connection_fixture is not None, "Database connection is not available"

        request.cls.test_org = await create_canned_organisation(db_connection_fixture)
        request.cls.test_user = await create_canned_user(db_connection_fixture)
        request.cls.db = db_connection_fixture

        assert self.test_org is not None, "Failed to create test organisation"
        assert self.test_user is not None, "Failed to create test user"

    async def test_get_organisation_by_id_returns_organisation(self):
        # Act
        result_org = await OrganisationService.get_organisation_by_id(
            self.test_org.id, self.db
        )
        # Assert
        assert self.test_org.id == result_org.organisation_id
        assert self.test_org.name == result_org.name
        assert self.test_org.slug == result_org.slug

    async def test_get_organisation_by_id_raises_error_if_organisation_not_found(self):
        # Act/Assert
        with pytest.raises(NotFound):
            await OrganisationService.get_organisation_by_id(123, self.db)

    async def test_organisation_managed_by_user_as_dto(self):
        # Arrange
        self.test_org.managers = [self.test_user]

        # Act
        organisations_dto = (
            await OrganisationService.get_organisations_managed_by_user_as_dto(
                self.test_user.id, self.db
            )
        )

        # Assert
        assert organisations_dto.organisations == []

    async def test_organisation_managed_by_user(self):
        # Assign the user as a manager
        await self.db.execute(
            """
            INSERT INTO organisation_managers (organisation_id, user_id)
            VALUES (:organisation_id, :user_id)
            """,
            {"organisation_id": self.test_org.id, "user_id": self.test_user.id},
        )

        # Act
        organisations = await OrganisationService.get_organisations_managed_by_user(
            self.test_user.id, self.db
        )

        # Assert
        assert self.test_org.name == organisations[0].name

    async def test_organisation_managed_by_user_returns_all_organisations_for_admin(
        self,
    ):
        # Arrange
        admin_user = await return_canned_user(self.db)
        admin_user.role = UserRole.ADMIN.value
        await self.db.execute(
            """
            UPDATE users SET role = :role WHERE id = :user_id
            """,
            {"role": admin_user.role, "user_id": admin_user.id},
        )

        # Act
        organisations = await OrganisationService.get_organisations_managed_by_user(
            admin_user.id, self.db
        )

        # Assert
        assert self.test_org.name == organisations[0].name
