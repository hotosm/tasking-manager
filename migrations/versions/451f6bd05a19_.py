"""empty message

Revision ID: 451f6bd05a19
Revises: a43b9748ceee
Create Date: 2019-07-02 17:03:55.567940

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "451f6bd05a19"
down_revision = "a43b9748ceee"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        DROP TRIGGER IF EXISTS tsvectorupdate ON project_info;
        CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE ON project_info FOR EACH ROW EXECUTE PROCEDURE
        tsvector_update_trigger(text_searchable, "pg_catalog.english", project_id_str, short_description, description)
        """
    )


def downgrade():
    pass
