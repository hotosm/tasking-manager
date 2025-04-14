"""empty message

Revision ID: 5952780a577e
Revises: 1579d24928e7
Create Date: 2020-06-11 16:58:45.700192

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "5952780a577e"
down_revision = "1579d24928e7"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column("organisations", sa.Column("description", sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("organisations", "description")
    # ### end Alembic commands ###
