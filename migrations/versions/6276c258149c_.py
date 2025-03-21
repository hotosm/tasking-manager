"""empty message

Revision ID: 6276c258149c
Revises: e8ffa33a9c18
Create Date: 2024-07-04 06:02:17.622419

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "6276c258149c"
down_revision = "e8ffa33a9c18"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("partners", schema=None) as batch_op:
        batch_op.alter_column(
            "name",
            existing_type=sa.VARCHAR(length=50),
            type_=sa.String(length=150),
            existing_nullable=False,
        )
        batch_op.alter_column(
            "primary_hashtag",
            existing_type=sa.VARCHAR(length=50),
            type_=sa.String(length=200),
            existing_nullable=False,
        )
        batch_op.alter_column(
            "secondary_hashtag",
            existing_type=sa.VARCHAR(length=50),
            type_=sa.String(length=200),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "logo_url",
            existing_type=sa.VARCHAR(length=100),
            type_=sa.String(length=500),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "link_meta",
            existing_type=sa.VARCHAR(length=50),
            type_=sa.String(length=300),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "link_x",
            existing_type=sa.VARCHAR(length=50),
            type_=sa.String(length=300),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "link_instagram",
            existing_type=sa.VARCHAR(length=50),
            type_=sa.String(length=300),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "permalink",
            existing_type=sa.VARCHAR(length=250),
            type_=sa.String(length=500),
            existing_nullable=True,
        )

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("partners", schema=None) as batch_op:
        batch_op.alter_column(
            "permalink",
            existing_type=sa.String(length=500),
            type_=sa.VARCHAR(length=250),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "link_instagram",
            existing_type=sa.String(length=300),
            type_=sa.VARCHAR(length=50),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "link_x",
            existing_type=sa.String(length=300),
            type_=sa.VARCHAR(length=50),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "link_meta",
            existing_type=sa.String(length=300),
            type_=sa.VARCHAR(length=50),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "logo_url",
            existing_type=sa.String(length=500),
            type_=sa.VARCHAR(length=100),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "secondary_hashtag",
            existing_type=sa.String(length=200),
            type_=sa.VARCHAR(length=50),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "primary_hashtag",
            existing_type=sa.String(length=200),
            type_=sa.VARCHAR(length=50),
            existing_nullable=False,
        )
        batch_op.alter_column(
            "name",
            existing_type=sa.String(length=150),
            type_=sa.VARCHAR(length=50),
            existing_nullable=False,
        )

    # ### end Alembic commands ###
