"""Add user stats table
Revision ID: 9fc540fc84f8
Revises: 8e5144b55919
Create Date: 2025-04-08 06:21:03.293847

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "9fc540fc84f8"
down_revision = "8e5144b55919"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_stats",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("stats", sa.JSON(), nullable=False),
        sa.Column("date_obtained", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )


def downgrade():
    op.drop_table("user_stats")
