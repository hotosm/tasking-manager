"""empty message

Revision ID: a8a7537985c0
Revises: d77ee40254f1
Create Date: 2019-05-09 15:45:43.492558

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a8a7537985c0"
down_revision = "d77ee40254f1"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "projects",
        sa.Column(
            "allow_non_beginners",
            sa.Boolean(),
            nullable=True,
            server_default=sa.false(),
        ),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("projects", "allow_non_beginners")
    # ### end Alembic commands ###
