"""Add table mapping_level_badges
Revision ID: aa50f576b3b0
Revises: 900460a55e18
Create Date: 2025-06-02 20:17

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "aa50f576b3b0"
down_revision = "900460a55e18"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "mapping_level_badges",
        sa.Column("level_id", sa.Integer(), nullable=False),
        sa.Column("badge_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["level_id"], ["mapping_levels.id"]),
        sa.ForeignKeyConstraint(["badge_id"], ["mapping_badges.id"]),
        sa.UniqueConstraint("level_id", "badge_id"),
        sa.PrimaryKeyConstraint("level_id", "badge_id"),
    )


def downgrade():
    op.drop_table("mapping_level_badges")
