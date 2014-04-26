"""Adding author in comments table

Revision ID: 143b8daf25cc
Revises: 1805eda2bbfa
Create Date: 2014-04-24 10:43:52.010533

"""

# revision identifiers, used by Alembic.
revision = '143b8daf25cc'
down_revision = '1805eda2bbfa'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('tasks_comments', sa.Column('author_id', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('tasks_comments', 'author_id')
