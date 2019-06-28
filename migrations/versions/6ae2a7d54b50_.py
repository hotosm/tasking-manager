"""empty message

Revision ID: 6ae2a7d54b50
Revises: a43b9748ceee
Create Date: 2019-05-29 10:43:42.104432

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6ae2a7d54b50'
down_revision = 'a43b9748ceee'
branch_labels = None
depends_on = None


def state_change_user(conn, task, action_text):
  query = "select user_id from task_history where project_id=" + str(task['project_id']) + " " + \
          "and task_id=" + str(task['id']) + " and action='STATE_CHANGE' and " + \
          "action_text='" + action_text + "' order by action_date desc limit 1"

  return conn.execute(query).fetchone()


def upgrade():

    conn = op.get_bind()

    # Make sure action_texts are not too long
    conn.execute('update task_history set action_text = substring(action_text from 1 for 5000) ' +
                 'where length(action_text) > 5000;')
    op.create_index('idx_action_action_text_composite', 'task_history', ['action', 'action_text'], unique=False)
    op.create_index(op.f('ix_tasks_task_status'), 'tasks', ['task_status'], unique=False)

    invalidated_tasks = conn.execute('select * from tasks where task_status = 5')
    for task in invalidated_tasks:
        validated_by = state_change_user(conn, task, "INVALIDATED")
        mapped_by = state_change_user(conn, task, "MAPPED")

        if not validated_by or not mapped_by:
            print("Project " + str(task['project_id']) + ": skipping invalidated task " + \
                   str(task['id']) + " due to missing or unexpected task history")
            continue

        conn.execute("update tasks set validated_by=" + str(validated_by['user_id']) + ", " + \
                     "mapped_by=" + str(mapped_by['user_id']) + " " + \
                     "where project_id=" + str(task['project_id']) + " " + \
                     "and id=" + str(task['id']))
    # ### end Alembic commands ###


def downgrade():
    conn = op.get_bind()
    conn.execute("update tasks set validated_by=NULL, mapped_by=NULL where task_status = 5")
    op.drop_index(op.f('ix_tasks_task_status'), table_name='tasks')
    op.drop_index('idx_action_action_text_composite', table_name='task_history')
