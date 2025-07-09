"""Tables that support voting for users to have a level
Revision ID: dd359611e2b3
Revises: 909c5b13b1fc
Create Date: 2025-07-08 22:25

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "dd359611e2b3"
down_revision = "909c5b13b1fc"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_next_level",
        sa.Column("user_id", sa.BigInteger(), nullable=False, primary_key=True),
        sa.Column("level_id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column(
            "nomination_date",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("current_timestamp"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["level_id"], ["mapping_levels.id"]),
    )
    op.create_table(
        "user_level_vote",
        sa.Column("user_id", sa.BigInteger(), nullable=False, primary_key=True),
        sa.Column("level_id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("voter_id", sa.BigInteger(), nullable=False, primary_key=True),
        sa.Column(
            "vote_date",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("current_timestamp"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["level_id"], ["mapping_levels.id"]),
        sa.ForeignKeyConstraint(["voter_id"], ["users.id"]),
    )


def downgrade():
    op.drop_table("user_level_vote")
    op.drop_table("user_next_level")
