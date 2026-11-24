import base64

import pytest
from httpx import AsyncClient

from backend.models.postgis.message import MessageType
from backend.models.postgis.statuses import (
    MappingPermission,
    ProjectStatus,
    TaskStatus,
    TeamMemberFunctions,
    TeamRoles,
    UserRole,
)
from backend.services.users.authentication_service import AuthenticationService
from tests.api.helpers.test_helpers import (
    add_user_to_team,
    assign_team_to_project,
    create_canned_project,
    create_canned_team,
    create_canned_user,
    return_canned_user,
)

MAPPER_ID = 1111111
OTHER_ID = 2222222


def _token(user_id: int) -> str:
    raw = AuthenticationService.generate_session_token_for_user(user_id)
    return base64.b64encode(raw.encode("utf-8")).decode("utf-8")


def _auth(user_id: int) -> dict:
    return {"Authorization": f"Token {_token(user_id)}"}


class AssignmentFixtures:
    """Project (author = PM), a mapper, another user and a team."""

    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        self.project, self.author, self.project_id = await create_canned_project(
            self.db
        )
        self.mapper = await create_canned_user(
            self.db, await return_canned_user(self.db, "mapper_user", MAPPER_ID)
        )
        self.other = await create_canned_user(
            self.db, await return_canned_user(self.db, "other_user", OTHER_ID)
        )
        self.team = await create_canned_team(self.db)
        self.assign_url = f"/api/v2/projects/{self.project_id}/tasks/actions/assign/"
        self.unassign_url = (
            f"/api/v2/projects/{self.project_id}/tasks/actions/unassign/"
        )
        self.list_url = f"/api/v2/projects/{self.project_id}/tasks/queries/assignments/"

    async def _set_project(self, **fields):
        set_clause = ", ".join(f"{k} = :{k}" for k in fields)
        await self.db.execute(
            f"UPDATE projects SET {set_clause} WHERE id = :id",
            {**fields, "id": int(self.project_id)},
        )

    async def _set_task(self, task_id, **fields):
        set_clause = ", ".join(f"{k} = :{k}" for k in fields)
        await self.db.execute(
            f"UPDATE tasks SET {set_clause} WHERE id = :id AND project_id = :proj",
            {**fields, "id": task_id, "proj": int(self.project_id)},
        )

    async def _assign(self, client, body, user_id=None):
        return await client.post(
            self.assign_url,
            headers=_auth(user_id or self.author.id),
            json={"notify": False, **body},
        )

    async def _assignments(self, client):
        resp = await client.get(self.list_url, headers=_auth(self.author.id))
        assert resp.status_code == 200
        return resp.json()["assignments"]

    async def _messages_for(self, user_id):
        return await self.db.fetch_all(
            "SELECT * FROM messages WHERE to_user_id = :uid AND message_type = :mt",
            {"uid": user_id, "mt": MessageType.TASK_ASSIGNMENT_NOTIFICATION.value},
        )


