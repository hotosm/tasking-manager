"""Create done and validated columns

Revision ID: 1a29f9f5c21c
Revises: None
Create Date: 2014-04-18 17:30:32.450777

"""

# revision identifiers, used by Alembic.
revision = '1a29f9f5c21c'
down_revision = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('project', sa.Column('done', sa.Integer(), nullable=True))
    op.add_column('project', sa.Column('validated', sa.Integer(), nullable=True))

    project = sa.sql.table('project', sa.sql.column('done'),
                           sa.sql.column('validated'))
    op.execute(project.update().values(done=0))
    op.execute(project.update().values(validated=0))

    op.alter_column('project', 'done', nullable=False)
    op.alter_column('project', 'validated', nullable=False)


def downgrade():
    op.drop_column('project', 'validated')
    op.drop_column('project', 'done')
