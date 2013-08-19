from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound, HTTPBadRequest
from ..models import (
    DBSession,
    Task,
    )

@view_config(route_name='task_xhr', renderer='task.jade',
        http_cache=0)
def task_xhr(request):
    id = request.matchdict['id']
    session = DBSession()
    task = session.query(Task).get(id)
    return dict(task=task)
