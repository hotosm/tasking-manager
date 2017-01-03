"""Update user roles

Revision ID: 4fe2d91d0354
Revises: 5002e75c0604
Create Date: 2017-01-03 15:24:32.395665

"""

# revision identifiers, used by Alembic.
revision = '4fe2d91d0354'
down_revision = '5002e75c0604'

from alembic import op
import sqlalchemy as sa


def upgrade():
    users = sa.sql.table('users', sa.sql.column('role'))
    ''' No null values for role '''
    op.execute(users.update().values(role=0).where(users.c.role==None))
    ''' Admins are also project managers '''
    op.execute(users.update().values(role=3).where(users.c.role==1))
    pass


def downgrade():
    users = sa.sql.table('users', sa.sql.column('role'))
    op.execute(users.update().values(role=None).where(users.c.role==0))
    op.execute(users.update().values(role=1).where(users.c.role==3))
    pass
