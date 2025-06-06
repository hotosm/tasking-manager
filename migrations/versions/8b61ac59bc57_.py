"""Add extra_id_params to Project's table

Revision ID: 8b61ac59bc57
Revises: 924a63857df4
Create Date: 2022-06-27 09:00:04.602260

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "8b61ac59bc57"
down_revision = "924a63857df4"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column("projects", sa.Column("extra_id_params", sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("projects", "extra_id_params")
    # ### end Alembic commands ###
