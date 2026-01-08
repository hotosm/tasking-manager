import base64
import pytest
from httpx import AsyncClient

from backend.services.users.authentication_service import AuthenticationService
from backend.models.postgis.task import Task, TaskStatus
from backend.models.postgis.statuses import UserGender, UserRole
from backend.exceptions import get_message_from_sub_code

from tests.api.helpers.test_helpers import (
    create_canned_user,
    return_canned_user,
    create_canned_project,
    create_canned_interest,
)

TEST_USERNAME = "test_user"
TEST_USER_ID = 1111111
TEST_EMAIL = "test@hotmail.com"

USER_NOT_FOUND_SUB_CODE = "USER_NOT_FOUND"
USER_NOT_FOUND_MESSAGE = get_message_from_sub_code(USER_NOT_FOUND_SUB_CODE)


def make_token_for_user(user_id: int) -> str:
    raw = AuthenticationService.generate_session_token_for_user(user_id)
    return f"Token {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"


def assert_user_detail_response(
    response,
    user_id=TEST_USER_ID,
    username=TEST_USERNAME,
    email=TEST_EMAIL,
    gender=None,
    own_info=True,
):
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == user_id
    assert body["username"] == username
    if own_info:
        assert body["emailAddress"] == email
        assert body["gender"] == gender
        assert body["isEmailVerified"] is False
    else:
        assert body["emailAddress"] is None
        assert body["gender"] is None
        assert body["selfDescriptionGender"] is None


@pytest.mark.anyio
class TestUsersQueriesOwnLockedDetailsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        user_row = await return_canned_user(self.db, TEST_USERNAME, TEST_USER_ID)
        self.user = await create_canned_user(self.db, user_row)
        self.user_session_token = make_token_for_user(self.user.id)
        self.url = "/api/v2/users/queries/tasks/locked/details/"

    async def test_returns_401_without_session_token(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_returns_404_if_no_tasks_locked(self, client: AsyncClient):
        resp = await client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == "TASK_NOT_FOUND"

    async def test_returns_200_if_tasks_locked(self, client: AsyncClient):
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        await Task.lock_task_for_mapping(1, self.test_project_id, self.user.id, self.db)
        resp = await client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["tasks"]) == 1
        assert body["tasks"][0]["taskId"] == 1
        assert body["tasks"][0]["projectId"] == self.test_project_id


