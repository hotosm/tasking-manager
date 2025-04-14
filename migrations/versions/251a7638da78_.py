"""empty message

Revision ID: 251a7638da78
Revises: deec8123583d
Create Date: 2018-08-30 07:46:49.074078

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "251a7638da78"
down_revision = "deec8123583d"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "project_chat",
        "message",
        existing_type=sa.String(length=250),
        type_=sa.String(),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "project_chat",
        "message",
        existing_type=sa.String(),
        type_=sa.String(length=250),
    )
    # ### end Alembic commands ###
