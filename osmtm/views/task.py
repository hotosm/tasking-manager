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
    TaskState,
    TaskLock,
    TaskComment,
    User
)
from geoalchemy2 import (
    shape,
)

from sqlalchemy.orm import (
    joinedload,
)

from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.exc import OperationalError
from sqlalchemy.sql.expression import (
    and_,
    func,
)

from pyramid.security import authenticated_userid

import datetime
import transaction
import random

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


def __get_task(request, lock_for_update=False):
    check_task_expiration()
    task_id = request.matchdict['task']
    project_id = request.matchdict['project']
    filter = and_(Task.project_id == project_id, Task.id == task_id)
    query = DBSession.query(Task) \
                     .options(joinedload(Task.cur_lock)) \
                     .filter(filter)

    if lock_for_update:
        query = query.with_for_update(nowait=True, of=Task)

    try:
        task = query.one()
    except NoResultFound:
        task = None
    except OperationalError:  # pragma: no cover
        raise HTTPBadRequest("Cannot update task. Record lock for update.")

    if not task or \
       task.cur_state and task.cur_state.state == TaskState.state_removed:
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

    filter = and_(TaskState.task_id == task_id,
                  TaskState.project_id == project_id)
    states = DBSession.query(TaskState).filter(filter) \
        .order_by(TaskState.date).all()
    # remove the first state (task creation with state==ready)
    states.pop(0)

    filter = and_(TaskLock.task_id == task_id,
                  TaskLock.project_id == project_id)
    locks = DBSession.query(TaskLock).filter(filter) \
        .order_by(TaskLock.date).all()
    # remove the first lock (task creation)
    locks.pop(0)

    filter = and_(TaskComment.task_id == task_id,
                  TaskComment.project_id == project_id)
    comments = DBSession.query(TaskComment).filter(filter) \
        .order_by(TaskComment.date).all()

    history = states + locks + comments

    history = sorted(history, key=lambda step: step.date, reverse=True)

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
    task = __get_task(request, lock_for_update=True)
    __ensure_task_locked(task, user)

    add_comment(request, task, user)

    task.states.append(TaskState(user=user, state=TaskState.state_done))
    task.locks.append(TaskLock(user=None, lock=False))
    DBSession.add(task)
    DBSession.flush()

    _ = request.translate
    return dict(success=True,
                msg=_("Task marked as done. Thanks for your contribution"))


@view_config(route_name='task_lock', renderer="json")
def lock(request):
    _ = request.translate

    user = __get_user(request)
    task = __get_task(request, lock_for_update=True)

    locked_task = get_locked_task(task.project_id, user)

    if locked_task is not None:
        raise HTTPBadRequest

    if task.cur_lock and task.cur_lock.lock:
        # FIXME use http errors
        return dict(success=False,
                    task=dict(id=task.id),
                    error_msg=_("Task already locked."))

    task.locks.append(TaskLock(user=user, lock=True))
    DBSession.add(task)
    return dict(success=True, task=dict(id=task.id),
                msg=_("Task locked. You can start mapping."))


@view_config(route_name='task_unlock', renderer="json")
def unlock(request):
    user = __get_user(request)
    task = __get_task(request, lock_for_update=True)
    __ensure_task_locked(task, user)

    add_comment(request, task, user)

    task.locks.append(TaskLock(user=None, lock=False))
    DBSession.add(task)
    DBSession.flush()

    _ = request.translate
    return dict(success=True, task=dict(id=task.id),
                msg=_("Task unlocked."))


@view_config(route_name='task_comment', renderer="json")
def comment(request):
    user = __get_user(request)
    task = __get_task(request)

    add_comment(request, task, user)

    _ = request.translate
    return dict(success=True, task=dict(id=task.id),
                msg=_("Comment added."))


def add_comment(request, task, user):
    if 'comment' in request.params and request.params.get('comment') != '':
        comment = request.params['comment']
        task.comments.append(TaskComment(comment, user))
        DBSession.add(task)
        DBSession.flush()


@view_config(route_name='task_validate', renderer="json")
def validate(request):
    user = __get_user(request)
    task = __get_task(request, lock_for_update=True)
    __ensure_task_locked(task, user)

    task.user = None

    _ = request.translate
    if 'validate' in request.params:
        state = TaskState.state_validated
        msg = _("Task validated.")
    else:
        state = TaskState.state_invalidated
        msg = _("Task invalidated.")

    add_comment(request, task, user)

    task.states.append(TaskState(user=user, state=state))
    task.locks.append(TaskLock(user=None, lock=False))
    DBSession.add(task)
    DBSession.flush()

    return dict(success=True, msg=msg)


@view_config(route_name='task_split', renderer='json')
def split(request):
    user = __get_user(request)
    task = __get_task(request, lock_for_update=True)
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

    task.states.append(TaskState(user=user, state=TaskState.state_removed))
    task.locks.append(TaskLock(user=None, lock=False))
    DBSession.add(task)

    return dict()


def get_locked_task(project_id, user):
    if user is None:
        return None
    try:
        query = DBSession.query(Task).options(joinedload(Task.cur_lock)) \
            .filter(and_(Task.cur_lock.has(lock=True),
                         Task.project_id == project_id,
                         Task.cur_lock.has(user_id=user.id)))

        return query.one()
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
        .filter_by(project_id=project_id) \
        .filter(Task.cur_lock.has(lock=True)).subquery()

    # first search attempt - all available tasks that do not border busy tasks
    taskgetter = DBSession.query(Task) \
        .filter_by(project_id=project_id) \
        .filter(Task.cur_state.has(state=TaskState.state_ready)) \
        .filter(Task.geometry.ST_Disjoint(locked.c.taskunion))
    count = taskgetter.count()
    if count != 0:
        atask = taskgetter.offset(random.randint(0, count - 1)).first()
        return dict(success=True, task=dict(id=atask.id))

    # second search attempt - if the non-bordering constraint gave us no hits,
    # we discard that constraint
    taskgetter = DBSession.query(Task) \
        .filter_by(project_id=project_id) \
        .filter(Task.cur_state.has(state=TaskState.state_ready))
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
    return dict(multipolygon=shape.to_shape(task.geometry),
                project_id=task.project_id)


# unlock any expired task
def check_task_expiration():  # pragma: no cover
    subquery = DBSession.query(
        TaskLock,
        func.rank().over(
            partition_by=TaskLock.task_id, order_by=TaskLock.date.desc()
        ).label("rank")
    ).filter(TaskLock.lock.is_(True)) \
     .subquery()

    query = DBSession.query(
        TaskLock
    ).select_entity_from(subquery).filter(subquery.c.rank == 1)

    with transaction.manager:
        for lock in query:
            if lock.date < datetime.datetime.utcnow() - EXPIRATION_DELTA:
                new_lock = TaskLock()
                new_lock.task_id = lock.task_id
                new_lock.project_id = lock.project_id
                DBSession.add(new_lock)
