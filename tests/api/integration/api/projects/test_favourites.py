import base64

import pytest
from httpx import AsyncClient

from backend.services.project_service import ProjectService
from backend.services.users.authentication_service import AuthenticationService

from tests.api.helpers.test_helpers import create_canned_project


def _encode_token(raw_token: str) -> str:
    return base64.b64encode(raw_token.encode("utf-8")).decode("utf-8")


@pytest.mark.anyio
class TestValidateProjectFavouritedAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        raw = AuthenticationService.generate_session_token_for_user(self.test_author.id)
        self.test_author_session_token = _encode_token(raw)

        self.url = f"/api/v2/projects/{self.test_project_id}/favorite/"

    async def test_returns_403_if_no_token(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_returns_404_if_project_does_not_exist(self, client: AsyncClient):
        url = "/api/v2/projects/999/favorite/"
        resp = await client.get(
            url, headers={"Authorization": f"Token {self.test_author_session_token}"}
        )
        assert resp.status_code == 404

    async def test_returns_correct_favourite_status(self, client: AsyncClient):
        # not favourited initially
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 200
        assert resp.json() == {"favorited": False}

        # mark as favourite via service
        await ProjectService.favorite(
            self.test_project_id, self.test_author.id, self.db
        )

        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 200
        assert resp.json() == {"favorited": True}


@pytest.mark.anyio
class TestSetProjectFavouriteAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        raw = AuthenticationService.generate_session_token_for_user(self.test_author.id)
        self.test_author_session_token = _encode_token(raw)

        self.url = f"/api/v2/projects/{self.test_project_id}/favorite/"

    async def test_returns_403_if_no_token(self, client: AsyncClient):
        resp = await client.post(self.url)
        assert resp.status_code == 403

    async def test_returns_404_if_project_does_not_exist(self, client: AsyncClient):
        url = "/api/v2/projects/99999/favorite/"
        resp = await client.post(
            url, headers={"Authorization": f"Token {self.test_author_session_token}"}
        )
        assert resp.status_code == 404

    async def test_returns_200_if_user_authenticated_and_project_exists(
        self, client: AsyncClient
    ):
        resp = await client.post(
            self.url,
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 201

        fav = await ProjectService.is_favorited(
            self.test_project_id, self.test_author.id, self.db
        )
        assert fav is True


@pytest.mark.anyio
class TestUnsetProjectFavouriteAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        raw = AuthenticationService.generate_session_token_for_user(self.test_author.id)
        self.test_author_session_token = _encode_token(raw)

        self.url = f"/api/v2/projects/{self.test_project_id}/favorite/"

    async def test_returns_403_if_no_token(self, client: AsyncClient):
        resp = await client.delete(self.url)
        assert resp.status_code == 403

    async def test_returns_404_if_project_does_not_exist(self, client: AsyncClient):
        url = "/api/v2/projects/999999/favorite/"
        resp = await client.delete(
            url, headers={"Authorization": f"Token {self.test_author_session_token}"}
        )
        assert resp.status_code == 404

    async def test_returns_400_on_not_favourited_projects(self, client: AsyncClient):
        resp = await client.delete(
            self.url,
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 400

    async def test_returns_200_if_project_unfavourited(self, client: AsyncClient):
        # make favourited first
        await ProjectService.favorite(
            self.test_project_id, self.test_author.id, self.db
        )

        resp = await client.delete(
            self.url,
            headers={"Authorization": f"Token {self.test_author_session_token}"},
        )
        assert resp.status_code == 200

        fav = await ProjectService.is_favorited(
            self.test_project_id, self.test_author.id, self.db
        )
        assert fav is False
