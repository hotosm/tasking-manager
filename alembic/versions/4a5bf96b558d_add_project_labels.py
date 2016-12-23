"""Add project labels

Revision ID: 4a5bf96b558d
Revises: 5581aa8a3cd
Create Date: 2016-06-02 23:42:17.332659

"""

# revision identifiers, used by Alembic.
revision = '4a5bf96b558d'
down_revision = '5581aa8a3cd'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table(
        'label',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.Unicode),
        sa.Column('color', sa.Unicode),
    )


    project_labels_table = op.create_table(
        'project_labels',
        sa.Column('project', sa.Integer),
        sa.Column('label', sa.Integer),
        sa.ForeignKeyConstraint(['project'], ['project.id']),
        sa.ForeignKeyConstraint(['label'], ['label.id'])
    )

    label_translation_table = op.create_table(
        'label_translation',
        sa.Column('id', sa.Integer, nullable=False),
        sa.Column('locale', sa.String(10), nullable=False),
        sa.Column('description', sa.String),
        sa.UniqueConstraint('id', 'locale'),
        sa.ForeignKeyConstraint(['id'], ['label.id'], ondelete="CASCADE")
    )


def downgrade():
    op.drop_table('project_labels')
    op.drop_table('label_translation')
    op.drop_table('label')
