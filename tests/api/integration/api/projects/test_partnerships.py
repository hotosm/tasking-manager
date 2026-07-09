import json
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient

from backend.services.project_partnership_service import ProjectPartnershipService
from tests.api.helpers.test_helpers import (
    create_canned_project,
    create_canned_user,
    generate_encoded_token,
    return_canned_user,
)


async def create_test_partner(db, name="Test Partner", hashtag="#testpartner"):
    """Create a minimal partner record for project partnership integration tests."""
    query = """
        INSERT INTO partners (name, primary_hashtag, permalink)
        VALUES (:name, :primary_hashtag, :permalink)
        RETURNING id
    """
    result = await db.fetch_one(
        query=query,
        values={
            "name": name,
            "primary_hashtag": hashtag,
            "permalink": name.lower().replace(" ", "-"),
        },
    )
    return result["id"]


def unwrap_json_response_tuple(body):
    """Extract the real JSON body when an endpoint returns a tuple with JSONResponse."""
    if isinstance(body, list) and body and "body" in body[0]:
        return json.loads(body[0]["body"])
    return body


def unwrap_inner_status_code(body, default_status_code):
    """Extract inner JSONResponse status code when FastAPI serializes it as data."""
    if isinstance(body, list) and body and "status_code" in body[0]:
        return body[0]["status_code"]
    return default_status_code


@pytest.mark.anyio
class TestProjectPartnershipsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # Proyecto base para asociarlo con un partner.
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        # Partner mínimo para probar la relación proyecto-partner.
        self.partner_id = await create_test_partner(
            self.db,
            name="Coverage Partner",
            hashtag="#coveragepartner",
        )

        # Usuario de apoyo para mantener la estructura del setup.
        self.test_user = await return_canned_user(
            self.db,
            username="non_manager_user",
            id=22222222,
        )
        self.test_user = await create_canned_user(self.db, self.test_user)

        self.author_token = generate_encoded_token(self.test_author.id)
        self.user_token = generate_encoded_token(self.test_user.id)

        self.started_on = "2026-07-01T10:00:00"
        self.ended_on = "2026-07-02T10:00:00"

    async def test_create_partnership_returns_success_for_project_author(
        self, client: AsyncClient
    ):
        # El autor del proyecto sí puede asociar un partner.
        payload = {
            "projectId": self.test_project_id,
            "partnerId": self.partner_id,
            "startedOn": self.started_on,
            "endedOn": self.ended_on,
        }

        response = await client.post(
            "/api/v2/projects/partnerships/",
            json=payload,
            headers={"Authorization": f"Token {self.author_token}"},
        )

        assert response.status_code == 200

        raw_body = response.json()
        body = unwrap_json_response_tuple(raw_body)

        assert unwrap_inner_status_code(raw_body, response.status_code) == 201
        assert body["partnershipId"] is not None
        assert (
            body["Success"]
            == f"Partner {self.partner_id} assigned to project {self.test_project_id}"
        )

    async def test_get_partnership_by_id_returns_200(self, client: AsyncClient):
        # Se crea la relación directamente para luego consultarla por endpoint.
        partnership_id = await ProjectPartnershipService.create_partnership(
            self.db,
            self.test_project_id,
            self.partner_id,
            datetime(2026, 7, 1, 10, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 7, 2, 10, 0, 0, tzinfo=timezone.utc),
        )

        response = await client.get(
            f"/api/v2/projects/partnerships/{partnership_id}/"
        )

        assert response.status_code == 200

        body = response.json()
        assert body["id"] == partnership_id
        assert body["projectId"] == self.test_project_id
        assert body["partnerId"] == self.partner_id

    async def test_get_project_partners_returns_200(self, client: AsyncClient):
        # Valida que un proyecto pueda listar sus partners asociados.
        partnership_id = await ProjectPartnershipService.create_partnership(
            self.db,
            self.test_project_id,
            self.partner_id,
            datetime(2026, 7, 1, 10, 0, 0, tzinfo=timezone.utc),
            None,
        )

        response = await client.get(
            f"/api/v2/projects/{self.test_project_id}/partners/"
        )

        assert response.status_code == 200

        body = response.json()
        assert len(body["partnerships"]) == 1
        assert body["partnerships"][0]["id"] == partnership_id
        assert body["partnerships"][0]["projectId"] == self.test_project_id
        assert body["partnerships"][0]["partnerId"] == self.partner_id

    async def test_patch_partnership_updates_time_range(self, client: AsyncClient):
        # Se actualizan las fechas de vigencia de la relación.
        partnership_id = await ProjectPartnershipService.create_partnership(
            self.db,
            self.test_project_id,
            self.partner_id,
            datetime(2026, 7, 1, 10, 0, 0, tzinfo=timezone.utc),
            None,
        )

        payload = {
            "startedOn": "2026-07-03T10:00:00",
            "endedOn": "2026-07-04T10:00:00",
        }

        response = await client.patch(
            f"/api/v2/projects/partnerships/{partnership_id}/",
            json=payload,
            headers={"Authorization": f"Token {self.author_token}"},
        )

        assert response.status_code == 200

        raw_body = response.json()
        body = unwrap_json_response_tuple(raw_body)

        assert "Updated time range" in body["Success"]
        assert body["startedOn"] is not None
        assert body["endedOn"] is not None

    async def test_delete_partnership_removes_record(self, client: AsyncClient):
        # Se elimina la relación y luego se verifica que ya no figure en el proyecto.
        partnership_id = await ProjectPartnershipService.create_partnership(
            self.db,
            self.test_project_id,
            self.partner_id,
            datetime(2026, 7, 1, 10, 0, 0, tzinfo=timezone.utc),
            None,
        )

        response = await client.delete(
            f"/api/v2/projects/partnerships/{partnership_id}/",
            headers={"Authorization": f"Token {self.author_token}"},
        )

        assert response.status_code == 200

        body = unwrap_json_response_tuple(response.json())
        assert body["Success"] == f"Partnership ID {partnership_id} deleted"

        deleted = await ProjectPartnershipService.get_partnerships_by_project(
            self.test_project_id, self.db
        )
        assert len(deleted) == 0