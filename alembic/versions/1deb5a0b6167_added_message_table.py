"""Added message table

Revision ID: 1deb5a0b6167
Revises: 58cdd82df884
Create Date: 2014-07-29 11:24:31.461531

"""

# revision identifiers, used by Alembic.
revision = '1deb5a0b6167'
down_revision = '58cdd82df884'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table(
        'message',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('message', sa.Unicode(), nullable=True),
        sa.Column('from_user_id', sa.BigInteger(), nullable=True),
        sa.Column('to_user_id', sa.BigInteger(), nullable=True),
        sa.Column('date', sa.DateTime(), nullable=True),
        sa.Column('read', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['from_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['to_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('message')
