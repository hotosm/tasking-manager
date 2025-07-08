"""Add badges that support previous level functionality
Revision ID: 909c5b13b1fc
Revises: aa50f576b3b0
Create Date: 2025-07-07 17:51

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "909c5b13b1fc"
down_revision = "aa50f576b3b0"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    cur = conn.execute(sa.text("""
        INSERT INTO mapping_badges (name, description, requirements, is_enabled, is_internal)
        VALUES
            ('INTERMEDIATE_internal', '', '{\"changeset\": 250}', true, true),
            ('ADVANCED_internal', '', '{\"changeset\": 500}', true, true)
        RETURNING id
    """))
    ids = [r[0] for r in cur.fetchall()]

    conn.execute(sa.text("""
        INSERT INTO mapping_level_badges (level_id, badge_id)
        VALUES (:level_id, :badge_id)
    """), {"level_id": 2, "badge_id": ids[0]})

    conn.execute(sa.text("""
        INSERT INTO mapping_level_badges (level_id, badge_id)
        VALUES (:level_id, :badge_id)
    """), {"level_id": 3, "badge_id": ids[1]})


def downgrade():
    conn = op.get_bind()

    conn.execute(sa.text("DELETE FROM mapping_level_badges WHERE level_id in (2, 3)"))

    conn.execute(sa.text("DELETE FROM mapping_badges WHERE name = 'INTERMEDIATE_internal'"))
    conn.execute(sa.text("DELETE FROM mapping_badges WHERE name = 'ADVANCED_internal'"))
