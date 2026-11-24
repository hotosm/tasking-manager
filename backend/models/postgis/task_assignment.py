from typing import List, Optional

from databases import Database
from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    SmallInteger,
    UniqueConstraint,
    text,
)

from backend.db import Base
from backend.models.postgis.statuses import TaskAssignmentStage, TaskStatus
from backend.models.postgis.utils import timestamp

# Task statuses in which an assignment for each stage is still actionable by the assignee.
PENDING_STATUSES = {
    TaskAssignmentStage.MAPPING: [
        TaskStatus.READY.value,
        TaskStatus.INVALIDATED.value,
        TaskStatus.LOCKED_FOR_MAPPING.value,
    ],
    TaskAssignmentStage.VALIDATION: [
        TaskStatus.MAPPED.value,
        TaskStatus.BADIMAGERY.value,
        TaskStatus.LOCKED_FOR_VALIDATION.value,
    ],
}


class TaskAssignment(Base):
    """
    A project manager's standing instruction for who should map or validate a task.

    There is at most one assignment per task per stage. Whether an assignment is pending,
    in progress or done is derived from the task's status and is never stored here, so the
    task state machine (lock, unlock, undo, auto-unlock) never has to write to this table.
    """

    __tablename__ = "task_assignments"

    id = Column(Integer, primary_key=True)
    project_id = Column(
        Integer,
        ForeignKey("projects.id", name="fk_task_assignments_project"),
        nullable=False,
    )
    task_id = Column(Integer, nullable=False)
    stage = Column(SmallInteger, nullable=False)
    assignee_user_id = Column(
        BigInteger, ForeignKey("users.id", name="fk_task_assignments_assignee_user")
    )
    assignee_team_id = Column(
        Integer,
        ForeignKey(
            "teams.id", name="fk_task_assignments_assignee_team", ondelete="CASCADE"
        ),
    )
    assigned_by = Column(
        BigInteger,
        ForeignKey("users.id", name="fk_task_assignments_assigned_by"),
        nullable=False,
    )
    assigned_date = Column(
        DateTime, nullable=False, default=timestamp, server_default=text("now()")
    )

    __table_args__ = (
        ForeignKeyConstraint(
            [task_id, project_id],
            ["tasks.id", "tasks.project_id"],
            name="fk_task_assignments_task",
            ondelete="CASCADE",
        ),
        CheckConstraint(
            "(assignee_user_id IS NULL) <> (assignee_team_id IS NULL)",
            name="ck_task_assignments_one_assignee",
        ),
        UniqueConstraint(
            "project_id", "task_id", "stage", name="uq_task_assignments_task_stage"
        ),
        Index(
            "idx_task_assignments_assignee_user",
            "assignee_user_id",
            postgresql_where=text("assignee_user_id IS NOT NULL"),
        ),
        Index(
            "idx_task_assignments_assignee_team",
            "assignee_team_id",
            postgresql_where=text("assignee_team_id IS NOT NULL"),
        ),
        {},
    )

    @staticmethod
    async def upsert_many(
        project_id: int,
        task_ids: List[int],
        stage: TaskAssignmentStage,
        assignee_user_id: Optional[int],
        assignee_team_id: Optional[int],
        assigned_by: int,
        db: Database,
    ) -> int:
        """Assign (or reassign) the given tasks for one stage in a single statement."""
        query = """
            INSERT INTO task_assignments (
                project_id, task_id, stage, assignee_user_id, assignee_team_id,
                assigned_by, assigned_date
            )
            SELECT :project_id, t.task_id, :stage, :assignee_user_id, :assignee_team_id,
                   :assigned_by, :assigned_date
            FROM unnest(CAST(:task_ids AS integer[])) AS t(task_id)
            ON CONFLICT (project_id, task_id, stage) DO UPDATE SET
                assignee_user_id = EXCLUDED.assignee_user_id,
                assignee_team_id = EXCLUDED.assignee_team_id,
                assigned_by = EXCLUDED.assigned_by,
                assigned_date = EXCLUDED.assigned_date
        """
        await db.execute(
            query,
            values={
                "project_id": project_id,
                "task_ids": list(task_ids),
                "stage": stage.value,
                "assignee_user_id": assignee_user_id,
                "assignee_team_id": assignee_team_id,
                "assigned_by": assigned_by,
                "assigned_date": timestamp(),
            },
        )
        return len(task_ids)

    @staticmethod
    async def delete_many(
        project_id: int,
        task_ids: List[int],
        stage: Optional[TaskAssignmentStage],
        db: Database,
    ) -> int:
        """Remove assignments for the given tasks; all stages when stage is None."""
        query = """
            DELETE FROM task_assignments
            WHERE project_id = :project_id
            AND task_id = ANY(CAST(:task_ids AS integer[]))
        """
        values = {"project_id": project_id, "task_ids": list(task_ids)}
        if stage is not None:
            query += " AND stage = :stage"
            values["stage"] = stage.value
        query += " RETURNING id"
        rows = await db.fetch_all(query, values=values)
        return len(rows)

    @staticmethod
    async def get_for_project(project_id: int, db: Database) -> list:
        """All assignments on a project, with assignee and assigner names."""
        query = """
            SELECT
                ta.task_id,
                ta.stage,
                ta.assignee_user_id,
                au.username AS assignee_username,
                ta.assignee_team_id,
                tm.name AS assignee_team_name,
                ab.username AS assigned_by_username,
                ta.assigned_date
            FROM task_assignments ta
            LEFT JOIN users au ON au.id = ta.assignee_user_id
            LEFT JOIN teams tm ON tm.id = ta.assignee_team_id
            LEFT JOIN users ab ON ab.id = ta.assigned_by
            WHERE ta.project_id = :project_id
            ORDER BY ta.task_id, ta.stage
        """
        return await db.fetch_all(query, values={"project_id": project_id})

    @staticmethod
    async def get_for_task_stage(
        project_id: int, task_id: int, stage: TaskAssignmentStage, db: Database
    ):
        """The assignment for one task and stage, plus the project's enforcement flag."""
        query = """
            SELECT
                ta.assignee_user_id,
                ta.assignee_team_id,
                p.enforce_task_assignment
            FROM task_assignments ta
            JOIN projects p ON p.id = ta.project_id
            WHERE ta.project_id = :project_id
            AND ta.task_id = :task_id
            AND ta.stage = :stage
        """
        return await db.fetch_one(
            query,
            values={"project_id": project_id, "task_id": task_id, "stage": stage.value},
        )

    @staticmethod
    async def copy_to_tasks(
        project_id: int, source_task_id: int, target_task_ids: List[int], db: Database
    ):
        """Copy a task's assignments to other tasks, e.g. the children of a split task."""
        if not target_task_ids:
            return
        query = """
            INSERT INTO task_assignments (
                project_id, task_id, stage, assignee_user_id, assignee_team_id,
                assigned_by, assigned_date
            )
            SELECT ta.project_id, t.task_id, ta.stage, ta.assignee_user_id,
                   ta.assignee_team_id, ta.assigned_by, ta.assigned_date
            FROM task_assignments ta
            CROSS JOIN unnest(CAST(:target_task_ids AS integer[])) AS t(task_id)
            WHERE ta.project_id = :project_id AND ta.task_id = :source_task_id
            ON CONFLICT (project_id, task_id, stage) DO NOTHING
        """
        await db.execute(
            query,
            values={
                "project_id": project_id,
                "source_task_id": source_task_id,
                "target_task_ids": list(target_task_ids),
            },
        )

    @staticmethod
    async def delete_for_user(user_id: int, db: Database):
        """Remove every assignment made directly to a user (e.g. on account deletion)."""
        await db.execute(
            "DELETE FROM task_assignments WHERE assignee_user_id = :user_id",
            values={"user_id": user_id},
        )

    @staticmethod
    async def get_assigned_to_user(
        user_id: int,
        db: Database,
        project_id: Optional[int] = None,
        stage: Optional[TaskAssignmentStage] = None,
        pending_only: bool = True,
        page: int = 1,
        per_page: int = 20,
        preferred_locale: str = "en",
    ):
        """
        Tasks assigned to a user directly or through a team they are an active member of.
        Returns (rows, total).
        """
        filters = [
            """(
                ta.assignee_user_id = :user_id
                OR ta.assignee_team_id IN (
                    SELECT team_id FROM team_members
                    WHERE user_id = :user_id AND active = TRUE
                )
            )"""
        ]
        values = {"user_id": user_id}
        if project_id is not None:
            filters.append("ta.project_id = :project_id")
            values["project_id"] = project_id
        if stage is not None:
            filters.append("ta.stage = :stage")
            values["stage"] = stage.value
        if pending_only:
            filters.append(
                """(
                    (ta.stage = :mapping_stage
                        AND t.task_status = ANY(CAST(:mapping_pending AS integer[])))
                    OR (ta.stage = :validation_stage
                        AND t.task_status = ANY(CAST(:validation_pending AS integer[])))
                )"""
            )
            values.update(
                {
                    "mapping_stage": TaskAssignmentStage.MAPPING.value,
                    "validation_stage": TaskAssignmentStage.VALIDATION.value,
                    "mapping_pending": PENDING_STATUSES[TaskAssignmentStage.MAPPING],
                    "validation_pending": PENDING_STATUSES[
                        TaskAssignmentStage.VALIDATION
                    ],
                }
            )
        # Only fixed SQL fragments are joined here; every user value is a bind parameter.
        where = " AND ".join(filters)

        count_query = f"""
            SELECT COUNT(*)
            FROM task_assignments ta
            JOIN tasks t ON t.id = ta.task_id AND t.project_id = ta.project_id
            WHERE {where}
        """
        total = await db.fetch_val(count_query, values=values)

        list_query = f"""
            SELECT
                ta.project_id,
                COALESCE(pi_user.name, pi_default.name) AS project_name,
                ta.task_id,
                t.task_status,
                ta.stage,
                ta.assignee_user_id,
                ta.assignee_team_id,
                tm.name AS assignee_team_name,
                ab.username AS assigned_by_username,
                ta.assigned_date
            FROM task_assignments ta
            JOIN tasks t ON t.id = ta.task_id AND t.project_id = ta.project_id
            JOIN projects p ON p.id = ta.project_id
            LEFT JOIN project_info pi_default
                ON pi_default.project_id = p.id AND pi_default.locale = p.default_locale
            LEFT JOIN project_info pi_user
                ON pi_user.project_id = p.id AND pi_user.locale = :locale
            LEFT JOIN teams tm ON tm.id = ta.assignee_team_id
            LEFT JOIN users ab ON ab.id = ta.assigned_by
            WHERE {where}
            ORDER BY ta.assigned_date DESC, ta.project_id, ta.task_id, ta.stage
            LIMIT :limit OFFSET :offset
        """
        rows = await db.fetch_all(
            list_query,
            values={
                **values,
                "locale": preferred_locale or "en",
                "limit": per_page,
                "offset": (page - 1) * per_page,
            },
        )
        return rows, total
