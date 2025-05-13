"""empty message

Revision ID: 05e1ecf9953a
Revises: 22e7d7e0fa02
Create Date: 2018-12-04 19:53:41.477085

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "05e1ecf9953a"
down_revision = "22e7d7e0fa02"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "task_annotations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=True),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("annotation_type", sa.String(), nullable=False),
        sa.Column("annotation_source", sa.String(), nullable=True),
        sa.Column("updated_timestamp", sa.DateTime(), nullable=False),
        sa.Column("properties", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.ForeignKeyConstraint(
            ["task_id", "project_id"],
            ["tasks.id", "tasks.project_id"],
            name="fk_task_annotations",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_task_annotations_composite",
        "task_annotations",
        ["task_id", "project_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_task_annotations_project_id"),
        "task_annotations",
        ["project_id"],
        unique=False,
    )


def downgrade():
    op.drop_index(op.f("ix_task_annotations_project_id"), table_name="task_annotations")
    op.drop_index("idx_task_annotations_composite", table_name="task_annotations")
    op.drop_table("task_annotations")
