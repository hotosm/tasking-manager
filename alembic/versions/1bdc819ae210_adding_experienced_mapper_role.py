"""Adding experienced mapper role

Revision ID: 1bdc819ae210
Revises: 4a5bf96b558d
Create Date: 2017-01-19 14:10:58.578127

"""

# revision identifiers, used by Alembic.
revision = '1bdc819ae210'
down_revision = '4a5bf96b558d'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('project', sa.Column('requires_experienced_mapper_role', sa.Boolean(), nullable=True))


def downgrade():
    op.drop_column('project', 'requires_experienced_mapper_role')
