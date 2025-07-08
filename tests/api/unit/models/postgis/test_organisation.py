import pytest
from backend.models.dtos.organisation_dto import OrganisationDTO
from backend.models.postgis.organisation import OrganisationType
from tests.api.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_user,
)


@pytest.mark.anyio
class TestOrganisation:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        assert db_connection_fixture is not None, "Database connection is not available"

        request.cls.test_org = await create_canned_organisation(db_connection_fixture)
        request.cls.test_user = await create_canned_user(db_connection_fixture)

        assert self.test_org is not None, "Failed to create test organisation"
        assert self.test_user is not None, "Failed to create test user"

    async def test_get_organisations_managed_by_user(self, db_connection_fixture):
        """Test fetching organisations managed by a user."""
        # Assign the user as a manager
        await db_connection_fixture.execute(
            """
            INSERT INTO organisation_managers (organisation_id, user_id)
            VALUES (:organisation_id, :user_id)
            """,
            {"organisation_id": self.test_org.id, "user_id": self.test_user.id},
        )

        # Fetch organisations managed by the user
        organisations = await db_connection_fixture.fetch_all(
            """
            SELECT o.id, o.name FROM organisations o
            JOIN organisation_managers om ON o.id = om.organisation_id
            WHERE om.user_id = :user_id
            """,
            {"user_id": self.test_user.id},
        )

        assert len(organisations) == 1
        assert organisations[0].name == self.test_org.name

    async def test_as_dto(self, db_connection_fixture):
        """Test organisation DTO conversion with and without managers."""
        # Assign the user as a manager
        await db_connection_fixture.execute(
            """
            INSERT INTO organisation_managers (organisation_id, user_id)
            VALUES (:organisation_id, :user_id)
            """,
            {"organisation_id": self.test_org.id, "user_id": self.test_user.id},
        )

        # Fetch organisation details
        org_record = await db_connection_fixture.fetch_one(
            """
            SELECT id, name, slug, logo, description, url, type, subscription_tier
            FROM organisations WHERE id = :id
            """,
            {"id": self.test_org.id},
        )

        # Fetch managers
        managers = await db_connection_fixture.fetch_all(
            """
            SELECT u.id, u.username FROM users u
            JOIN organisation_managers om ON u.id = om.user_id
            WHERE om.organisation_id = :id
            """,
            {"id": self.test_org.id},
        )

        # Convert to DTO
        org_dto = OrganisationDTO(
            organisation_id=org_record["id"],
            name=org_record["name"],
            slug=org_record["slug"],
            logo=org_record["logo"],
            description=org_record["description"],
            url=org_record["url"],
            type=OrganisationType(org_record["type"]).name,
            subscription_tier=org_record["subscription_tier"],
            managers=[{"id": m["id"], "username": m["username"]} for m in managers],
        )

        # Assertions
        assert org_dto.organisation_id == self.test_org.id
        assert org_dto.name == self.test_org.name
        assert org_dto.slug == self.test_org.slug
        assert len(org_dto.managers) == 1
        assert org_dto.managers[0].username == self.test_user.username

        # Test omitting managers
        org_dto.managers = []
        assert len(org_dto.managers) == 0
