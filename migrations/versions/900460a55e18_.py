"""Add column is_internal for badges
Revision ID: 900460a55e18
Revises: 3542b88254c0
Create Date: 2025-06-02 20:17

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "900460a55e18"
down_revision = "3542b88254c0"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "mapping_badges",
        sa.Column("is_internal", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade():
    op.drop_column("mapping_badges", "is_internal")