@pytest.mark.anyio
class TestUsersQueriesUsernameAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        user_row = await return_canned_user(self.db, TEST_USERNAME, TEST_USER_ID)
        self.user = await create_canned_user(self.db, user_row)
        self.user_session_token = make_token_for_user(self.user.id)
        self.url = f"/api/v2/users/queries/{self.user.username}/"

    async def test_returns_401_without_session_token(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_returns_404_if_user_not_found(self, client: AsyncClient):
        resp = await client.get(
            "/api/v2/users/queries/unknown_user/",
            headers={"Authorization": self.user_session_token},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == USER_NOT_FOUND_SUB_CODE

    async def test_returns_email_and_gender_if_own_info_requested(
        self, client: AsyncClient
    ):
        await self.db.execute(
            "UPDATE users SET email_address = :email, gender = :gender WHERE id = :id",
            {"email": TEST_EMAIL, "gender": UserGender.MALE.value, "id": self.user.id},
        )

        resp = await client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        assert_user_detail_response(
            resp, TEST_USER_ID, TEST_USERNAME, TEST_EMAIL, UserGender.MALE.name, True
        )

    async def test_email_and_gender_not_returned_if_requested_by_other(
        self, client: AsyncClient
    ):
        await self.db.execute(
            "UPDATE users SET email_address = :email, gender = :gender WHERE id = :id",
            {
                "email": TEST_EMAIL,
                "gender": UserGender.FEMALE.value,
                "id": self.user.id,
            },
        )

        other_row = await return_canned_user(self.db, "user_2", 2222222)
        other = await create_canned_user(self.db, other_row)
        other_token = make_token_for_user(other.id)

        resp = await client.get(self.url, headers={"Authorization": other_token})
        assert_user_detail_response(
            resp, TEST_USER_ID, TEST_USERNAME, None, None, False
        )


@pytest.mark.anyio
class TestUsersQueriesOwnLockedAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        user_row = await return_canned_user(self.db, TEST_USERNAME, TEST_USER_ID)
        self.user = await create_canned_user(self.db, user_row)
        self.user_session_token = make_token_for_user(self.user.id)
        self.url = "/api/v2/users/queries/tasks/locked/"

    async def test_returns_401_without_session_token(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_returns_empty_list_if_no_tasks_locked(self, client: AsyncClient):
        resp = await client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["lockedTasks"] == []
        assert body["projectId"] is None
        assert body["taskStatus"] is None

    async def test_returns_locked_task_if_tasks_locked(self, client: AsyncClient):
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )
        await Task.lock_task_for_mapping(1, self.test_project_id, self.user.id, self.db)

        resp = await client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        body = resp.json()
        assert resp.status_code == 200
        assert body["lockedTasks"] == [1]
        assert body["projectId"] == self.test_project_id
        assert body["taskStatus"] == TaskStatus.LOCKED_FOR_MAPPING.name


@pytest.mark.anyio
class UsersQueriesInterestsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        user_row = await return_canned_user(self.db, TEST_USERNAME, TEST_USER_ID)
        self.user = await create_canned_user(self.db, user_row)
        self.user_session_token = make_token_for_user(self.user.id)
        self.url = f"/api/v2/users/{self.user.username}/queries/interests/"

    async def test_returns_401_without_session_token(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_returns_empty_list_if_no_interests(self, client: AsyncClient):
        resp = await client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        assert resp.status_code == 200
        assert resp.json()["interests"] == []

    async def test_returns_404_if_user_not_found(self, client: AsyncClient):
        resp = await client.get(
            "/api/v2/users/invalid_username/queries/interests/",
            headers={"Authorization": self.user_session_token},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == USER_NOT_FOUND_SUB_CODE

    async def test_returns_user_interests_if_interest_found(self, client: AsyncClient):
        i1 = await create_canned_interest(self.db, name="interest_1")
        i2 = await create_canned_interest(self.db, name="interest_2")

        # Use service/DAO to attach interests or insert directly depending on helpers available
        await self.db.execute_many(
            """
            INSERT INTO user_interests (user_id, interest_id) VALUES (:user_id, :interest_id)
            """,
            [
                {"user_id": self.user.id, "interest_id": i1.id},
                {"user_id": self.user.id, "interest_id": i2.id},
            ],
        )

        resp = await client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        body = resp.json()
        assert resp.status_code == 200
        assert len(body["interests"]) == 2
        assert body["interests"][0]["id"] == i1.id
        assert body["interests"][0]["name"] == i1.name
        assert body["interests"][1]["id"] == i2.id
        assert body["interests"][1]["name"] == i2.name


@pytest.mark.anyio
class TestUsersQueriesUsernameFilterAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        # create three users matching original setup
        row1 = await return_canned_user(self.db, TEST_USERNAME, TEST_USER_ID)
        self.user = await create_canned_user(self.db, row1)
        row2 = await return_canned_user(self.db, "user_2", 2222222)
        self.user_2 = await create_canned_user(self.db, row2)
        row3 = await return_canned_user(self.db, "user_3", 3333333)
        self.user_3 = await create_canned_user(self.db, row3)

        self.user_session_token = make_token_for_user(self.user.id)
        self.url = "/api/v2/users/queries/filter/tes/"

    async def test_returns_401_without_session_token(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_returns_404_if_no_users_found(self, client: AsyncClient):
        resp = await client.get(
            "/api/v2/users/queries/filter/invalid_username/",
            headers={"Authorization": self.user_session_token},
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == USER_NOT_FOUND_SUB_CODE

    async def test_returns_users_if_users_found(self, client: AsyncClient):
        resp = await client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        assert resp.status_code == 200
        # keep original shape check
        keys = list(resp.json().keys())
        assert "pagination" in keys and "usernames" in keys and "users" in keys
        assert len(resp.json()["usernames"]) == 1
        assert resp.json()["usernames"][0] == self.user.username
        assert resp.json()["pagination"]["page"] == 1
        assert resp.json()["pagination"]["perPage"] == 20
        assert resp.json()["pagination"]["total"] == 1

    async def test_returnns_matching_project_contributors(self, client: AsyncClient):
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        await Task.get(1, self.test_project_id, self.db)
        await Task.lock_task_for_mapping(
            1, self.test_project_id, self.user_2.id, self.db
        )
        await Task.unlock_task(
            1, self.test_project_id, self.user_2.id, TaskStatus.MAPPED, self.db
        )

        resp = await client.get(
            f"/api/v2/users/queries/filter/user_/?projectId={self.test_project_id}",
            headers={"Authorization": self.user_session_token},
        )
        assert resp.status_code == 200
        assert len(resp.json()["usernames"]) == 2
        assert resp.json()["usernames"][0] == self.user_2.username
        assert resp.json()["usernames"][1] == self.user_3.username
        assert resp.json()["users"][0]["username"] == self.user_2.username
        assert resp.json()["users"][0]["projectId"] == self.test_project_id


@pytest.mark.anyio
class TestUsersAllAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        row = await return_canned_user(self.db, TEST_USERNAME, TEST_USER_ID)
        self.user = await create_canned_user(self.db, row)
        self.user_session_token = make_token_for_user(self.user.id)

        # create 30 additional users
        for i in range(30):
            row = await return_canned_user(self.db, f"user_{i}", i)
            await create_canned_user(self.db, row)

        self.url = "/api/v2/users/"

    async def test_returns_401_without_session_token(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_returns_400_if_invalid_role(self, client: AsyncClient):
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"role": "GOD"},
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "InvalidData"

    async def test_returns_per_page_20_users_by_default(self, client: AsyncClient):
        resp = await client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        assert resp.status_code == 200
        assert len(resp.json()["users"]) == 20
        assert resp.json()["pagination"]["page"] == 1
        assert resp.json()["pagination"]["perPage"] == 20
        assert resp.json()["pagination"]["total"] == 31

    async def test_pagination_can_be_disabled(self, client: AsyncClient):
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"pagination": "false"},
        )
        assert resp.status_code == 200
        assert len(resp.json()["users"]) == 31

    async def test_returns_specified_per_page_users(self, client: AsyncClient):
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"perPage": 10},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["users"]) == 10
        assert body["pagination"]["page"] == 1
        assert body["pagination"]["perPage"] == 10
        assert body["pagination"]["total"] == 31
        assert body["pagination"]["hasNext"] is True
        assert body["pagination"]["pages"] == 4

    async def test_returns_specified_page_users(self, client: AsyncClient):
        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"page": 2},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["users"]) == 11
        assert body["pagination"]["page"] == 2
        assert body["pagination"]["hasNext"] is False
        assert body["pagination"]["hasPrev"] is True
        assert body["pagination"]["pages"] == 2

    async def test_returns_users_with_specified_role_(self, client: AsyncClient):
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.ADMIN.value, "id": self.user.id},
        )

        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"role": "ADMIN"},
        )
        assert resp.status_code == 200
        assert len(resp.json()["users"]) == 1
        assert resp.json()["pagination"]["page"] == 1
        assert resp.json()["pagination"]["total"] == 1

    async def test_returns_users_with_specified_level(self, client: AsyncClient):
        level_url = "api/v2/levels/"
        levels = await client.get(level_url)
        level_results = levels.json()["levels"]
        # 3 levels: Beginner, Intermediate and Advanced are always created by migration.
        test_level = level_results[2]  # Select one level.
        await self.db.execute(
            "UPDATE users SET mapping_level = :lvl WHERE id = :id",
            {"lvl": test_level["id"], "id": self.user.id},
        )

        resp = await client.get(
            self.url,
            headers={"Authorization": self.user_session_token},
            params={"level": test_level["id"]},
        )
        assert resp.status_code == 200
        assert len(resp.json()["users"]) == 1
        assert resp.json()["users"][0]["mappingLevel"] == test_level["name"]
        assert resp.json()["pagination"]["page"] == 1
        assert resp.json()["pagination"]["total"] == 1


