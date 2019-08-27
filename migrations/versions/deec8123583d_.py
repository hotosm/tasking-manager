"""empty message

Revision ID: deec8123583d
Revises: ac55902fcc3d
Create Date: 2018-08-07 23:09:58.621826

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'deec8123583d'
down_revision = 'ac55902fcc3d'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    projects = conn.execute('select * from projects')

    # Content migration: Check the amount of zoom levels in tasks of a project and set
    # task_creation_mode to 1 or 0 accordingly.
    for project in projects:
        select_query = 'select distinct zoom from tasks where project_id = ' + str(project.id)
        zooms = conn.execute(select_query)
        zooms = zooms.fetchall()

        if len(zooms) == 1 and zooms[0] == (None,):
            update_query = 'update projects set task_creation_mode = 1 where id = ' + str(project.id)
        else:
            update_query = 'update projects set task_creation_mode = 0 where id = ' + str(project.id)

        op.execute(update_query)



def downgrade():
    pass
