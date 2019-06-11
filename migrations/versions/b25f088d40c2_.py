"""empty message

Revision ID: b25f088d40c2
Revises: fcd9cebaa79c
Create Date: 2019-06-11 12:31:41.697842

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b25f088d40c2'
down_revision = 'fcd9cebaa79c'
branch_labels = None
depends_on = None


def upgrade():
    op.create_foreign_key('messages_tasks', 'messages', 'tasks', ['task_id', 'project_id'], ['id', 'project_id'])


def downgrade():
    op.drop_constraint('messages_tasks', 'messages', type_='foreignkey')
