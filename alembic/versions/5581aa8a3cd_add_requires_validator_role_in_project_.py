"""Add requires_validator_role in project table

Revision ID: 5581aa8a3cd
Revises: 11695ee852ff
Create Date: 2017-01-10 11:18:46.081801

"""

# revision identifiers, used by Alembic.
revision = '5581aa8a3cd'
down_revision = '11695ee852ff'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('project', sa.Column('requires_validator_role', sa.Boolean(), nullable=True))


def downgrade():
    op.drop_column('project', 'requires_validator_role')
