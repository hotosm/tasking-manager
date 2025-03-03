"""Add date joined in teams table
Revision ID: 8e5144b55919
Revises: ecb6985693c0_
Create Date: 2024-11-22 10:25:38.551015

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "8e5144b55919"
down_revision = "ecb6985693c0_"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("team_members", sa.Column("joined_date", sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column("team_members", "joined_date")
