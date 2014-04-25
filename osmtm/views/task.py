from pyramid.view import view_config
from pyramid.httpexceptions import (
    HTTPNotFound,
    HTTPBadRequest,
    HTTPUnauthorized,
    HTTPForbidden,
)
from ..models import (
    DBSession,
    Task,
    TaskHistory,
    User
)
from geoalchemy2 import (
    shape,
)

from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.sql.expression import and_

from pyramid.security import authenticated_userid

import random
import datetime
import transaction

from ..models import EXPIRATION_DELTA


def __get_user(request, allow_none=False):
    user_id = authenticated_userid(request)

    if not user_id:
        if allow_none:
            return None
        raise HTTPUnauthorized()

    user = DBSession.query(User).get(user_id)

    if not allow_none and not user:  # pragma: no cover
        raise HTTPUnauthorized()

    return user


def __get_task(request):
    check_task_expiration()
    task_id = request.matchdict['task']
    project_id = request.matchdict['project']
    task = DBSession.query(Task).get((project_id, task_id))
    if not task or task.state == Task.state_removed:
        # FIXME return translated text via JSON
        raise HTTPNotFound("This task doesn't exist.")
    return task


def __ensure_task_locked(task, user):
    locked_task = get_locked_task(task.project_id, user)
    if locked_task != task:
        raise HTTPForbidden("You need to lock the task first.")


@view_config(route_name='task_xhr', renderer='task.mako')
def task_xhr(request):
    user = __get_user(request, allow_none=True)
    task = __get_task(request)

    locked_task = get_locked_task(task.project_id, user)

    task_id = request.matchdict['task']
    project_id = request.matchdict['project']
    filter = and_(TaskHistory.task_id == task_id,
                  TaskHistory.project_id == project_id)
    history = DBSession.query(TaskHistory).filter(filter) \
        .order_by(TaskHistory.id.desc()).all()
    return dict(task=task,
                user=user,
                locked_task=locked_task,
                history=history)


@view_config(route_name='task_empty', renderer='task.empty.mako')
def task_empty(request):
    user = __get_user(request, allow_none=True)
    project_id = request.matchdict['project']
    locked_task = get_locked_task(project_id, user)

    return dict(locked_task=locked_task, project_id=project_id)


@view_config(route_name='task_done', renderer='json')
def done(request):
    user = __get_user(request)
    task = __get_task(request)
    __ensure_task_locked(task, user)

    task.state = task.state_done
    task.locked = False
    task.user = None
    DBSession.add(task)
    DBSession.flush()

    if 'comment' in request.params and request.params.get('comment') != '':
        comment = request.params['comment']
        task.add_comment(comment, user)

    _ = request.translate
    return dict(success=True,
                msg=_("Task marked as done. Thanks for your contribution"))


@view_config(route_name='task_lock', renderer="json")
def lock(request):
    _ = request.translate

    user = __get_user(request)
    task = __get_task(request)

    locked_task = get_locked_task(task.project_id, user)

    if locked_task is not None:
        raise HTTPBadRequest

    if task.locked:
        # FIXME use http errors
        return dict(success=False,
                    task=dict(id=task.id),
                    error_msg=_("Task already locked."))

    task.user = user
    task.locked = True
    DBSession.add(task)
    return dict(success=True, task=dict(id=task.id),
                msg=_("Task locked. You can start mapping."))


@view_config(route_name='task_unlock', renderer="json")
def unlock(request):
    user = __get_user(request)
    task = __get_task(request)
    __ensure_task_locked(task, user)

    task.user = None
    task.locked = False

    DBSession.add(task)
    DBSession.flush()

    if 'comment' in request.params and request.params.get('comment') != '':
        comment = request.params['comment']
        task.add_comment(comment, user)

    _ = request.translate
    return dict(success=True, task=dict(id=task.id),
                msg=_("Task unlocked."))


