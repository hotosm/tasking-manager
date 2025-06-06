"""Rename project mapper level to difficulty

Revision ID: bcdb7875bd1c
Revises: 4ed992117718
Create Date: 2022-11-10 10:52:49.869498

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "bcdb7875bd1c"
down_revision = "4ed992117718"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "projects", "mapper_level", nullable=False, new_column_name="difficulty"
    )
    op.execute("ALTER INDEX ix_projects_mapper_level RENAME TO ix_projects_difficulty;")
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "projects", "difficulty", nullable=False, new_column_name="mapper_level"
    )
    op.execute("ALTER INDEX ix_projects_difficulty RENAME TO ix_projects_mapper_level;")
    # ### end Alembic commands ###
