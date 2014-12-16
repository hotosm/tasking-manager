"""Change integer to float for done/validated

Revision ID: 336f4518e8e6
Revises: 3f282468e66e
Create Date: 2014-12-12 22:14:06.904066

"""

# revision identifiers, used by Alembic.
revision = '336f4518e8e6'
down_revision = '3f282468e66e'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.alter_column('project', 'done',
                    existing_type=sa.INTEGER(),
                    type_=sa.Float(),
                    existing_nullable=True)
    op.alter_column('project', 'validated',
                    existing_type=sa.INTEGER(),
                    type_=sa.Float(),
                    existing_nullable=True)


def downgrade():
    op.alter_column('project', 'validated',
                    existing_type=sa.Float(),
                    type_=sa.INTEGER(),
                    existing_nullable=True)
    op.alter_column('project', 'done',
                    existing_type=sa.Float(),
                    type_=sa.INTEGER(),
                    existing_nullable=True)
