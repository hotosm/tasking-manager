import asyncio
import base64
import random
from datetime import datetime, timedelta

import pytest
from httpx import AsyncClient

from backend.services.users.authentication_service import AuthenticationService
from backend.models.postgis.task import Task, TaskStatus
from backend.exceptions import get_message_from_sub_code

from tests.api.helpers.test_helpers import (
    create_canned_project,
    create_canned_user,
    return_canned_user,
)

TEST_USERNAME = "test_user"
TEST_USER_ID = 1111111

USER_NOT_FOUND_SUB_CODE = "USER_NOT_FOUND"
USER_NOT_FOUND_MESSAGE = get_message_from_sub_code(USER_NOT_FOUND_SUB_CODE)


def make_token_for_user(user_id: int) -> str:
    raw = AuthenticationService.generate_session_token_for_user(user_id)
    return f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"


@pytest.mark.anyio
class TestUsersStatisticsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.user_session_token = make_token_for_user(self.test_author.id)
        self.url = f"/api/v2/users/{self.test_author.username}/statistics/"

    async def test_returns_401_if_no_token(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_return_404_if_user_not_found(self, client: AsyncClient):
        resp = await client.get(
            "/api/v2/users/doesntexist/statistics/",
            headers={"Authorization": self.user_session_token},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == USER_NOT_FOUND_SUB_CODE

    async def test_return_200_if_user_found(self, client: AsyncClient):
        await Task.lock_task_for_mapping(
            1, self.test_project_id, self.test_author.id, self.db
        )
        await asyncio.sleep(2)

        await Task.unlock_task(
            1, self.test_project_id, self.test_author.id, TaskStatus.MAPPED, self.db
        )
        resp = await client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )

        assert resp.status_code == 200
        body = resp.json()

        # original exact assertions — keep them to remain behavior-identical
        assert body["totalTimeSpent"] == 2
        assert body["timeSpentMapping"] == 2
        assert body["timeSpentValidating"] == 0
        assert body["projectsMapped"] == 1
        assert body["countriesContributed"]["total"] == 0
        assert body["tasksMapped"] == 1
        assert body["tasksValidated"] == 0
        assert body["tasksInvalidated"] == 0
        assert body["tasksInvalidatedByOthers"] == 0
        assert body["tasksValidatedByOthers"] == 0
        assert body["ContributionsByInterest"] == []


@pytest.mark.anyio
class TestUsersStatisticsAllAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.user_session_token = make_token_for_user(self.test_author.id)
        self.url = "/api/v2/users/statistics/"

    def generate_random_user_level(self):
        return random.randint(1, 3)

    async def test_returns_401_if_no_token(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_returns_400_if_start_date_not_provided(self, client: AsyncClient):
        resp = await client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        assert resp.status_code == 422

    async def test_returns_400_if_invalid_date_value(self, client: AsyncClient):
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"startDate": "invalid"},
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "InvalidDateValue"

    async def test_returns_400_if_start_date_greater_than_end_date(
        self, client: AsyncClient
    ):
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"startDate": "2020-01-01", "endDate": "2019-01-01"},
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "InvalidDateRange"

    async def test_returns_400_if_date_range_greater_than_3_years(
        self, client: AsyncClient
    ):
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"startDate": "2017-01-01", "endDate": "2021-01-01"},
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "InvalidDateRange"

    async def test_returns_all_users_statistics(self, client: AsyncClient):
        # Arrange
        mapping_level_dict = {1: 0, 2: 0, 3: 0}
        cutoff_date = datetime.today() - timedelta(days=100)

        # Create 10 users with random mapping levels, set date_registered to 100 days ago
        for i in range(10):
            row = await return_canned_user(self.db, f"user_{i}", i)
            user = await create_canned_user(self.db, row)
            lvl = self.generate_random_user_level()
            mapping_level_dict[lvl] += 1
            await self.db.execute(
                "UPDATE users SET mapping_level = :lvl, date_registered = :dr WHERE id = :id",
                {"lvl": lvl, "dr": cutoff_date.date(), "id": user.id},
            )

        # Act
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={
                "startDate": cutoff_date.strftime("%Y-%m-%d"),
                "endDate": datetime.now().strftime("%Y-%m-%d"),
            },
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 10
        by_level = {item["name"].lower(): item["count"] for item in body["byLevel"]}
        assert by_level["beginner"] == mapping_level_dict[1]
        assert by_level["intermediate"] == mapping_level_dict[2]
        assert by_level["advanced"] == mapping_level_dict[3]
