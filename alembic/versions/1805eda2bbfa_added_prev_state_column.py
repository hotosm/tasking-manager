"""Added prev_state column

Revision ID: 1805eda2bbfa
Revises: 1a29f9f5c21c
Create Date: 2014-04-24 09:19:56.308929

"""

# revision identifiers, used by Alembic.
revision = '1805eda2bbfa'
down_revision = '1a29f9f5c21c'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('tasks_history', sa.Column('prev_state', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('tasks_history', 'prev_state')
