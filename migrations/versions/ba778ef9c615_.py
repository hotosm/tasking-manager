"""empty message

Revision ID: ba778ef9c615
Revises: 9712d29e24c8
Create Date: 2020-08-25 09:11:37.897176

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "ba778ef9c615"
down_revision = "9712d29e24c8"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "teams_notifications",
            sa.Boolean(),
            server_default=sa.true(),
            nullable=False,
        ),
    )


def downgrade():
    op.drop_column("users", "teams_notifications")
