"""empty message

Revision ID: f26a7c36eb65
Revises: 22e9a0e9b254
Create Date: 2019-11-28 04:44:32.764819

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "f26a7c36eb65"
down_revision = "22e9a0e9b254"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column("team_members", sa.Column("active", sa.Boolean(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("team_members", "active")
    # ### end Alembic commands ###
