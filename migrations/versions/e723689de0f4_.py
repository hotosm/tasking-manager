"""Add mapping_levels table and foreign key
Revision ID: e723689de0f4_
Revises: 9fc540fc84f8
Create Date: 2025-04-14 20:28:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e723689de0f4_"
down_revision = "9fc540fc84f8"
branch_labels = None
depends_on = None


def upgrade():
    # Create mapping_levels table
    op.create_table(
        "mapping_levels",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("image_path", sa.String(), nullable=True),
        sa.Column("approvals_required", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("color", sa.String(), nullable=True),
        sa.Column("ordering", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("ordering"),
    )

    # Create objects for the existing mapping levels
    conn = op.get_bind()
    conn.execute(sa.text("insert into mapping_levels (name, ordering) values('BEGINNER', 1);"))
    conn.execute(sa.text("insert into mapping_levels (name, ordering) values('INTERMEDIATE', 2);"))
    conn.execute(sa.text("insert into mapping_levels (name, ordering) values('ADVANCED', 3);"))

    # Create an index from the users table to the new table
    op.create_foreign_key("fk_user_mapping_level", "users", "mapping_levels", ["mapping_level"], ["id"])


def downgrade():
    op.drop_constraint("fk_user_mapping_level", "users", type_="foreignkey")
    op.drop_table("mapping_levels")
