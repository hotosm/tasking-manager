from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound, HTTPBadRequest
from ..models import (
    DBSession,
    Task,
    User
    )

from pyramid.security import authenticated_userid

@view_config(route_name='task_xhr', renderer='task.jade',
        http_cache=0)
def task_xhr(request):
    id = request.matchdict['id']
    session = DBSession()
    task = session.query(Task).get(id)
    return dict(task=task)

@view_config(route_name='task_lock', renderer="json")
def take_lock(request):
    task_id = request.matchdict['id']
    session = DBSession()
    user_id = authenticated_userid(request)
    user = session.query(User).get(user_id)

    task = session.query(Task).get(task_id)

    task.user = user_id
    task.state = 1 # working
    session.add(task)
    return dict(success=True)
