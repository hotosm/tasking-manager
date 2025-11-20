"""

Revision ID: 763165f937cf
Revises: 4489b9e235f8
Create Date: 2025-11-20 12:09:24.690604

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "763165f937cf"
down_revision = "4489b9e235f8"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE SEQUENCE IF NOT EXISTS project_teams_id_seq;")
    op.add_column(
        "project_teams",
        sa.Column(
            "id",
            sa.BigInteger(),
            nullable=True,
            server_default=sa.text("nextval('project_teams_id_seq'::regclass)"),
        ),
    )
    op.execute(
        "UPDATE project_teams SET id = nextval('project_teams_id_seq') WHERE id IS NULL;"
    )
    op.alter_column("project_teams", "id", nullable=False)
    op.execute("ALTER SEQUENCE project_teams_id_seq OWNED BY project_teams.id;")
    op.create_unique_constraint(
        "uq_project_team_role", "project_teams", ["team_id", "project_id", "role"]
    )
    op.drop_constraint("project_teams_pkey", "project_teams", type_="primary")
    op.create_primary_key("project_teams_pkey", "project_teams", ["id"])
    op.create_index("ix_project_teams_project_id", "project_teams", ["project_id"])
    op.create_index("ix_project_teams_team_id", "project_teams", ["team_id"])


def downgrade():
    op.drop_constraint("project_teams_pkey", "project_teams", type_="primary")
    op.drop_index("ix_project_teams_project_id", table_name="project_teams")
    op.drop_index("ix_project_teams_team_id", table_name="project_teams")
    op.create_primary_key(
        "project_teams_pkey", "project_teams", ["team_id", "project_id"]
    )
    op.drop_constraint("uq_project_team_role", "project_teams", type_="unique")
    op.drop_column("project_teams", "id")
    op.execute("DROP SEQUENCE IF EXISTS project_teams_id_seq;")
