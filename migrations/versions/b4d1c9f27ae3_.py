"""Create a table linking supporting organisations to projects.

A project keeps its single `projects.organisation_id` as the lead organisation.
This table holds the additional (supporting/partner) organisations, so a project
can be attributed to more than one organisation without changing how the lead
organisation is stored or how permissions are resolved.

Revision ID: b4d1c9f27ae3
Revises: 4ee8b1efdebd
Create Date: 2026-08-16 11:42:18.317204

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "b4d1c9f27ae3"
down_revision = "4ee8b1efdebd"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "project_organisations",
        sa.Column("id", sa.INTEGER(), autoincrement=True, primary_key=True),
        sa.Column("project_id", sa.INTEGER(), nullable=False),
        sa.Column("organisation_id", sa.INTEGER(), nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(), nullable=False),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name="project_organisations_projects_fk",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["organisation_id"],
            ["organisations.id"],
            name="project_organisations_organisations_fk",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint(
            "project_id", "organisation_id", name="uq_project_organisation"
        ),
    )
    op.create_index(
        op.f("ix_project_organisations_project_id"),
        "project_organisations",
        ["project_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_project_organisations_organisation_id"),
        "project_organisations",
        ["organisation_id"],
        unique=False,
    )


def downgrade():
    op.drop_index(
        op.f("ix_project_organisations_organisation_id"),
        table_name="project_organisations",
    )
    op.drop_index(
        op.f("ix_project_organisations_project_id"),
        table_name="project_organisations",
    )
    op.drop_table("project_organisations")
