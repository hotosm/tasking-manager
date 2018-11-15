"""empty message

Revision ID: 3ee58dee57c9
Revises: 30b091260689
Create Date: 2018-08-24 13:55:32.308278

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3ee58dee57c9'
down_revision = '30b091260689'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('task_invalidation_history',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('task_id', sa.Integer(), nullable=False),
    sa.Column('is_closed', sa.Boolean(), nullable=True),
    sa.Column('mapper_id', sa.BigInteger(), nullable=True),
    sa.Column('mapped_date', sa.DateTime(), nullable=True),
    sa.Column('invalidator_id', sa.BigInteger(), nullable=True),
    sa.Column('invalidated_date', sa.DateTime(), nullable=True),
    sa.Column('invalidation_history_id', sa.Integer(), nullable=True),
    sa.Column('validator_id', sa.BigInteger(), nullable=True),
    sa.Column('validated_date', sa.DateTime(), nullable=True),
    sa.Column('updated_date', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['invalidation_history_id'], ['task_history.id'], name='fk_invalidation_history'),
    sa.ForeignKeyConstraint(['invalidator_id'], ['users.id'], name='fk_invalidators'),
    sa.ForeignKeyConstraint(['mapper_id'], ['users.id'], name='fk_mappers'),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
    sa.ForeignKeyConstraint(['task_id', 'project_id'], ['tasks.id', 'tasks.project_id'], name='fk_tasks'),
    sa.ForeignKeyConstraint(['validator_id'], ['users.id'], name='fk_validators'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_task_validation_history_composite', 'task_invalidation_history', ['task_id', 'project_id'], unique=False)
    op.create_index('idx_task_validation_mapper_status_composite', 'task_invalidation_history', ['invalidator_id', 'is_closed'], unique=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index('idx_task_validation_mapper_status_composite', table_name='task_invalidation_history')
    op.drop_index('idx_task_validation_history_composite', table_name='task_invalidation_history')
    op.drop_table('task_invalidation_history')
    # ### end Alembic commands ###
