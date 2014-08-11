"""Added priority_area table

Revision ID: 1539fa17dd21
Revises: 4f167529e567
Create Date: 2014-07-28 10:06:29.347978

"""

# revision identifiers, used by Alembic.
revision = '1539fa17dd21'
down_revision = '4f167529e567'

from alembic import op
import sqlalchemy as sa
import geoalchemy2 as ga


def upgrade():
    op.create_table(
        'priority_area',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('geometry', ga.Geometry(geometry_type='POLYGON', srid=4326, management=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table(
        'project_priority_areas',
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('priority_area_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['priority_area_id'], ['priority_area.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], )
    )


def downgrade():
    op.drop_table('project_priority_areas')
    op.drop_table('priority_area')
