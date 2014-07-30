"""Added difficulty column to task table

Revision ID: 4f167529e567
Revises: 58cdd82df884
Create Date: 2014-07-25 11:21:10.717110

"""

# revision identifiers, used by Alembic.
revision = '4f167529e567'
down_revision = '58cdd82df884'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('task', sa.Column('difficulty', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('task', 'difficulty')
