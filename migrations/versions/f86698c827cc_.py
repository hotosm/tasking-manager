"""empty message

Revision ID: f86698c827cc
Revises: e3282e2db2d7
Create Date: 2019-11-06 11:46:48.616033

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f86698c827cc"
down_revision = "e3282e2db2d7"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    campaign_tags = conn.execute(
        sa.text("select distinct(campaigns) from tags where campaigns is not null")
    )
    total_campaigns = campaign_tags.rowcount

    print("Total distinct campaigns in the DB: " + str(total_campaigns))
    for campaign_tag in campaign_tags:
        campaign_tag = campaign_tag[0]
        conn.execute("insert into campaigns (name) values ('" + campaign_tag + "')")
        new_campaign_id = conn.execute(
            "select id from campaigns where name ='" + campaign_tag + "'"
        ).scalar()
        projects = conn.execute(
            "select id from projects " + " where campaign_tag='" + campaign_tag + "'"
        )
        for project_id in projects:
            project_id = project_id[0]
            conn.execute(
                sa.text(
                    "insert into campaign_projects (campaign_id, project_id) values ("
                    + str(new_campaign_id)
                    + ","
                    + str(project_id)
                    + ")"
                )
            )
    op.drop_table("tags")
    op.drop_index("ix_projects_campaign_tag", table_name="projects")
    op.drop_column("projects", "campaign_tag")


def downgrade():
    conn = op.get_bind()
    op.add_column(
        "projects",
        sa.Column("campaign_tag", sa.VARCHAR(), autoincrement=False, nullable=True),
    )
    op.create_index(
        "ix_projects_campaign_tag", "projects", ["campaign_tag"], unique=False
    )
    op.create_table(
        "tags",
        sa.Column("id", sa.INTEGER(), nullable=False),
        sa.Column("organisations", sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.Column("campaigns", sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.PrimaryKeyConstraint("id", name="tags_pkey"),
        sa.UniqueConstraint("campaigns", name="tags_campaigns_key"),
        sa.UniqueConstraint("organisations", name="tags_organisations_key"),
    )
    campaigns = conn.execute(sa.text("select id, name from campaigns"))
    for campaign_id, campaign_tag in campaigns:
        conn.execute(
            sa.text("insert into tags (campaigns) values ('" + campaign_tag + "')")
        )
        projects = conn.execute(
            sa.text(
                "select project_id from campaign_projects where campaign_id="
                + str(campaign_id)
            )
        )
        for project in projects:
            project_id = project[0]
            conn.execute(
                sa.text(
                    "update projects set campaign_tag='"
                    + campaign_tag
                    + "' where id="
                    + str(project_id)
                )
            )
        conn.execute(
            sa.text(
                "delete from campaign_organisations where campaign_id="
                + str(campaign_id)
            )
        )
        conn.execute(
            sa.text(
                "delete from campaign_projects where campaign_id=" + str(campaign_id)
            )
        )
        conn.execute(sa.text("delete from campaigns where id=" + str(campaign_id)))