@view_config(route_name='task_comment', renderer="json")
def comment(request):
    user = __get_user(request)
    task = __get_task(request)

    comment = request.params['comment']
    task.add_free_comment(comment, user)

    _ = request.translate
    return dict(success=True, task=dict(id=task.id),
                msg=_("Comment added."))


@view_config(route_name='task_validate', renderer="json")
def validate(request):
    user = __get_user(request)
    task = __get_task(request)
    __ensure_task_locked(task, user)

    task.user = None

    _ = request.translate
    if 'validate' in request.params:
        task.state = task.state_validated
        msg = _("Task validated.")
    else:
        task.state = task.state_invalidated
        msg = _("Task invalidated.")

    task.locked = False
    DBSession.add(task)
    DBSession.flush()

    if 'comment' in request.params and request.params.get('comment') != '':
        comment = request.params['comment']
        task.add_comment(comment, user)

    return dict(success=True, msg=msg)


@view_config(route_name='task_split', renderer='json')
def split(request):
    user = __get_user(request)
    task = __get_task(request)
    __ensure_task_locked(task, user)

    if task.zoom is None or (task.zoom - task.project.zoom) > 1:
        raise HTTPBadRequest()

    for i in range(0, 2):
        for j in range(0, 2):
            t = Task(int(task.x) * 2 + i,
                     int(task.y) * 2 + j,
                     int(task.zoom) + 1)
            t.project = task.project
            t.update = datetime.datetime.utcnow()

    task.state = task.state_removed
    task.locked = False
    DBSession.add(task)

    return dict()


def get_locked_task(project_id, user):
    try:
        filter = and_(Task.user == user,
                      Task.locked.is_(True),
                      Task.project_id == project_id)
        return DBSession.query(Task).filter(filter).one()
    except NoResultFound:
        return None


@view_config(route_name='task_random', http_cache=0, renderer='json')
def random_task(request):
    """Gets a random not-done task. First it tries to get one that does not
       border any in-progress tasks."""
    project_id = request.matchdict['project']

    # we will ask about the area occupied by tasks locked by others, so we can
    # steer clear of them
    locked = DBSession.query(Task.geometry.ST_Union().label('taskunion')) \
        .filter_by(project_id=project_id, locked=True).subquery()

    # first search attempt - all available tasks that do not border busy tasks
    taskgetter = DBSession.query(Task) \
        .filter_by(project_id=project_id, state=Task.state_ready) \
        .filter(Task.geometry.ST_Disjoint(locked.c.taskunion))
    count = taskgetter.count()
    if count != 0:
        atask = taskgetter.offset(random.randint(0, count - 1)).first()
        return dict(success=True, task=dict(id=atask.id))

    # second search attempt - if the non-bordering constraint gave us no hits,
    # we discard that constraint
    taskgetter = DBSession.query(Task) \
        .filter_by(project_id=project_id, state=Task.state_ready)
    count = taskgetter.count()
    if count != 0:
        atask = taskgetter.offset(random.randint(0, count - 1)).first()
        return dict(success=True, task=dict(id=atask.id))

    _ = request.translate
    return dict(success=False,
                error_msg=_("Random task... none available! Sorry."))


@view_config(route_name='task_gpx', renderer='task.gpx.mako')
def task_gpx(request):
    task = __get_task(request)
    request.response.headerlist.append(('Access-Control-Allow-Origin',
                                        'http://www.openstreetmap.org'))
    return dict(polygon=shape.to_shape(task.geometry),
                project_id=task.project_id)


# unlock any expired task
def check_task_expiration():
    tasks = DBSession.query(Task).filter(Task.locked == True).all()  # noqa
    for task in tasks:
        if datetime.datetime.utcnow() > task.update + EXPIRATION_DELTA:
            with transaction.manager:
                task.user_id = None
                task.locked = False
                task.update = datetime.datetime.utcnow()
                DBSession.add(task)
