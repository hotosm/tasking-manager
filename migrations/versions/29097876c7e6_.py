"""empty message

Revision ID: 29097876c7e6
Revises: f26a7c36eb65
Create Date: 2019-12-04 11:21:42.622908

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "29097876c7e6"
down_revision = "f26a7c36eb65"
branch_labels = None
depends_on = None


def upgrade():
    op.create_unique_constraint(
        "campaign_organisation_key",
        "campaign_organisations",
        ["campaign_id", "organisation_id"],
    )


def downgrade():
    op.drop_constraint(
        "campaign_organisation_key", "campaign_organisations", type_="unique"
    )
