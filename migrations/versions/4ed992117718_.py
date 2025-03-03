"""empty message

Revision ID: 4ed992117718
Revises: 05f1b650ddbc
Create Date: 2022-09-20 13:11:54.721669

"""
import sqlalchemy as sa
from alembic import op

from backend.models.postgis.statuses import TeamJoinMethod, TeamVisibility

# revision identifiers, used by Alembic.
revision = "4ed992117718"
down_revision = "05f1b650ddbc"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column("teams", sa.Column("join_method", sa.Integer(), nullable=True))
    op.execute(
        f"UPDATE teams SET join_method = {TeamJoinMethod.ANY.value} "
        f"WHERE invite_only = false AND visibility = {TeamVisibility.PUBLIC.value};"
    )
    op.execute(
        f"UPDATE teams SET join_method = {TeamJoinMethod.BY_INVITE.value} "
        f"WHERE visibility = {TeamVisibility.PRIVATE.value} AND invite_only = false;"
    )
    op.execute(f"UPDATE teams SET join_method = {TeamJoinMethod.BY_REQUEST.value} WHERE invite_only = true;")
    op.alter_column("teams", "join_method", nullable=False)
    op.drop_column("teams", "invite_only")
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "teams",
        sa.Column("invite_only", sa.BOOLEAN(), autoincrement=False, nullable=True),
    )
    op.execute(
        f"UPDATE teams SET invite_only = true WHERE join_method = {TeamJoinMethod.BY_REQUEST.value};"
        f"UPDATE teams SET invite_only = false WHERE join_method != {TeamJoinMethod.BY_REQUEST.value};"
    )
    op.alter_column("teams", "invite_only", nullable=False)
    op.drop_column("teams", "join_method")
    # ### end Alembic commands ###
