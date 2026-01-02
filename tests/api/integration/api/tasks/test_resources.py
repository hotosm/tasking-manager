# tests/api/integration/test_tasks_queries_refactored.py
import base64
import xml.etree.ElementTree as ET

import pytest
from httpx import AsyncClient

from backend.models.postgis.statuses import ProjectStatus, TaskStatus
from backend.models.postgis.task import Task
from backend.services.project_admin_service import ProjectAdminService
from backend.services.users.authentication_service import AuthenticationService

# Use the test helpers you referenced in your working suite
from tests.api.helpers.test_helpers import (
    create_canned_project,
    create_canned_user,
    return_canned_user,
)


def _encode_token(raw_token: str) -> str:
    return base64.b64encode(raw_token.encode("utf-8")).decode("utf-8")


@pytest.mark.anyio
class TestGetTasksQueriesJsonAPI:
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

        self.url = f"/api/v2/projects/{self.test_project_id}/tasks/"

    async def test_returns_404_if_project_does_not_exist(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/11111/tasks/")
        assert resp.status_code == 404

    async def test_returns_all_tasks_if_task_ids_not_specified(
        self, client: AsyncClient
    ):
        resp = await client.get(self.url)
        assert resp.status_code == 200
        body = resp.json()
        assert set(body.keys()) == {"type", "features"}
        assert body["type"] == "FeatureCollection"
        assert len(body["features"]) == 4

    async def test_returns_only_specified_tasks_if_task_ids_specified(
        self, client: AsyncClient
    ):
        resp = await client.get(self.url + "?tasks=1,2")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["features"]) == 2
        assert body["features"][0]["properties"]["taskId"] == 1
        assert body["features"][1]["properties"]["taskId"] == 2

    async def test_returns_tasks_as_file_id_as_file_set_true(self, client: AsyncClient):
        resp = await client.get(self.url + "?as_file=true")
        assert resp.status_code == 200
        assert resp.headers["Content-Type"] == "application/geo+json"
        assert resp.headers["Content-Disposition"] == (
            f'attachment; filename="{self.test_project_id}-tasks.geojson"'
        )
        body = resp.json()
        assert set(body.keys()) == {"type", "features"}
        assert body["type"] == "FeatureCollection"
        assert len(body["features"]) == 4


