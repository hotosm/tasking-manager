"""Add mapping_badges table
Revision ID: c9838b10b5ed
Revises: e723689de0f4
Create Date: 2025-05-12 20:37

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "c9838b10b5ed"
down_revision = "e723689de0f4"
branch_labels = None
depends_on = None


def upgrade():
    # Create mapping_badges table
    op.create_table(
        "mapping_badges",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("image_path", sa.String(), nullable=True),
        sa.Column("requirements", sa.JSON(), nullable=True),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default="true"),
    )

    # Create crossing table with users
    op.create_table(
        "user_mapping_badge",
        sa.Column("user_id", sa.BigInteger(), nullable=False, primary_key=True),
        sa.Column("badge_id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column(
            "date_assigned",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("current_timestamp"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["badge_id"], ["mapping_badges.id"]),
    )


def downgrade():
    op.drop_table("user_mapping_badge")
    op.drop_table("mapping_badges")
