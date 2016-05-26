"""Add task parent to retain history after split

Revision ID: 5002e75c0604
Revises: 33e34b3beaa3
Create Date: 2016-05-10 22:37:31.383527

"""

# revision identifiers, used by Alembic.
revision = '5002e75c0604'
down_revision = '33e34b3beaa3'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('task', sa.Column('parent_id', sa.Integer(), nullable=True))
    #task_table = table('task', column('zoom'), column('x'), column('y'))
    #project_table = table('project', column('id'), column('zoom'))

    project_table = sa.Table(
        'project',
        sa.MetaData(),
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('zoom', sa.Integer)
    )

    task_table = sa.Table(
        'task',
        sa.MetaData(),
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('project_id', sa.Integer, primary_key=True),
        sa.Column('zoom', sa.Integer),
        sa.Column('x', sa.Integer),
        sa.Column('y', sa.Integer),
        sa.Column('parent_id', sa.Integer),
    )

    # build a quick link for the current connection of alembic
    connection = op.get_bind()

    for project in connection.execute(project_table.select()
                                      .order_by(project_table.c.id)):
        print "Migrating project %i" % project.id
        if project.zoom is None:
            continue

        query = task_table.select() \
            .where(sa.and_(task_table.c.project_id == project.id,
                           task_table.c.zoom != project.zoom))

        for task in connection.execute(query):
            parent_x = task.x / 2
            parent_y = task.y / 2
            op.execute(
                task_table.update().values(
                    parent_id=sa.select([task_table.c.id])
                        .where(sa.and_(
                            task_table.c.x == parent_x,
                            task_table.c.y == parent_y,
                            task_table.c.project_id == project.id
                        ))
                )
                .where(sa.and_(task_table.c.id == task.id,
                               task_table.c.project_id == project.id))
            )

def downgrade():
    op.drop_column('task', 'parent_id')
