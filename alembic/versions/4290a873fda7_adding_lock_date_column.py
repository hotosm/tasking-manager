"""Adding lock_date column

Revision ID: 4290a873fda7
Revises: 336f4518e8e6
Create Date: 2015-05-22 17:59:22.408071

"""

# revision identifiers, used by Alembic.
revision = '4290a873fda7'
down_revision = '336f4518e8e6'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('task', sa.Column('lock_date', sa.DateTime(), nullable=True))
    op.create_index('task_lock_date_', 'task', ['lock_date'])


def downgrade():
    op.drop_column('task', 'lock_date')
