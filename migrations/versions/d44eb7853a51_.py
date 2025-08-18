"""

Revision ID: d44eb7853a51
Revises: d289a8a785b9
Create Date: 2025-08-18 07:13:14.312440

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d44eb7853a51"
down_revision = "d289a8a785b9"
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
