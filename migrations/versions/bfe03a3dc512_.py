"""empty message

Revision ID: bfe03a3dc512
Revises: 30b091260689
Create Date: 2018-12-03 12:50:43.957985

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bfe03a3dc512'
down_revision = '30b091260689'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('task_annotations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=True),
    sa.Column('task_id', sa.Integer(), nullable=False),
    sa.Column('annotation_type', sa.Integer(), nullable=False),
    sa.Column('annotation_source', sa.String(), nullable=True),
    sa.Column('updated_timestamp', sa.DateTime(), nullable=False),
    sa.Column('properties', sa.JSON(), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
    sa.ForeignKeyConstraint(['task_id', 'project_id'], ['tasks.id', 'tasks.project_id'], name='fk_task_annotations'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_task_annotations_composite', 'task_annotations', ['task_id', 'project_id'], unique=False)
    op.create_index(op.f('ix_task_annotations_project_id'), 'task_annotations', ['project_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_task_annotations_project_id'), table_name='task_annotations')
    op.drop_index('idx_task_annotations_composite', table_name='task_annotations')
    op.drop_table('task_annotations')
