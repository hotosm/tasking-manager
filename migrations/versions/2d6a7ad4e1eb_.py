"""empty message

Revision ID: 2d6a7ad4e1eb
Revises: 14340f1e0d6b
Create Date: 2020-03-23 12:10:20.120500

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "2d6a7ad4e1eb"
down_revision = "14340f1e0d6b"
branch_labels = None
depends_on = None


def upgrade():
    op.rename_table("users_licenses", "user_licenses")
    op.rename_table("projects_interests", "project_interests")
    op.rename_table("users_interests", "user_interests")


def downgrade():
    op.rename_table("user_licenses", "users_licenses")
    op.rename_table("project_interests", "projects_interests")
    op.rename_table("user_interests", "users_interests")
