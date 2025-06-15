"""Delete column image_path for mapping_levels
Revision ID: 3542b88254c0
Revises: a064ff85cff6
Create Date: 2025-06-02 20:17

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "3542b88254c0"
down_revision = "a064ff85cff6"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column("mapping_levels", "image_path")


def downgrade():
    op.add_column("mapping_levels", sa.Column("image_path", sa.String(), nullable=True))
