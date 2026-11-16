"""Add custom_mapping_types to projects for custom data exports

Revision ID: cf06865f81c5
Revises: c3f8a1b2e9d4
Create Date: 2026-11-04 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "cf06865f81c5"
down_revision = "c3f8a1b2e9d4"
branch_labels = None
depends_on = None


def upgrade():
    # Nullable with no default, so Postgres only updates the catalog and
    # does not rewrite the projects table.
    op.add_column(
        "projects",
        sa.Column("custom_mapping_types", postgresql.JSONB(), nullable=True),
    )


def downgrade():
    op.drop_column("projects", "custom_mapping_types")
