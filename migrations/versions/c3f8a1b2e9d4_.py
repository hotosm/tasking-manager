"""Add composite index on projects(status, private) and index on projects(priority)

Revision ID: c3f8a1b2e9d4
Revises: 4ee8b1efdebd
Create Date: 2026-06-26 00:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "c3f8a1b2e9d4"
down_revision = "4ee8b1efdebd"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        "idx_projects_status_private",
        "projects",
        ["status", "private"],
        unique=False,
    )
    op.create_index(
        "idx_projects_priority",
        "projects",
        ["priority"],
        unique=False,
    )


def downgrade():
    op.drop_index("idx_projects_priority", table_name="projects")
    op.drop_index("idx_projects_status_private", table_name="projects")
