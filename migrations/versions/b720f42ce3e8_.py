"""

Revision ID: b720f42ce3e8
Revises: 763165f937cf
Create Date: 2025-12-16 09:05:37.937878

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b720f42ce3e8"
down_revision = "763165f937cf"
branch_labels = None
depends_on = None


def upgrade():
    # Add `database` column (string) with server default 'OSM' and NOT NULL
    op.add_column(
        "projects",
        sa.Column(
            "database",
            sa.String(),
            nullable=False,
            server_default=sa.text("'OSM'"),
        ),
    )

    # Add `sandbox` column (boolean) with server default false and NOT NULL
    op.add_column(
        "projects",
        sa.Column(
            "sandbox",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    # Extra safety: ensure any existing NULL/empty values are set correctly.
    # If the DB honored server_default on add this is a no-op, but it's safe to keep.
    op.execute(
        'UPDATE public.projects SET "database" = \'OSM\' WHERE "database" IS NULL OR "database" = \'\''
    )
    op.execute("UPDATE public.projects SET sandbox = false WHERE sandbox IS NULL")


def downgrade():
    # Remove the columns (revert)
    op.drop_column("projects", "sandbox")
    op.drop_column("projects", "database")