@pytest.mark.anyio
class TestUsersRecommendedProjectsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        row = await return_canned_user(self.db, TEST_USERNAME, TEST_USER_ID)
        self.user = await create_canned_user(self.db, row)
        self.user_session_token = make_token_for_user(self.user.id)
        self.url = f"/api/v2/users/{self.user.username}/recommended-projects/"

    async def test_returns_401_without_session_token(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_returns_404_if_user_does_not_exist(self, client: AsyncClient):
        resp = await client.get(
            "/api/v2/users/non_existent/recommended-projects/",
            headers={"Authorization": self.user_session_token},
        )
        assert resp.status_code == 404

    async def test_returns_recommended_projects(self, client: AsyncClient):
        await create_canned_project(self.db)
        resp = await client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        assert resp.status_code == 200


@pytest.mark.anyio
class TestUsersRestAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        row = await return_canned_user(self.db, TEST_USERNAME, TEST_USER_ID)
        self.user = await create_canned_user(self.db, row)
        self.user_session_token = make_token_for_user(self.user.id)
        self.url = f"/api/v2/users/{self.user.id}/"

    async def test_returns_401_without_session_token(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_returns_404_if_user_does_not_exist(self, client: AsyncClient):
        resp = await client.get(
            "/api/v2/users/999/", headers={"Authorization": self.user_session_token}
        )
        assert resp.status_code == 404

    async def test_returns_email_and_gender_if_own_info_requested(
        self, client: AsyncClient
    ):
        await self.db.execute(
            "UPDATE users SET email_address = :email, gender = :gender WHERE id = :id",
            {"email": TEST_EMAIL, "gender": UserGender.MALE.value, "id": self.user.id},
        )

        resp = await client.get(
            self.url, headers={"Authorization": self.user_session_token}
        )
        assert_user_detail_response(
            resp, TEST_USER_ID, TEST_USERNAME, TEST_EMAIL, UserGender.MALE.name, True
        )

    async def test_email_and_gender_not_returned_if_requested_by_other(
        self, client: AsyncClient
    ):
        await self.db.execute(
            "UPDATE users SET email_address = :email, gender = :gender WHERE id = :id",
            {
                "email": TEST_EMAIL,
                "gender": UserGender.FEMALE.value,
                "id": self.user.id,
            },
        )

        other_row = await return_canned_user(self.db, "user_2", 2222222)
        other = await create_canned_user(self.db, other_row)
        other_token = make_token_for_user(other.id)

        resp = await client.get(self.url, headers={"Authorization": other_token})
        assert_user_detail_response(
            resp, TEST_USER_ID, TEST_USERNAME, None, None, False
        )
