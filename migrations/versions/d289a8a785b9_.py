"""Supoprt for restricting project by level
Revision ID: d289a8a785b9
Revises: dd359611e2b3
Create Date: 2025-07-14 21:44

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "d289a8a785b9"
down_revision = "dd359611e2b3"
branch_labels = None
depends_on = None


def upgrade():
    # Default is beginner can map
    op.add_column("projects", sa.Column("mapping_permission_level_id", sa.Integer(), nullable=False, server_default="1"))
    # Default is any intermediate or above can map
    op.add_column("projects", sa.Column("validation_permission_level_id", sa.Integer(), nullable=False, server_default="2"))
    op.create_foreign_key(
        "fk_projects_mapping_permission_level", "projects", "mapping_levels", ["mapping_permission_level_id"], ["id"]
    )
    op.create_foreign_key(
        "fk_projects_validation_permission_level", "projects", "mapping_levels", ["validation_permission_level_id"], ["id"]
    )
    # Update data, VERY important to keep functionality with new permission
    # system
    op.execute("UPDATE projects SET mapping_permission = 0, mapping_permission_level_id = 1 WHERE mapping_permission = 0")
    op.execute("UPDATE projects SET mapping_permission = 0, mapping_permission_level_id = 2 WHERE mapping_permission = 1")
    op.execute("UPDATE projects SET mapping_permission = 2, mapping_permission_level_id = 1 WHERE mapping_permission = 2")
    op.execute("UPDATE projects SET mapping_permission = 2, mapping_permission_level_id = 2 WHERE mapping_permission = 3")

    op.execute("UPDATE projects SET validation_permission = 0, validation_permission_level_id = 1 WHERE validation_permission = 0")
    op.execute("UPDATE projects SET validation_permission = 0, validation_permission_level_id = 2 WHERE validation_permission = 1")
    op.execute("UPDATE projects SET validation_permission = 2, validation_permission_level_id = 1 WHERE validation_permission = 2")
    op.execute("UPDATE projects SET validation_permission = 2, validation_permission_level_id = 2 WHERE validation_permission = 3")


def downgrade():
    # Revert permissions
    op.execute("UPDATE projects SET mapping_permission = 0 WHERE mapping_permission = 0 AND mapping_permission_level_id = 1")
    op.execute("UPDATE projects SET mapping_permission = 1 WHERE mapping_permission = 0 AND mapping_permission_level_id = 2")
    op.execute("UPDATE projects SET mapping_permission = 2 WHERE mapping_permission = 2 AND mapping_permission_level_id = 1")
    op.execute("UPDATE projects SET mapping_permission = 3 WHERE mapping_permission = 2 AND mapping_permission_level_id = 2")

    op.execute("UPDATE projects SET validation_permission = 0 WHERE validation_permission = 0 AND validation_permission_level_id = 1")
    op.execute("UPDATE projects SET validation_permission = 1 WHERE validation_permission = 0 AND validation_permission_level_id = 2")
    op.execute("UPDATE projects SET validation_permission = 2 WHERE validation_permission = 2 AND validation_permission_level_id = 1")
    op.execute("UPDATE projects SET validation_permission = 3 WHERE validation_permission = 2 AND validation_permission_level_id = 2")

    # Rever columns
    op.drop_constraint("fk_projects_validation_permission_level", "projects", type_="foreignkey")
    op.drop_constraint("fk_projects_mapping_permission_level", "projects", type_="foreignkey")
    op.drop_column("projects", "validation_permission_level_id")
    op.drop_column("projects", "mapping_permission_level_id")
