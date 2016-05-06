"""add extra_properties column to Task

Revision ID: 33e34b3beaa3
Revises: 4290a873fda7
Create Date: 2016-03-31 12:08:39.551088

"""

# revision identifiers, used by Alembic.
revision = '33e34b3beaa3'
down_revision = '4290a873fda7'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('task', sa.Column('extra_properties', sa.Unicode(), nullable=True))


def downgrade():
    op.drop_column('task', 'extra_properties')
