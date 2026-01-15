# tests/api/integration/test_tasks_statistics_refactored.py
import base64
from datetime import datetime, timedelta

import pytest
from httpx import AsyncClient

from backend.models.postgis.statuses import TaskStatus
from backend.models.postgis.task import Task
from backend.services.campaign_service import CampaignService, CampaignProjectDTO

from backend.services.users.authentication_service import AuthenticationService

from tests.api.helpers.test_helpers import (
    return_canned_campaign,
    return_canned_organisation,
    return_canned_user,
    create_canned_user,
    create_canned_campaign,
    create_canned_project,
    create_canned_organisation,
)


def _encode_token(raw_token: str) -> str:
    return base64.b64encode(raw_token.encode("utf-8")).decode("utf-8")


@pytest.mark.anyio
class TestTasksStatisticsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        """
        Create a user and two projects, then create task history entries used in tests.
        Conventions followed from the working reference:
         - create_canned_project(db) -> (project, author, project_id)
         - return_canned_user(db, username, id) -> payload used with create_canned_user(db, payload)
        """
        self.db = db_connection_fixture
        self.url = "/api/v2/tasks/statistics/"

        # create and persist user
        user_payload = await return_canned_user(self.db, "test_user", 1111111)
        self.test_user = await create_canned_user(self.db, user_payload)

        raw = AuthenticationService.generate_session_token_for_user(self.test_user.id)
        self.user_session_token = _encode_token(raw)

        # create two projects (reference returns project, author, project_id)
        self.test_project_1, _, self.test_project_1_id = await create_canned_project(
            self.db, name="Test Project 1"
        )
        self.test_project_2, _, self.test_project_2_id = await create_canned_project(
            self.db, name="Test Project 2"
        )

        # create task history entries
        await self.create_task_history(
            1, self.test_project_1_id, self.test_user.id, TaskStatus.VALIDATED, self.db
        )
        await self.create_task_history(
            2, self.test_project_1_id, self.test_user.id, TaskStatus.MAPPED, self.db
        )
        await self.create_task_history(
            3, self.test_project_2_id, self.test_user.id, TaskStatus.MAPPED, self.db
        )

    @staticmethod
    async def create_task_history(task_id, project_id, user_id, action, db):
        """
        Create the minimal lock/unlock sequence for a task to register the requested action.
        Uses the async Task static methods as in the reference tests.
        """
        task = await Task.get(task_id, project_id, db)

        if action in (TaskStatus.MAPPED, TaskStatus.BADIMAGERY):
            await Task.lock_task_for_mapping(task.id, task.project_id, user_id, db)
            await Task.unlock_task(task.id, task.project_id, user_id, action, db)

        elif action == TaskStatus.VALIDATED:
            await Task.lock_task_for_validating(task.id, task.project_id, user_id, db)
            await Task.unlock_task(task.id, task.project_id, user_id, action, db)

    async def test_returns_403_if_not_authenticated(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_returns_422_if_start_date_is_not_provided(self, client: AsyncClient):
        resp = await client.get(
            self.url, headers={"Authorization": f"Token {self.user_session_token}"}
        )
        assert resp.status_code == 422

    async def test_returns_400_if_start_date_is_not_valid(self, client: AsyncClient):
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"startDate": "not a date"},
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "InvalidDateValue"

    async def test_returns_400_if_end_date_is_not_valid(self, client: AsyncClient):
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"startDate": "2020-01-01", "endDate": "not a date"},
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "InvalidDateValue"

    async def test_returns_400_if_start_date_is_after_end_date(
        self, client: AsyncClient
    ):
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"startDate": "2020-01-02", "endDate": "2020-01-01"},
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "InvalidDateRange"

    async def test_returns_400_if_date_range_is_greater_than_1_year(
        self, client: AsyncClient
    ):
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={
                "startDate": "2019-01-01",
                "endDate": datetime.now().strftime("%Y-%m-%d"),
            },
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "InvalidDateRange"

    async def test_returns_200_if_valid_date_range(self, client: AsyncClient):
        start_date = (datetime.now() - timedelta(days=6 * 30)).strftime("%Y-%m-%d")
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"startDate": start_date},
        )
        assert resp.status_code == 200
        body = resp.json()
        # expecting mapped=2, validated=1, badImagery=0 from setUp history
        assert body["taskStats"][0]["mapped"] == 2
        assert body["taskStats"][0]["validated"] == 1
        assert body["taskStats"][0]["badImagery"] == 0

    async def test_filters_task_by_project(self, client: AsyncClient):
        start_date = (datetime.now() - timedelta(days=6 * 30)).strftime("%Y-%m-%d")
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"startDate": start_date, "projectId": self.test_project_1_id},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["taskStats"][0]["mapped"] == 1
        assert body["taskStats"][0]["validated"] == 1
        assert body["taskStats"][0]["badImagery"] == 0

    async def test_filters_by_multiple_projects(self, client: AsyncClient):
        # create a 3rd project and add a mapped task in it
        test_project_3, _, test_project_3_id = await create_canned_project(
            self.db, name="Test Project 3"
        )
        await self.create_task_history(
            2, test_project_3_id, self.test_user.id, TaskStatus.MAPPED, self.db
        )

        start_date = (datetime.now() - timedelta(days=6 * 30)).strftime("%Y-%m-%d")
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={
                "startDate": start_date,
                "projectId": f"{self.test_project_1_id},{self.test_project_2_id}",
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["taskStats"][0]["mapped"] == 2
        assert body["taskStats"][0]["validated"] == 1
        assert body["taskStats"][0]["badImagery"] == 0

    async def test_filters_by_organisation_id(self, client: AsyncClient):

        new_org = return_canned_organisation(
            org_id=50,
            org_name="testorg",
            org_slug="torg",
        )
        new_test_organisation = await create_canned_organisation(self.db, new_org)
        await self.db.execute(
            """
            UPDATE projects
            SET organisation_id = :org_id
            WHERE id = :project_id
            """,
            values={"org_id": new_org.id, "project_id": self.test_project_1_id},
        )

        start_date = (datetime.now() - timedelta(days=6 * 30)).strftime("%Y-%m-%d")
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={
                "startDate": start_date,
                "organisationId": new_test_organisation.id,
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["taskStats"][0]["mapped"] == 1
        assert body["taskStats"][0]["validated"] == 1
        assert body["taskStats"][0]["badImagery"] == 0

    async def test_filters_by_organisation_name(self, client: AsyncClient):

        new_org = return_canned_organisation(
            org_id=50,
            org_name="testorg",
            org_slug="torg",
        )
        await create_canned_organisation(self.db, new_org)
        await self.db.execute(
            """
            UPDATE projects
            SET organisation_id = :org_id
            WHERE id = :project_id
            """,
            values={"org_id": new_org.id, "project_id": self.test_project_1_id},
        )

        start_date = (datetime.now() - timedelta(days=6 * 30)).strftime("%Y-%m-%d")
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"startDate": start_date, "organisationName": new_org.name},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["taskStats"][0]["mapped"] == 1
        assert body["taskStats"][0]["validated"] == 1
        assert body["taskStats"][0]["badImagery"] == 0

    async def test_filters_by_campaign(self, client: AsyncClient):
        test_campaign = return_canned_campaign()
        await create_canned_campaign(self.db, test_campaign)
        campaign_dto = CampaignProjectDTO(
            campaign_id=test_campaign.id, project_id=self.test_project_2_id
        )
        await CampaignService.create_campaign_project(campaign_dto, self.db)

        start_date = (datetime.now() - timedelta(days=6 * 30)).strftime("%Y-%m-%d")
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"startDate": start_date, "campaign": test_campaign.name},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["taskStats"][0]["mapped"] == 1
        assert body["taskStats"][0]["validated"] == 0
        assert body["taskStats"][0]["badImagery"] == 0

    async def test_filters_by_country(self, client: AsyncClient):
        # Set different countries and persist

        await self.db.execute(
            """
            UPDATE projects
            SET country = ARRAY['Nepal']
            WHERE id = :pid
        """,
            {"pid": self.test_project_1_id},
        )

        await self.db.execute(
            """
            UPDATE projects
            SET country = ARRAY['England']
            WHERE id = :pid
        """,
            {"pid": self.test_project_2_id},
        )

        start_date = (datetime.now() - timedelta(days=6 * 30)).strftime("%Y-%m-%d")
        resp = await client.get(
            self.url,
            headers={"Authorization": f"Token {self.user_session_token}"},
            params={"startDate": start_date, "country": "Nepal"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["taskStats"][0]["mapped"] == 1
        assert body["taskStats"][0]["validated"] == 1
        assert body["taskStats"][0]["badImagery"] == 0
