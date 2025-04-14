"""empty message

Revision ID: d77ee40254f1
Revises: 0a6b82b55983
Create Date: 2019-04-25 13:36:02.793208

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "d77ee40254f1"
down_revision = "0a6b82b55983"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "projects",
        sa.Column(
            "mapping_editors",
            postgresql.ARRAY(sa.Integer()),
            nullable=False,
            server_default="{0,1,2,3}",
        ),
    )
    op.add_column(
        "projects",
        sa.Column(
            "validation_editors",
            postgresql.ARRAY(sa.Integer()),
            nullable=False,
            server_default="{0,1,2,3}",
        ),
    )
    op.alter_column(
        "projects", "task_creation_mode", existing_type=sa.INTEGER(), nullable=False
    )
    op.create_index(
        op.f("ix_projects_mapping_editors"),
        "projects",
        ["mapping_editors"],
        unique=False,
    )
    op.create_index(
        op.f("ix_projects_validation_editors"),
        "projects",
        ["validation_editors"],
        unique=False,
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f("ix_projects_validation_editors"), table_name="projects")
    op.drop_index(op.f("ix_projects_mapping_editors"), table_name="projects")
    op.alter_column(
        "projects", "task_creation_mode", existing_type=sa.INTEGER(), nullable=True
    )
    op.drop_column("projects", "validation_editors")
    op.drop_column("projects", "mapping_editors")
    # ### end Alembic commands ###
