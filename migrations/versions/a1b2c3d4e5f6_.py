"""Split tasks_notifications into task_validation_notification and task_invalidation_notification

Revision ID: a1b2c3d4e5f6
Revises: b720f42ce3e8
Create Date: 2026-03-17 10:25:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "b720f42ce3e8"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "task_validation_notification",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "task_invalidation_notification",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )


def downgrade():
    op.drop_column("users", "task_validation_notification")
    op.drop_column("users", "task_invalidation_notification")
