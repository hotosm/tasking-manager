"""empty message

Revision ID: 0d47c10c8a66
Revises: 05e1ecf9953a
Create Date: 2019-01-13 20:51:12.809062

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0d47c10c8a66"
down_revision = "05e1ecf9953a"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "application_keys",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("user", sa.BigInteger(), nullable=False),
        sa.Column("app_key", sa.String(), nullable=False),
        sa.Column("created", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user"], ["users.id"]),
    )


def downgrade():
    op.drop_table("application_keys")
