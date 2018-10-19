"""empty message

Revision ID: deec8123583d
Revises: ac55902fcc3d
Create Date: 2018-08-07 23:09:58.621826

"""
from alembic import op
import sqlalchemy as sa
from server.models.postgis.project import Project
from server.models.postgis.task import Task


# revision identifiers, used by Alembic.
revision = 'deec8123583d'
down_revision = 'ac55902fcc3d'
branch_labels = None
depends_on = None

projects = Project.__table__
tasks = Task.__table__

def upgrade():
    conn = op.get_bind()

    for project in conn.execute(projects.select()):
        zooms = conn.execute(
            sa.sql.expression.select([tasks.c.zoom]).distinct(tasks.c.zoom)
                .where(tasks.c.project_id == project.id))
        zooms = zooms.fetchall()

        if len(zooms) == 1 and zooms[0] == (None,):
            op.execute(
                projects.update().where(projects.c.id == project.id)
                    .values(task_creation_mode=1))
        else:
            op.execute(
                projects.update().where(projects.c.id == project.id)
                    .values(task_creation_mode=0))


def downgrade():
    pass
