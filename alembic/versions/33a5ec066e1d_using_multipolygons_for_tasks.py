"""Using multipolygons for tasks

Revision ID: 33a5ec066e1d
Revises: 143b8daf25cc
Create Date: 2014-04-30 17:52:54.455525

"""

# revision identifiers, used by Alembic.
revision = '33a5ec066e1d'
down_revision = '143b8daf25cc'

from alembic import op


def upgrade():
    op.execute("ALTER TABLE tasks ALTER COLUMN geometry SET DATA TYPE geometry(MultiPolygon, 4326) USING ST_Multi(geometry);")


def downgrade():
    print "Downgrade not supported"
