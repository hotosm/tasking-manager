"""empty message

Revision ID: c8fa5f168271
Revises: f26a7c36eb65_
Create Date: 2019-09-06 08:08:15.691079

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "c8fa5f168271"
down_revision = "84c793a951b2"
branch_labels = None
depends_on = None


def upgrade():
    # ### Alembic commands ###
    op.alter_column(
        "projects",
        "changeset_comment",
        new_column_name="changeset_tags",
        existing_type=sa.String(),
        type_=sa.JSON(),
        postgresql_using="json_build_object('comment', changeset_comment)",
    )
    # ### end Alembic commands ###


def downgrade():
    # ### Alembic commands ###
    op.alter_column(
        "projects",
        "changeset_tags",
        new_column_name="changeset_comment",
        existing_type=sa.JSON(),
        type_=sa.String(),
        postgresql_using="changeset_tags::json->'comment'",
    )
    # ### end Alembic commands ###
