"""Create unique index ix_user_stats_user_id
Revision ID: a064ff85cff6
Revises: c9838b10b5ed
Create Date: 2025-06-02 20:17

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a064ff85cff6"
down_revision = "c9838b10b5ed"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        op.f("ix_user_stats_user_id"), "user_stats", ["user_id"], unique=True,
    )


def downgrade():
    op.drop_index("ix_user_stats_user_id", "user_stats")
