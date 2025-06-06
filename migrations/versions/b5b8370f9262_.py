"""empty message

Revision ID: b5b8370f9262
Revises: c4670f3bb828
Create Date: 2017-05-04 12:08:56.957349

"""

import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "b5b8370f9262"
down_revision = "c4670f3bb828"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "priority_areas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "geometry",
            geoalchemy2.types.Geometry(geometry_type="POLYGON", srid=4326),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "project_priority_areas",
        sa.Column("project_id", sa.Integer(), nullable=True),
        sa.Column("priority_area_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["priority_area_id"], ["priority_areas.id"]),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("project_priority_areas")
    op.drop_table("priority_areas")
    # ### end Alembic commands ###
