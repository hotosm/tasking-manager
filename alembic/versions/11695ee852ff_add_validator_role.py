"""Add validator role

Revision ID: 11695ee852ff
Revises: 4fe2d91d0354
Create Date: 2017-01-03 16:23:51.667472

"""

# revision identifiers, used by Alembic.
revision = '11695ee852ff'
down_revision = '4fe2d91d0354'

from alembic import op
import sqlalchemy as sa


def upgrade():
    users = sa.sql.table('users', sa.sql.column('role'))
    ''' Project managers are validators by default '''
    op.execute(users.update().values(role=users.c.role.op('#')(4))
        .where(users.c.role.op('&')(2)!=0))
    pass


def downgrade():
    users = sa.sql.table('users', sa.sql.column('role'))
    op.execute(users.update().values(role=users.c.role.op('#')(4)))
    pass
