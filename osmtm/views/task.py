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
    User
)
from geoalchemy2 import (
    shape,
)

from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.exc import OperationalError
from sqlalchemy.sql.expression import (
    and_,
    func,
)

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


def __get_task(request, lock_for_update=False):
    check_task_expiration()
    task_id = request.matchdict['task']
    project_id = request.matchdict['project']
    filter = and_(Task.project_id == project_id, Task.id == task_id)
    query = DBSession.query(Task).filter(filter)

    if lock_for_update:
        query = query.with_for_update(nowait=True, of=Task)

    try:
        task = query.one()
    except NoResultFound:
        task = None
    except OperationalError:  # pragma: no cover
        raise HTTPBadRequest("Cannot update task. Record lock for update.")

    if not task or task.state and task.state.state == TaskState.state_removed:
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
    history = DBSession.query(TaskState).filter(filter) \
        .order_by(TaskState.id.desc()).all()
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

    task_state = TaskState(task, user, TaskState.state_done)
    DBSession.add(task_state)

    task_lock = TaskLock(task, None, False)
    DBSession.add(task_lock)
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
    task = __get_task(request, lock_for_update=True)

    locked_task = get_locked_task(task.project_id, user)

    if locked_task is not None:
        raise HTTPBadRequest

    if task.lock and task.lock.lock:
        # FIXME use http errors
        return dict(success=False,
                    task=dict(id=task.id),
                    error_msg=_("Task already locked."))

    task_locked = TaskLock(task, user, True)
    DBSession.add(task_locked)
    return dict(success=True, task=dict(id=task.id),
                msg=_("Task locked. You can start mapping."))


@view_config(route_name='task_unlock', renderer="json")
def unlock(request):
    user = __get_user(request)
    task = __get_task(request, lock_for_update=True)
    __ensure_task_locked(task, user)

    task_locked = TaskLock(task, None, False)
    DBSession.add(task_locked)

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
    task = __get_task(request, lock_for_update=True)
    __ensure_task_locked(task, user)

    task.user = None

    _ = request.translate
    if 'validate' in request.params:
        task_state = TaskState(task, user, TaskState.state_validated)
        msg = _("Task validated.")
    else:
        task_state = TaskState(task, user, TaskState.state_invalidated)
        msg = _("Task invalidated.")

    DBSession.add(task_state)

    task_locked = TaskLock(task, None, False)
    DBSession.add(task_locked)
    DBSession.flush()

    if 'comment' in request.params and request.params.get('comment') != '':
        comment = request.params['comment']
        task.add_comment(comment, user)

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

    task_state = TaskState(task, user, TaskState.state_removed)
    DBSession.add(task_state)

    task_locked = TaskLock(task, None, False)
    DBSession.add(task_locked)

    return dict()


def get_locked_task(project_id, user):
    if user is None:
        return None
    try:
        subquery = DBSession.query(
            TaskLock,
            func.rank().over(
                partition_by=(TaskLock.task_id, TaskLock.project_id),
                order_by=TaskLock.date.desc()
            ).label("rank")
        ).subquery()

        query = DBSession.query(
            TaskLock
        ).select_entity_from(subquery).filter(
            and_(subquery.c.rank == 1,
                 subquery.c.lock.is_(True),
                 subquery.c.project_id == project_id,
                 subquery.c.user_id == user.id)
        )

        task_lock = query.one()
        return task_lock.task
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
        .filter_by(project_id=project_id, lock=True).subquery()

    # first search attempt - all available tasks that do not border busy tasks
    taskgetter = DBSession.query(Task) \
        .filter_by(project_id=project_id, state=TaskState.state_ready) \
        .filter(Task.geometry.ST_Disjoint(locked.c.taskunion))
    count = taskgetter.count()
    if count != 0:
        atask = taskgetter.offset(random.randint(0, count - 1)).first()
        return dict(success=True, task=dict(id=atask.id))

    # second search attempt - if the non-bordering constraint gave us no hits,
    # we discard that constraint
    taskgetter = DBSession.query(Task) \
        .filter_by(project_id=project_id, state=TaskState.state_ready)
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
    ).subquery()

    query = DBSession.query(
        TaskLock
    ).select_entity_from(subquery).filter(
        and_(subquery.c.rank == 1,
             subquery.c.lock.is_(True),
             subquery.c.date < datetime.datetime.utcnow() - EXPIRATION_DELTA)
    )

    tasks = query.all()

    for task in tasks:
        with transaction.manager:
            task_lock = TaskLock(task, None, False)
            DBSession.add(task_lock)
