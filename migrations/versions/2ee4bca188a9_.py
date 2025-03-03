"""Add subscription_tier field to Organisation model

Revision ID: 2ee4bca188a9
Revises: bfcf4182dcb5
Create Date: 2021-03-12 09:42:54.198713

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "2ee4bca188a9"
down_revision = "bfcf4182dcb5"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column("organisations", sa.Column("subscription_tier", sa.Integer(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("organisations", "subscription_tier")
    # ### end Alembic commands ###
