"""Added due_state column to project table

Revision ID: b54ce37bde0
Revises: 33a5ec066e1d
Create Date: 2014-07-17 16:52:59.898360

"""

# revision identifiers, used by Alembic.
revision = 'b54ce37bde0'
down_revision = '33a5ec066e1d'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('project', sa.Column('due_date', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('project', 'due_date')
