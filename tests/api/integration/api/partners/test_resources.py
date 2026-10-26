import base64

import pytest
from httpx import AsyncClient

from backend.models.postgis.statuses import UserRole
from backend.services.users.authentication_service import AuthenticationService
from tests.api.helpers.test_helpers import create_canned_user, return_canned_user


@pytest.mark.anyio
class TestPartnersRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        admin_row = await return_canned_user(self.db, "partner admin", 515151)
        self.admin = await create_canned_user(self.db, admin_row)
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.admin.id},
        )
        raw = AuthenticationService.generate_session_token_for_user(self.admin.id)
        self.admin_token = (
            f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
        )

        self.partner_id = await self.db.execute(
            """
            INSERT INTO partners (name, primary_hashtag, permalink, website_links)
            VALUES (:name, :primary_hashtag, :permalink, :website_links)
            RETURNING id
            """,
            {
                "name": "Test Partner",
                "primary_hashtag": "#TestPartner",
                "permalink": "test-partner",
                "website_links": "[]",
            },
        )
        self.url = f"/api/v2/partners/{self.partner_id}/"

    async def test_updates_partner_with_edit_form_payload(self, client: AsyncClient):
        # The edit form sends back every field it loaded, including id, plus its changes
        resp = await client.get(self.url, headers={"Authorization": self.admin_token})
        payload = {
            **resp.json(),
            "name": "Renamed Partner",
            "name_1": "Website",
            "url_1": "https://example.org",
        }

        resp = await client.put(
            self.url, json=payload, headers={"Authorization": self.admin_token}
        )

        assert resp.status_code == 200
        assert resp.json()["id"] == self.partner_id
        assert resp.json()["name"] == "Renamed Partner"
        assert resp.json()["primary_hashtag"] == "#TestPartner"
        assert resp.json()["website_links"] == [
            {"name": "Website", "url": "https://example.org"}
        ]

    async def test_update_cannot_change_partner_id(self, client: AsyncClient):
        resp = await client.put(
            self.url,
            json={"id": self.partner_id + 1000, "name": "Renamed Partner"},
            headers={"Authorization": self.admin_token},
        )

        assert resp.status_code == 200
        assert resp.json()["id"] == self.partner_id
        assert resp.json()["name"] == "Renamed Partner"

    async def test_update_ignores_fields_that_are_not_partner_columns(
        self, client: AsyncClient
    ):
        resp = await client.put(
            self.url,
            json={"name": "Renamed Partner", "not_a_column": "value"},
            headers={"Authorization": self.admin_token},
        )

        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed Partner"
        assert "not_a_column" not in resp.json()

    async def test_update_without_editable_fields_returns_partner_unchanged(
        self, client: AsyncClient
    ):
        resp = await client.put(
            self.url,
            json={"id": self.partner_id},
            headers={"Authorization": self.admin_token},
        )

        assert resp.status_code == 200
        assert resp.json()["name"] == "Test Partner"
