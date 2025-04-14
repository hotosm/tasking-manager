"""empty message

Revision ID: c4670f3bb828
Revises: 0aaac86a48dc
Create Date: 2017-05-03 13:59:37.296261

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "c4670f3bb828"
down_revision = "0aaac86a48dc"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("message", sa.String(), nullable=True),
        sa.Column("subject", sa.String(), nullable=True),
        sa.Column("from_user_id", sa.BigInteger(), nullable=True),
        sa.Column("to_user_id", sa.BigInteger(), nullable=True),
        sa.Column("date", sa.DateTime(), nullable=True),
        sa.Column("read", sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(["from_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["to_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_messages_to_user_id"), "messages", ["to_user_id"], unique=False
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f("ix_messages_to_user_id"), table_name="messages")
    op.drop_table("messages")
    # ### end Alembic commands ###
