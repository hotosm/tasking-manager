"""empty message

Revision ID: 6612e4d6524c
Revises: ee46f5e8723b
Create Date: 2019-08-19 21:40:06.669352

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "6612e4d6524c"
down_revision = "ee46f5e8723b"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("default_editor", sa.String(), server_default="ID", nullable=False),
    )
    op.add_column(
        "users",
        sa.Column(
            "mentions_notifications",
            sa.Boolean(),
            server_default=sa.true(),
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "comments_notifications",
            sa.Boolean(),
            server_default=sa.false(),
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "projects_notifications",
            sa.Boolean(),
            server_default=sa.true(),
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "expert_mode", sa.Boolean(), server_default=sa.false(), nullable=False
        ),
    )


def downgrade():
    op.drop_column("users", "default_editor")
    op.drop_column("users", "mentions_notifications")
    op.drop_column("users", "comments_notifications")
    op.drop_column("users", "projects_notifications")
    op.drop_column("users", "expert_mode")
