"""Added assign columns

Revision ID: 58cdd82df884
Revises: 33a5ec066e1d
Create Date: 2014-06-19 16:12:49.986840

"""

# revision identifiers, used by Alembic.
revision = '58cdd82df884'
down_revision = '33a5ec066e1d'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('task', sa.Column('assigned_date', sa.DateTime(), nullable=True))
    op.add_column(
        'task',
        sa.Column('assigned_to_id', sa.Integer(), sa.ForeignKey('users.id'),
                  nullable=True)
    )


def downgrade():
    op.drop_column('task', 'assigned_to_id')
    op.drop_column('task', 'assigned_date')
