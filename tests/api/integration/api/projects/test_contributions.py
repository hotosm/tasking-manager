from datetime import datetime

import pytest
from httpx import AsyncClient

from backend.models.postgis.statuses import ProjectStatus, TaskStatus
from backend.models.postgis.task import Task
from tests.api.helpers.test_helpers import (
    create_canned_project,
    return_canned_user,
    create_canned_user,
)


@pytest.mark.anyio
class TestProjectsContributionsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        # reference convention: (project, author, project_id)
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        await self.db.execute(
            "UPDATE projects SET status = :status WHERE id = :id",
            {"status": ProjectStatus.PUBLISHED.value, "id": int(self.test_project_id)},
        )
        self.url = f"/api/v2/projects/{self.test_project_id}/contributions/"

    async def test_returns_404_if_project_does_not_exist(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/999999/contributions/")
        assert resp.status_code == 404

    async def test_returns_200_if_project_exists(self, client: AsyncClient):
        # Arrange - perform mapping and validating actions to create task history
        t_map = await Task.get(2, self.test_project_id, self.db)
        await Task.lock_task_for_mapping(
            t_map.id, t_map.project_id, self.test_author.id, self.db
        )
        await Task.unlock_task(
            t_map.id, t_map.project_id, self.test_author.id, TaskStatus.MAPPED, self.db
        )

        t_val = await Task.get(1, self.test_project_id, self.db)
        await Task.lock_task_for_validating(
            t_val.id, t_val.project_id, self.test_author.id, self.db
        )
        await Task.unlock_task(
            t_val.id,
            t_val.project_id,
            self.test_author.id,
            TaskStatus.VALIDATED,
            self.db,
        )

        # Act
        resp = await client.get(self.url)
        assert resp.status_code == 200
        body = resp.json()

        # extract first user contribution (the project author)
        test_user_contribution = body["userContributions"][0]

        expected_keys = {
            "username",
            "mappingLevel",
            "pictureUrl",
            "mapped",
            "validated",
            "badImagery",
            "total",
            "mappedTasks",
            "validatedTasks",
            "badImageryTasks",
            "name",
            "dateRegistered",
        }
        assert set(test_user_contribution.keys()) == expected_keys

        assert test_user_contribution["username"] == self.test_author.username
        # Expectations inferred from project canned state + our actions
        assert test_user_contribution["mapped"] == 1
        assert test_user_contribution["validated"] == 1
        assert test_user_contribution["badImagery"] == 0
        assert test_user_contribution["mappedTasks"] == [2]
        assert test_user_contribution["badImageryTasks"] == []
        assert test_user_contribution["validatedTasks"] == [1]

    async def test_return_empty_list_if_no_contributions(self, client: AsyncClient):
        # set all tasks to READY via direct update (consistent with other refactors)
        await self.db.execute(
            """
            UPDATE tasks
            SET task_status = :status
            WHERE project_id = :proj
            """,
            {"status": TaskStatus.READY.value, "proj": int(self.test_project_id)},
        )

        resp = await client.get(self.url)
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["userContributions"]) == 0
        assert body["userContributions"] == []

    async def test_returns_list_of_all_contributors(self, client: AsyncClient):
        # Setup another user who will create a badImagery contribution
        user_payload = await return_canned_user(self.db, "test_user", 11111111)
        test_user = await create_canned_user(self.db, user_payload)

        # Invalidate task 1 by test author
        t1 = await Task.get(1, self.test_project_id, self.db)
        await Task.lock_task_for_validating(
            t1.id, t1.project_id, self.test_author.id, self.db
        )
        await Task.unlock_task(
            t1.id, t1.project_id, self.test_author.id, TaskStatus.INVALIDATED, self.db
        )

        # Lock task 2 for mapping by test_user then mark BADIMAGERY
        t2 = await Task.get(2, self.test_project_id, self.db)
        await Task.lock_task_for_mapping(t2.id, t2.project_id, test_user.id, self.db)
        await Task.unlock_task(
            t2.id, t2.project_id, test_user.id, TaskStatus.BADIMAGERY, self.db
        )

        # Act
        resp = await client.get(self.url)
        assert resp.status_code == 200
        user_contributions_response = resp.json()["userContributions"]

        # Two contributors expected (author + test_user)
        assert len(user_contributions_response) == 2

        # First contributor: project author (based on canned project initial state + our actions)
        author_contrib = user_contributions_response[0]
        assert author_contrib["username"] == test_user.username
        assert author_contrib["mapped"] == 0
        assert author_contrib["validated"] == 0
        assert author_contrib["badImagery"] == 1
        assert author_contrib["mappedTasks"] == []
        assert author_contrib["validatedTasks"] == []
        assert author_contrib["badImageryTasks"] == [2]

        # Second contributor: our test_user
        user_contrib = user_contributions_response[1]
        assert user_contrib["username"] == self.test_author.username
        assert user_contrib["mapped"] == 0
        assert user_contrib["badImagery"] == 0
        assert user_contrib["validated"] == 0
        assert user_contrib["mappedTasks"] == []
        assert user_contrib["validatedTasks"] == []
        assert user_contrib["badImageryTasks"] == []


@pytest.mark.anyio
class TestProjectsContributionsQueriesDayAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        self.url = f"/api/v2/projects/{self.test_project_id}/contributions/queries/day/"

    async def test_returns_404_if_project_does_not_exist(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/999999/contributions/queries/day/")
        assert resp.status_code == 404

    async def test_returns_200_if_project_exists(self, client: AsyncClient):
        # Arrange: create history entries for task 2 (mapped + validated) — recorded in TaskHistory
        t2 = await Task.get(2, self.test_project_id, self.db)
        await Task.lock_task_for_mapping(
            t2.id, t2.project_id, self.test_author.id, self.db
        )
        await Task.unlock_task(
            t2.id, t2.project_id, self.test_author.id, TaskStatus.MAPPED, self.db
        )
        await Task.lock_task_for_validating(
            t2.id, t2.project_id, self.test_author.id, self.db
        )
        await Task.unlock_task(
            t2.id, t2.project_id, self.test_author.id, TaskStatus.VALIDATED, self.db
        )

        # Act
        resp = await client.get(self.url)
        assert resp.status_code == 200
        body = resp.json()

        # Expect a single day (today) of stats
        assert len(body["stats"]) == 1
        stat = body["stats"][0]
        expected_keys = {
            "date",
            "mapped",
            "validated",
            "cumulative_mapped",
            "cumulative_validated",
            "total_tasks",
        }
        assert set(stat.keys()) == expected_keys
        assert stat["date"] == datetime.today().strftime("%Y-%m-%d")
        assert stat["mapped"] == 1
        assert stat["validated"] == 1
        assert stat["cumulative_mapped"] == 1
        assert stat["cumulative_validated"] == 1
        assert stat["total_tasks"] == 4