@pytest.mark.anyio
class TestTaskRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        raw_author = AuthenticationService.generate_session_token_for_user(
            self.test_author.id
        )
        self.test_author_access_token = _encode_token(raw_author)
        self.url = f"/api/v2/projects/{self.test_project_id}/tasks/1/"

    async def test_returrns_404_if_project_does_not_exist(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/11111/tasks/1/")
        assert resp.status_code == 404

    async def test_returns_404_if_task_does_not_exist(self, client: AsyncClient):
        resp = await client.get(f"/api/v2/projects/{self.test_project_id}/tasks/999/")
        assert resp.status_code == 404

    async def test_returns_200_if_task_exists(self, client: AsyncClient):
        # use reference Task API: get with db
        task = await Task.get(1, self.test_project_id, self.db)
        # lock for validating and then unlock (validated) using static async Task methods pattern
        await Task.lock_task_for_validating(
            task.id, task.project_id, self.test_author.id, self.db
        )
        await Task.unlock_task(
            task.id,
            task.project_id,
            self.test_author.id,
            TaskStatus.VALIDATED,
            self.db,
            "Test comment",
        )

        resp = await client.get(self.url)
        assert resp.status_code == 200
        body = resp.json()
        expected_keys = {
            "taskId",
            "projectId",
            "taskStatus",
            "taskHistory",
            "taskAnnotation",
            "perTaskInstructions",
            "autoUnlockSeconds",
            "lastUpdated",
            "numberOfComments",
            "lockHolder",
        }
        assert set(body.keys()) == expected_keys
        assert body["taskId"] == 1
        assert body["projectId"] == self.test_project_id
        assert body["taskStatus"] == TaskStatus.VALIDATED.name
        assert len(body["taskHistory"]) == 3
        assert body["taskHistory"][2]["action"] == "LOCKED_FOR_VALIDATION"
        assert body["taskHistory"][1]["action"] == "COMMENT"
        assert body["taskHistory"][0]["action"] == "STATE_CHANGE"


@pytest.mark.anyio
class TestTasksQueriesGpxAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        raw_author = AuthenticationService.generate_session_token_for_user(
            self.test_author.id
        )
        self.test_author_access_token = _encode_token(raw_author)
        self.url = f"/api/v2/projects/{self.test_project_id}/tasks/queries/gpx/"

    async def test_returns_404_if_project_does_not_exist(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/11111/tasks/queries/gpx/")
        assert resp.status_code == 404

    async def test_returns_all_tasks_if_no_tasks_specified(self, client: AsyncClient):
        resp = await client.get(self.url)
        ns = {"gpx": "http://www.topografix.com/GPX/1/1"}
        assert resp.status_code == 200
        response_xml = ET.fromstring(resp.text)
        assert response_xml.attrib == {
            "version": "1.1",
            "creator": "HOT Tasking Manager",
        }
        trk = response_xml.find("gpx:trk", namespaces=ns)
        assert (
            trk.find("gpx:name", ns).text
            == f"Task for project {self.test_project_id}. Do not edit outside of this area!"
        )
        assert len([i for i in trk.findall("gpx:trkseg", ns)]) == 4

    async def test_returns_gpx_for_specified_tasks(self, client: AsyncClient):
        resp = await client.get(self.url + "?tasks=1,2")
        ns = {"gpx": "http://www.topografix.com/GPX/1/1"}
        assert resp.status_code == 200
        response_xml = ET.fromstring(resp.text)
        assert response_xml.attrib == {
            "version": "1.1",
            "creator": "HOT Tasking Manager",
        }
        trk = response_xml.find("gpx:trk", namespaces=ns)
        assert (
            trk.find("gpx:name", ns).text
            == f"Task for project {self.test_project_id}. Do not edit outside of this area!"
        )
        assert len([i for i in trk.findall("gpx:trkseg", ns)]) == 2

    async def test_returns_file_if_as_file_set_true(self, client: AsyncClient):
        resp = await client.get(self.url + "?as_file=true")
        assert resp.status_code == 200
        assert resp.headers["Content-Type"] == "text/xml; charset=utf-8"
        assert resp.headers["Content-Disposition"] == (
            f"attachment; filename=HOT-project-{self.test_project_id}.gpx"
        )


@pytest.mark.anyio
class TestTasksQueriesXmlAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        raw_author = AuthenticationService.generate_session_token_for_user(
            self.test_author.id
        )
        self.test_author_access_token = _encode_token(raw_author)
        self.url = f"/api/v2/projects/{self.test_project_id}/tasks/queries/xml/"

    async def test_returns_404_if_project_does_not_exist(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/11111/tasks/queries/xml/")
        assert resp.status_code == 404

    async def test_returns_all_tasks_if_no_tasks_specified(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 200
        response_xml = ET.fromstring(resp.text)
        assert response_xml.attrib == {
            "version": "0.6",
            "upload": "never",
            "creator": "HOT Tasking Manager",
        }
        assert len([i for i in response_xml.findall("way")]) == 4

    async def test_returns_xml_for_specified_tasks(self, client: AsyncClient):
        resp = await client.get(self.url + "?tasks=1,2")
        assert resp.status_code == 200
        response_xml = ET.fromstring(resp.text)
        assert response_xml.attrib == {
            "version": "0.6",
            "upload": "never",
            "creator": "HOT Tasking Manager",
        }
        assert len([i for i in response_xml.findall("way")]) == 2

    async def test_returns_file_if_as_file_set_true(self, client: AsyncClient):
        resp = await client.get(self.url + "?as_file=true")
        assert resp.status_code == 200
        assert resp.headers["Content-Type"] == "text/xml; charset=utf-8"
        assert resp.headers["Content-Disposition"] == (
            f"attachment; filename=HOT-project-{self.test_project_id}.osm"
        )


@pytest.mark.anyio
class TestTasksQueriesMappedAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        payload = await return_canned_user(self.db, "TEST USER", 1111111)
        self.test_user = await create_canned_user(self.db, payload)
        self.url = f"/api/v2/projects/{self.test_project_id}/tasks/queries/mapped/"

    async def test_returns_404_if_project_does_not_exist(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/999999/tasks/queries/mapped/")
        assert resp.status_code == 404

    async def test_get_mapped_tasks(self, client: AsyncClient):
        # reset via admin service (reference is async)
        await ProjectAdminService.reset_all_tasks(
            self.test_project_id, self.test_author.id, self.db
        )

        t1 = await Task.get(1, self.test_project_id, self.db)
        t2 = await Task.get(2, self.test_project_id, self.db)

        await Task.lock_task_for_mapping(
            t1.id, t1.project_id, self.test_user.id, self.db
        )
        await Task.unlock_task(
            t1.id, t1.project_id, self.test_user.id, TaskStatus.MAPPED, self.db
        )

        await Task.lock_task_for_mapping(
            t2.id, t2.project_id, self.test_author.id, self.db
        )
        await Task.unlock_task(
            t2.id, t2.project_id, self.test_author.id, TaskStatus.MAPPED, self.db
        )

        resp = await client.get(self.url)
        assert resp.status_code == 200
        body = resp.json()
        assert body["mappedTasks"][0]["username"] == self.test_user.username
        assert body["mappedTasks"][1]["username"] == self.test_author.username
        assert body["mappedTasks"][0]["mappedTaskCount"] == 1
        assert body["mappedTasks"][1]["mappedTaskCount"] == 1
        assert body["mappedTasks"][0]["tasksMapped"] == [1]
        assert body["mappedTasks"][1]["tasksMapped"] == [2]