@pytest.mark.anyio
class TestAssignTasksAPI(AssignmentFixtures):
    async def test_requires_login(self, client: AsyncClient):
        resp = await client.post(self.assign_url, json={"taskIds": [2], "userId": 1})
        assert resp.status_code == 403

    async def test_non_manager_gets_403(self, client: AsyncClient):
        resp = await self._assign(
            client, {"taskIds": [2], "userId": OTHER_ID}, user_id=MAPPER_ID
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "UserPermissionError"

    @pytest.mark.parametrize(
        "body",
        [
            {"taskIds": [2]},  # no assignee
            {"taskIds": [2], "userId": MAPPER_ID, "teamId": 1},  # both
            {"taskIds": [], "userId": MAPPER_ID},  # no tasks
            {"taskIds": [2], "userId": MAPPER_ID, "stage": "REVIEW"},  # bad stage
            {"taskIds": "2", "userId": MAPPER_ID},  # wrong type
        ],
    )
    async def test_invalid_body_returns_400(self, client: AsyncClient, body):
        resp = await self._assign(client, body)
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "InvalidData"

    async def test_unknown_task_returns_404(self, client: AsyncClient):
        resp = await self._assign(client, {"taskIds": [2, 999], "userId": MAPPER_ID})
        assert resp.status_code == 404
        assert resp.json()["error"]["sub_code"] == "TASK_NOT_FOUND"
        assert await self._assignments(client) == []

    async def test_unknown_user_returns_404(self, client: AsyncClient):
        resp = await self._assign(client, {"taskIds": [2], "userId": 999999999})
        assert resp.status_code == 404

    async def test_assign_user_and_list(self, client: AsyncClient):
        resp = await self._assign(client, {"taskIds": [2, 2], "userId": MAPPER_ID})
        assert resp.status_code == 200
        assert resp.json() == {"assigned": 1, "warnings": []}

        [assignment] = await self._assignments(client)
        assert assignment["taskId"] == 2
        assert assignment["stage"] == "MAPPING"
        assert assignment["assigneeType"] == "USER"
        assert assignment["userId"] == MAPPER_ID
        assert assignment["username"] == "mapper_user"
        assert assignment["teamId"] is None
        assert assignment["assignedBy"] == self.author.username
        assert assignment["assignedDate"].endswith("Z")

    async def test_reassign_replaces_previous_assignee(self, client: AsyncClient):
        await self._assign(client, {"taskIds": [2], "userId": MAPPER_ID})
        resp = await self._assign(client, {"taskIds": [2], "teamId": self.team.id})
        assert resp.status_code == 200

        [assignment] = await self._assignments(client)
        assert assignment["assigneeType"] == "TEAM"
        assert assignment["teamId"] == self.team.id
        assert assignment["teamName"] == self.team.name
        assert assignment["userId"] is None

    async def test_stages_are_independent(self, client: AsyncClient):
        await self._assign(client, {"taskIds": [1], "userId": MAPPER_ID})
        await self._assign(
            client, {"taskIds": [1], "teamId": self.team.id, "stage": "validation"}
        )
        assignments = await self._assignments(client)
        assert [(a["stage"], a["assigneeType"]) for a in assignments] == [
            ("MAPPING", "USER"),
            ("VALIDATION", "TEAM"),
        ]

    async def test_blocked_user_is_rejected(self, client: AsyncClient):
        await self.db.execute(
            "UPDATE users SET role = :role WHERE id = :id",
            {"role": UserRole.READ_ONLY.value, "id": MAPPER_ID},
        )
        resp = await self._assign(client, {"taskIds": [2], "userId": MAPPER_ID})
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "UserBlocked"

    async def test_teams_only_project_requires_user_on_project_team(
        self, client: AsyncClient
    ):
        await self._set_project(mapping_permission=MappingPermission.TEAMS.value)
        resp = await self._assign(client, {"taskIds": [2], "userId": MAPPER_ID})
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "AssigneeNotPermitted"

        await add_user_to_team(
            self.team, self.mapper, TeamMemberFunctions.MEMBER.value, True, self.db
        )
        await assign_team_to_project(
            self.project_id, self.team.id, TeamRoles.MAPPER.value, self.db
        )
        resp = await self._assign(client, {"taskIds": [2], "userId": MAPPER_ID})
        assert resp.status_code == 200

    async def test_teams_only_project_requires_team_on_project(
        self, client: AsyncClient
    ):
        await self._set_project(mapping_permission=MappingPermission.TEAMS.value)
        resp = await self._assign(client, {"taskIds": [2], "teamId": self.team.id})
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "TeamNotOnProject"

        # A MAPPER team isn't enough for validation, but is for mapping.
        await assign_team_to_project(
            self.project_id, self.team.id, TeamRoles.MAPPER.value, self.db
        )
        resp = await self._assign(client, {"taskIds": [2], "teamId": self.team.id})
        assert resp.status_code == 200
        await self._set_project(validation_permission=MappingPermission.TEAMS.value)
        resp = await self._assign(
            client, {"taskIds": [1], "teamId": self.team.id, "stage": "VALIDATION"}
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "TeamNotOnProject"

    async def test_private_project_requires_access(self, client: AsyncClient):
        await self._set_project(private=True)
        resp = await self._assign(client, {"taskIds": [2], "userId": MAPPER_ID})
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "AssigneeNotPermitted"

        await self.db.execute(
            "INSERT INTO project_allowed_users (project_id, user_id) VALUES (:p, :u)",
            {"p": int(self.project_id), "u": MAPPER_ID},
        )
        resp = await self._assign(client, {"taskIds": [2], "userId": MAPPER_ID})
        assert resp.status_code == 200

    async def test_validation_assignment_warnings(self, client: AsyncClient):
        await self._set_task(1, mapped_by=MAPPER_ID)
        await self._set_project(validation_permission_level_id=2)
        resp = await self._assign(
            client, {"taskIds": [1, 3], "userId": MAPPER_ID, "stage": "VALIDATION"}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["assigned"] == 2
        sub_codes = {w["subCode"] for w in body["warnings"]}
        assert sub_codes == {"AssigneeMappingLevelTooLow", "AssigneeIsMapper"}
        is_mapper = next(
            w for w in body["warnings"] if w["subCode"] == "AssigneeIsMapper"
        )
        assert "1" in is_mapper["message"] and "3" not in is_mapper["message"]

    async def test_project_managers_get_no_warnings(self, client: AsyncClient):
        resp = await self._assign(
            client, {"taskIds": [1], "userId": self.author.id, "stage": "VALIDATION"}
        )
        assert resp.status_code == 200
        assert resp.json()["warnings"] == []


@pytest.mark.anyio
class TestAssignmentNotifications(AssignmentFixtures):
    async def test_user_gets_one_message_per_assign_action(self, client: AsyncClient):
        resp = await self._assign(
            client, {"taskIds": [2, 3], "userId": MAPPER_ID, "notify": True}
        )
        assert resp.status_code == 200
        [message] = await self._messages_for(MAPPER_ID)
        assert message["from_user_id"] == self.author.id
        assert message["project_id"] == int(self.project_id)
        assert message["task_id"] is None  # several tasks
        assert "2 tasks" in message["subject"]

    async def test_single_task_message_links_the_task(self, client: AsyncClient):
        await self._assign(
            client, {"taskIds": [2], "userId": MAPPER_ID, "notify": True}
        )
        [message] = await self._messages_for(MAPPER_ID)
        assert message["task_id"] == 2

    async def test_notify_false_sends_nothing(self, client: AsyncClient):
        await self._assign(client, {"taskIds": [2], "userId": MAPPER_ID})
        assert await self._messages_for(MAPPER_ID) == []

    async def test_opted_out_user_gets_nothing(self, client: AsyncClient):
        await self.db.execute(
            "UPDATE users SET task_assignment_notification = false WHERE id = :id",
            {"id": MAPPER_ID},
        )
        await self._assign(
            client, {"taskIds": [2], "userId": MAPPER_ID, "notify": True}
        )
        assert await self._messages_for(MAPPER_ID) == []

    async def test_team_assignment_messages_active_members_only(
        self, client: AsyncClient
    ):
        await add_user_to_team(
            self.team, self.mapper, TeamMemberFunctions.MEMBER.value, True, self.db
        )
        await add_user_to_team(
            self.team, self.other, TeamMemberFunctions.MEMBER.value, False, self.db
        )
        await self._assign(
            client, {"taskIds": [2], "teamId": self.team.id, "notify": True}
        )
        [message] = await self._messages_for(MAPPER_ID)
        assert self.team.name in message["subject"]
        assert await self._messages_for(OTHER_ID) == []

    async def test_assigning_yourself_sends_nothing(self, client: AsyncClient):
        await self._assign(
            client, {"taskIds": [2], "userId": self.author.id, "notify": True}
        )
        assert await self._messages_for(self.author.id) == []


@pytest.mark.anyio
class TestUnassignTasksAPI(AssignmentFixtures):
    async def test_non_manager_gets_403(self, client: AsyncClient):
        resp = await client.post(
            self.unassign_url, headers=_auth(MAPPER_ID), json={"taskIds": [2]}
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "UserPermissionError"

    async def test_unassign_one_stage_or_both(self, client: AsyncClient):
        await self._assign(client, {"taskIds": [1, 2], "userId": MAPPER_ID})
        await self._assign(
            client, {"taskIds": [1], "userId": OTHER_ID, "stage": "VALIDATION"}
        )

        resp = await client.post(
            self.unassign_url,
            headers=_auth(self.author.id),
            json={"taskIds": [1], "stage": "VALIDATION"},
        )
        assert resp.json() == {"unassigned": 1}
        assert {(a["taskId"], a["stage"]) for a in await self._assignments(client)} == {
            (1, "MAPPING"),
            (2, "MAPPING"),
        }

        resp = await client.post(
            self.unassign_url,
            headers=_auth(self.author.id),
            json={"taskIds": [1, 2]},
        )
        assert resp.json() == {"unassigned": 2}
        assert await self._assignments(client) == []


@pytest.mark.anyio
class TestProjectAssignmentsVisibility(AssignmentFixtures):
    async def test_draft_project_hidden_from_anonymous(self, client: AsyncClient):
        resp = await client.get(self.list_url)
        assert resp.status_code == 403

    async def test_published_project_visible_to_anonymous(self, client: AsyncClient):
        await self._set_project(status=ProjectStatus.PUBLISHED.value)
        await self._assign(client, {"taskIds": [2], "userId": MAPPER_ID})
        resp = await client.get(self.list_url)
        assert resp.status_code == 200
        assert len(resp.json()["assignments"]) == 1

    async def test_unknown_project_returns_404(self, client: AsyncClient):
        resp = await client.get("/api/v2/projects/999999/tasks/queries/assignments/")
        assert resp.status_code == 404


@pytest.mark.anyio
class TestUserAssignedTasksAPI(AssignmentFixtures):
    url = "/api/v2/users/queries/tasks/assigned/"

    async def test_requires_login(self, client: AsyncClient):
        resp = await client.get(self.url)
        assert resp.status_code == 403

    async def test_direct_and_team_assignments(self, client: AsyncClient):
        await add_user_to_team(
            self.team, self.mapper, TeamMemberFunctions.MEMBER.value, True, self.db
        )
        await self._assign(client, {"taskIds": [2], "userId": MAPPER_ID})
        await self._assign(
            client, {"taskIds": [1], "teamId": self.team.id, "stage": "VALIDATION"}
        )
        # Pending for someone else: not mine.
        await self._assign(client, {"taskIds": [3], "userId": OTHER_ID})

        resp = await client.get(self.url, headers=_auth(MAPPER_ID))
        assert resp.status_code == 200
        body = resp.json()
        tasks = {(t["taskId"], t["stage"]): t for t in body["tasks"]}
        assert set(tasks) == {(2, "MAPPING"), (1, "VALIDATION")}
        assert tasks[(2, "MAPPING")]["assigneeType"] == "USER"
        assert tasks[(2, "MAPPING")]["taskStatus"] == "READY"
        assert tasks[(1, "VALIDATION")]["assigneeType"] == "TEAM"
        assert tasks[(1, "VALIDATION")]["teamName"] == self.team.name
        assert tasks[(1, "VALIDATION")]["projectId"] == int(self.project_id)
        assert body["pagination"]["total"] == 2

        resp = await client.get(
            self.url, headers=_auth(MAPPER_ID), params={"stage": "MAPPING"}
        )
        assert [t["taskId"] for t in resp.json()["tasks"]] == [2]

    async def test_inactive_team_membership_is_ignored(self, client: AsyncClient):
        await add_user_to_team(
            self.team, self.mapper, TeamMemberFunctions.MEMBER.value, False, self.db
        )
        await self._assign(client, {"taskIds": [2], "teamId": self.team.id})
        resp = await client.get(self.url, headers=_auth(MAPPER_ID))
        assert resp.json()["tasks"] == []

    async def test_pending_only_hides_finished_work(self, client: AsyncClient):
        # Task 4 is VALIDATED: its mapping assignment is done.
        await self._assign(client, {"taskIds": [2, 4], "userId": MAPPER_ID})
        resp = await client.get(self.url, headers=_auth(MAPPER_ID))
        assert [t["taskId"] for t in resp.json()["tasks"]] == [2]

        resp = await client.get(
            self.url, headers=_auth(MAPPER_ID), params={"pendingOnly": "false"}
        )
        assert sorted(t["taskId"] for t in resp.json()["tasks"]) == [2, 4]

    async def test_invalidated_task_is_pending_again(self, client: AsyncClient):
        await self._assign(client, {"taskIds": [1], "userId": MAPPER_ID})
        resp = await client.get(self.url, headers=_auth(MAPPER_ID))
        assert resp.json()["tasks"] == []  # task 1 is MAPPED

        await self._set_task(1, task_status=TaskStatus.INVALIDATED.value)
        resp = await client.get(self.url, headers=_auth(MAPPER_ID))
        assert [t["taskId"] for t in resp.json()["tasks"]] == [1]

    async def test_invalid_stage_returns_400(self, client: AsyncClient):
        resp = await client.get(
            self.url, headers=_auth(MAPPER_ID), params={"stage": "nope"}
        )
        assert resp.status_code == 400
        assert resp.json()["SubCode"] == "InvalidData"


@pytest.mark.anyio
class TestAssignmentLockEnforcement(AssignmentFixtures):
    @pytest.fixture(autouse=True)
    async def _publish(self, _setup):
        await self._set_project(
            status=ProjectStatus.PUBLISHED.value,
            mapping_permission_level_id=1,
            validation_permission_level_id=1,
        )

    def _lock_url(self, task_id):
        return f"/api/v2/projects/{self.project_id}/tasks/actions/lock-for-mapping/{task_id}/"

    async def _enforce(self, value=True):
        await self._set_project(enforce_task_assignment=value)

    async def test_soft_mode_lets_anyone_lock(self, client: AsyncClient):
        await self._assign(client, {"taskIds": [2], "userId": OTHER_ID})
        resp = await client.post(self._lock_url(2), headers=_auth(MAPPER_ID))
        assert resp.status_code == 200

    async def test_enforced_mode_blocks_others(self, client: AsyncClient):
        await self._enforce()
        await self._assign(client, {"taskIds": [2], "userId": OTHER_ID})
        resp = await client.post(self._lock_url(2), headers=_auth(MAPPER_ID))
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "TaskAssignedToOther"

        resp = await client.post(self._lock_url(2), headers=_auth(OTHER_ID))
        assert resp.status_code == 200

    async def test_enforced_mode_allows_active_team_members(self, client: AsyncClient):
        await self._enforce()
        await add_user_to_team(
            self.team, self.mapper, TeamMemberFunctions.MEMBER.value, True, self.db
        )
        await add_user_to_team(
            self.team, self.other, TeamMemberFunctions.MEMBER.value, False, self.db
        )
        await self._assign(client, {"taskIds": [2], "teamId": self.team.id})

        resp = await client.post(self._lock_url(2), headers=_auth(OTHER_ID))
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "TaskAssignedToOther"

        resp = await client.post(self._lock_url(2), headers=_auth(MAPPER_ID))
        assert resp.status_code == 200

    async def test_project_managers_bypass_enforcement(self, client: AsyncClient):
        await self._enforce()
        await self._assign(client, {"taskIds": [2], "userId": OTHER_ID})
        resp = await client.post(self._lock_url(2), headers=_auth(self.author.id))
        assert resp.status_code == 200

    async def test_unassigned_tasks_stay_open(self, client: AsyncClient):
        await self._enforce()
        await self._assign(client, {"taskIds": [3], "userId": OTHER_ID})
        resp = await client.post(self._lock_url(2), headers=_auth(MAPPER_ID))
        assert resp.status_code == 200

    async def test_validation_assignment_does_not_block_mapping(
        self, client: AsyncClient
    ):
        await self._enforce()
        await self._assign(
            client, {"taskIds": [2], "userId": OTHER_ID, "stage": "VALIDATION"}
        )
        resp = await client.post(self._lock_url(2), headers=_auth(MAPPER_ID))
        assert resp.status_code == 200

    async def test_enforced_validation_lock(self, client: AsyncClient):
        await self._enforce()
        url = f"/api/v2/projects/{self.project_id}/tasks/actions/lock-for-validation/"
        # Tasks 1 and 3 are MAPPED/BADIMAGERY by the author; only task 1 is assigned.
        await self._assign(
            client, {"taskIds": [1], "userId": OTHER_ID, "stage": "VALIDATION"}
        )
        # A mapping assignment doesn't restrict validation.
        await self._assign(client, {"taskIds": [3], "userId": OTHER_ID})

        resp = await client.post(
            url, headers=_auth(MAPPER_ID), json={"taskIds": [3, 1]}
        )
        assert resp.status_code == 403
        assert resp.json()["SubCode"] == "TaskAssignedToOther"
        locked = await self.db.fetch_val(
            "SELECT COUNT(*) FROM tasks WHERE project_id = :p AND locked_by IS NOT NULL",
            {"p": int(self.project_id)},
        )
        assert locked == 0  # nothing locked when any task is refused

        resp = await client.post(url, headers=_auth(MAPPER_ID), json={"taskIds": [3]})
        assert resp.status_code == 200

    async def test_resuming_own_lock_is_unaffected(self, client: AsyncClient):
        await self._set_task(
            2, task_status=TaskStatus.LOCKED_FOR_MAPPING.value, locked_by=MAPPER_ID
        )
        await self._enforce()
        await self._assign(client, {"taskIds": [2], "userId": OTHER_ID})
        resp = await client.post(self._lock_url(2), headers=_auth(MAPPER_ID))
        assert resp.status_code == 200


@pytest.mark.anyio
class TestAssignmentLifecycle(AssignmentFixtures):
    async def test_split_children_inherit_assignments(self, client: AsyncClient):
        await self._assign(client, {"taskIds": [1], "userId": MAPPER_ID})
        await self._assign(
            client, {"taskIds": [1], "teamId": self.team.id, "stage": "VALIDATION"}
        )
        await self._set_task(
            1, task_status=TaskStatus.LOCKED_FOR_MAPPING.value, locked_by=self.author.id
        )
        resp = await client.post(
            f"/api/v2/projects/{self.project_id}/tasks/actions/split/1/",
            headers=_auth(self.author.id),
        )
        assert resp.status_code == 200
        child_ids = {task["taskId"] for task in resp.json()["tasks"]}

        assignments = await self._assignments(client)
        assert {a["taskId"] for a in assignments} == child_ids
        assert len(assignments) == 2 * len(child_ids)
        assert all(
            (a["stage"], a["userId"], a["teamId"])
            in {("MAPPING", MAPPER_ID, None), ("VALIDATION", None, self.team.id)}
            for a in assignments
        )

    async def test_deleting_team_removes_its_assignments(self, client: AsyncClient):
        await self._assign(client, {"taskIds": [2], "teamId": self.team.id})
        await self.db.execute("DELETE FROM teams WHERE id = :id", {"id": self.team.id})
        assert await self._assignments(client) == []

    async def test_deleting_project_removes_assignments(self, client: AsyncClient):
        from backend.models.postgis.project import Project

        await self._assign(client, {"taskIds": [2], "userId": MAPPER_ID})
        project = await Project.get(int(self.project_id), self.db)
        await project.delete(self.db)
        remaining = await self.db.fetch_val("SELECT COUNT(*) FROM task_assignments")
        assert remaining == 0

    async def test_deleting_user_removes_their_assignments(self, client: AsyncClient):
        from backend.services.users.user_service import UserService

        await self._assign(client, {"taskIds": [2], "userId": MAPPER_ID})
        await self._assign(client, {"taskIds": [3], "userId": OTHER_ID})
        await UserService.delete_user_by_id(MAPPER_ID, MAPPER_ID, self.db)
        assert [a["userId"] for a in await self._assignments(client)] == [OTHER_ID]

    async def test_project_flag_round_trips_through_api(self, client: AsyncClient):
        resp = await client.get(
            f"/api/v2/projects/{self.project_id}/queries/summary/",
            headers=_auth(self.author.id),
        )
        assert resp.status_code == 200
        assert resp.json()["enforceTaskAssignment"] is False

        await self._set_project(enforce_task_assignment=True)
        resp = await client.get(
            f"/api/v2/projects/{self.project_id}/queries/summary/",
            headers=_auth(self.author.id),
        )
        assert resp.json()["enforceTaskAssignment"] is True
        resp = await client.get(
            f"/api/v2/projects/{self.project_id}/", headers=_auth(self.author.id)
        )
        assert resp.json()["enforceTaskAssignment"] is True
