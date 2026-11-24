"""Add task assignments

Adds the task_assignments table (who a project manager wants to map or validate each
task), projects.enforce_task_assignment and users.task_assignment_notification.

Locking: creating the foreign keys briefly takes SHARE ROW EXCLUSIVE locks on tasks,
projects, users and teams, and adding the columns briefly takes ACCESS EXCLUSIVE locks
on projects and users. Nothing is rewritten: the new table is empty and the new columns
have constant defaults (metadata-only on PostgreSQL 11+). lock_timeout makes the
migration fail fast rather than queue behind a long transaction and block task locking
while it waits; if it times out, rerun it at a quieter time.

Revision ID: 0d32fcb01b19
Revises: c3f8a1b2e9d4
Create Date: 2026-11-23 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0d32fcb01b19"
down_revision = "c3f8a1b2e9d4"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("SET LOCAL lock_timeout = '5s'")

    op.create_table(
        "task_assignments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("stage", sa.SmallInteger(), nullable=False),
        sa.Column("assignee_user_id", sa.BigInteger(), nullable=True),
        sa.Column("assignee_team_id", sa.Integer(), nullable=True),
        sa.Column("assigned_by", sa.BigInteger(), nullable=False),
        sa.Column(
            "assigned_date",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["project_id"], ["projects.id"], name="fk_task_assignments_project"
        ),
        sa.ForeignKeyConstraint(
            ["task_id", "project_id"],
            ["tasks.id", "tasks.project_id"],
            name="fk_task_assignments_task",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["assignee_user_id"],
            ["users.id"],
            name="fk_task_assignments_assignee_user",
        ),
        sa.ForeignKeyConstraint(
            ["assignee_team_id"],
            ["teams.id"],
            name="fk_task_assignments_assignee_team",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["assigned_by"], ["users.id"], name="fk_task_assignments_assigned_by"
        ),
        sa.CheckConstraint(
            "(assignee_user_id IS NULL) <> (assignee_team_id IS NULL)",
            name="ck_task_assignments_one_assignee",
        ),
        sa.UniqueConstraint(
            "project_id", "task_id", "stage", name="uq_task_assignments_task_stage"
        ),
    )
    op.create_index(
        "idx_task_assignments_assignee_user",
        "task_assignments",
        ["assignee_user_id"],
        postgresql_where=sa.text("assignee_user_id IS NOT NULL"),
    )
    op.create_index(
        "idx_task_assignments_assignee_team",
        "task_assignments",
        ["assignee_team_id"],
        postgresql_where=sa.text("assignee_team_id IS NOT NULL"),
    )

    op.add_column(
        "projects",
        sa.Column(
            "enforce_task_assignment",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "task_assignment_notification",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )


def downgrade():
    op.execute("SET LOCAL lock_timeout = '5s'")
    op.drop_column("users", "task_assignment_notification")
    op.drop_column("projects", "enforce_task_assignment")
    op.drop_index("idx_task_assignments_assignee_team", table_name="task_assignments")
    op.drop_index("idx_task_assignments_assignee_user", table_name="task_assignments")
    op.drop_table("task_assignments")
