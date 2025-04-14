"""empty message

Revision ID: 51ccc46f1b8a
Revises: 4b9fb4d3f349
Create Date: 2019-10-16 19:30:51.064696

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "51ccc46f1b8a"
down_revision = "4b9fb4d3f349"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "project_custom_editors",
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.PrimaryKeyConstraint("project_id"),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("project_custom_editors")
    # ### end Alembic commands ###
