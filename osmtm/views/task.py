from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound, HTTPBadRequest
from ..models import (
    DBSession,
    Task,
    User
    )

from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.sql.expression import and_

from pyramid.security import authenticated_userid

@view_config(route_name='task_xhr', renderer='task.jade',
        http_cache=0)
def task_xhr(request):
    id = request.matchdict['id']
    session = DBSession()
    task = session.query(Task).get(id)

    user_id = authenticated_userid(request)
    user = session.query(User).get(user_id)

    locked_task = get_locked_task(task.project_id, user_id)
    print locked_task

    return dict(task=task,
            user=user,
            locked_task=locked_task)

@view_config(route_name='task_done', renderer='json')
def done(request):
    id = request.matchdict['id']
    session = DBSession()
    task = session.query(Task).get(id)

    user_id = authenticated_userid(request)
    user = session.query(User).get(user_id)

    task.state = 2
    task.user = None
    session.add(task)
    return dict(success=True,
            msg="Task marked as done. Thanks for your contribution")

@view_config(route_name='task_lock', renderer="json")
def lock(request):
    task_id = request.matchdict['id']
    session = DBSession()
    user_id = authenticated_userid(request)
    user = session.query(User).get(user_id)

    task = session.query(Task).get(task_id)

    task.user = user_id
    task.state = 1 # working
    session.add(task)
    return dict(success=True, task=dict(id=task.id))

@view_config(route_name='task_unlock', renderer="json")
def unlock(request):
    task_id = request.matchdict['id']
    session = DBSession()

    task = session.query(Task).get(task_id)

    task.user = None
    task.state = 0 # working
    session.add(task)
    return dict(success=True, task=dict(id=task.id))

def get_locked_task(project_id, user):
    session = DBSession()
    print project_id
    print user
    try:
        filter = and_(Task.user==user, Task.state==1, Task.project_id==project_id)
        return session.query(Task).filter(filter).one()
    except NoResultFound, e:
        return None
