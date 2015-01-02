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
    PriorityArea,
    Project,
    User,
    Message,
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
    not_,
    and_,
    func,
)

from pyramid.security import authenticated_userid

import datetime
import random
import re

from ..models import EXPIRATION_DELTA, ST_SetSRID
from user import username_to_userid

import logging
log = logging.getLogger(__name__)


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

    _ = request.translate

    try:
        task = query.one()
    except NoResultFound:
        task = None
    except OperationalError:  # pragma: no cover
        raise HTTPBadRequest(_("Cannot update task. Record lock for update."))

    if not task or \
       task.cur_state and task.cur_state.state == TaskState.state_removed:
        # FIXME return translated text via JSON
        raise HTTPNotFound(_("This task doesn't exist."))
    return task


def __ensure_task_locked(request, task, user):
    _ = request.translate
    locked_task = get_locked_task(task.project_id, user)
    if locked_task != task:
        raise HTTPForbidden(_("You need to lock the task first."))


@view_config(route_name='task_xhr', renderer='task.mako', http_cache=0)
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


@view_config(route_name='task_empty', renderer='task.empty.mako', http_cache=0)
def task_empty(request):
    user = __get_user(request, allow_none=True)
    project_id = request.matchdict['project']
    locked_task = get_locked_task(project_id, user)
    assigned_tasks = get_assigned_tasks(project_id, user)

    return dict(locked_task=locked_task, project_id=project_id,
                assigned_tasks=assigned_tasks, user=user)


@view_config(route_name='task_done', renderer='json')
def done(request):
    user = __get_user(request)
    task = __get_task(request, lock_for_update=True)
    __ensure_task_locked(request, task, user)

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

    if task.assigned_to is not None and task.assigned_to != user:
        request.response.status = 400
        return dict(success=False,
                    task=dict(id=task.id),
                    error_msg=_("Task assigned to someone else."))

    task.locks.append(TaskLock(user=user, lock=True))
    DBSession.add(task)
    return dict(success=True, task=dict(id=task.id),
                msg=_("Task locked. You can start mapping."))


@view_config(route_name='task_unlock', renderer="json")
def unlock(request):
    user = __get_user(request)
    task = __get_task(request, lock_for_update=True)
    __ensure_task_locked(request, task, user)

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

        # check for mentions in the comment
        p = re.compile(ur'((?<=@)\w+|\[.+?\])')

        def repl(var):
            username = var.group()
            username = re.sub('(\[|\])', '', username)
            return username_to_userid(username)

        # put ids instead of usernames in comment
        comment = re.sub(p, repl, comment)

        p = re.compile(ur'((?<=@)\d+)')
        for userid in p.findall(comment):
            to = DBSession.query(User).get(userid)
            if to:
                mention_user(request, user, to, comment)

        task.comments.append(TaskComment(comment, user))
        DBSession.add(task)
        DBSession.flush()


def mention_user(request, from_, to, comment):

    _ = request.translate
    project_id = request.matchdict['project']
    task_id = request.matchdict['task']
    href = request.route_path('project', project=project_id)
    href = href + '#task/%s' % task_id
    link = '<a href="%s">#%s</a>' % (href, task_id)
    subject = _('You were mentioned in a comment - Task ${link}',
                mapping={'link': link})
    send_message(subject, from_, to, comment)


def send_message(subject, from_, to_, msg):
    DBSession.add(Message(subject, from_, to_, msg))


def send_invalidation_message(request, task, user):
    comment = request.params.get('comment', '')

    states = sorted(task.states, key=lambda state: state.date, reverse=True)

    to = None
    for state in states:
        if state.state == TaskState.state_done:
            to = state.user
            break

    from_ = user
    if from_ != to:
        _ = request.translate
        href = request.route_path('project', project=task.project_id)
        href = href + '#task/%s' % task.id
        link = '<a href="%s">#%d</a>' % (href, task.id)
        subject = _('Task ${link} invalidated', mapping={'link': link})
        send_message(subject, from_, to, comment)


@view_config(route_name='task_validate', renderer="json")
def validate(request):
    user = __get_user(request)
    task = __get_task(request, lock_for_update=True)
    __ensure_task_locked(request, task, user)

    task.user = None

    _ = request.translate
    if 'validate' in request.params:
        state = TaskState.state_validated
        msg = _("Task validated.")
    else:
        state = TaskState.state_invalidated
        msg = _("Task invalidated.")
        send_invalidation_message(request, task, user)

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
    __ensure_task_locked(request, task, user)

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


def get_assigned_tasks(project_id, user):
    if user is None:
        return None
    query = DBSession.query(Task) \
        .filter(Task.project_id == project_id, Task.assigned_to == user) \
        .order_by(Task.assigned_date.desc())
    return query.all()


def find_matching_task(project_id, filter):
    query = DBSession.query(Task) \
        .filter_by(project_id=project_id) \
        .filter(Task.cur_state.has(state=TaskState.state_ready)) \
        .filter(not_(Task.cur_lock.has(lock=True)))

    query = query.filter(filter)

    count = query.count()
    if count != 0:  # pragma: no cover
        atask = query.offset(random.randint(0, count - 1)).first()
        return atask

    return None


@view_config(route_name='task_random', http_cache=0, renderer='json')
def random_task(request):
    """Gets a random not-done task. First it tries to get one that does not
       border any in-progress tasks."""
    project_id = request.matchdict['project']

    # filter for tasks not bordering busy tasks
    locked = DBSession.query(Task.geometry.ST_Union()) \
        .filter_by(project_id=project_id) \
        .filter(Task.cur_lock.has(lock=True)) \
        .scalar()
    locked_filter = None
    if locked is not None:
        locked_filter = Task.geometry.ST_Disjoint(ST_SetSRID(locked, 4326))

    # filter for tasks within priority areas
    priority = DBSession.query(PriorityArea.geometry.ST_Union()) \
        .join(Project.priority_areas) \
        .filter(Project.id == project_id) \
        .scalar()
    priority_filter = None
    if priority is not None:
        priority_filter = Task.geometry.ST_Intersects(
            ST_SetSRID(priority, 4326)
        )

    # search attempts
    filters = []

    if priority_filter is not None and locked_filter is not None:
        # tasks in priority areas and not bordering busy tasks
        filters.append(and_(locked_filter, priority_filter))

    if priority_filter is not None:
        # tasks in priority areas
        filters.append(priority_filter)

    if locked_filter is not None:
        # tasks not bordering busy tasks
        filters.append(locked_filter)

    # any other available task
    filters.append(True)

    for filter in filters:
        atask = find_matching_task(project_id, filter)
        if atask:
            return dict(success=True, task=dict(id=atask.id))

    _ = request.translate
    return dict(success=False,
                error_msg=_("Random task... none available! Sorry."))


@view_config(route_name='task_assign', renderer='json',
             permission='project_edit')
def task_assign(request):
    """Assigns a taks to a given user"""
    task = __get_task(request)

    _ = request.translate
    if task.cur_lock and task.cur_lock.lock:
        request.response.status = 400
        return dict(success=True,
                    msg=_("You cannot assign an already locked task"))

    username = request.matchdict['user']
    user = DBSession.query(User).filter(User.username == username).one()

    task.assigned_to_id = user.id
    task.assigned_date = datetime.datetime.utcnow()
    DBSession.add(task)

    return dict(success=True,
                msg=_("Task assigned."))


@view_config(route_name='task_assign_delete', renderer='json',
             permission='project_edit')
def task_assign_delete(request):
    """Remove assignment"""
    task = __get_task(request)

    task.assigned_to_id = None
    task.assigned_date = None

    _ = request.translate
    return dict(success=True,
                msg=_("Task assignment removed"))


@view_config(route_name='task_gpx', renderer='task.gpx.mako')
def task_gpx(request):
    task = __get_task(request)
    request.response.headerlist.append(('Access-Control-Allow-Origin',
                                        'http://www.openstreetmap.org'))
    return dict(multipolygon=shape.to_shape(task.geometry),
                project_id=task.project_id)


@view_config(route_name='task_osm', renderer='task.osm.mako')
def task_osm(request):
    task = __get_task(request)
    request.response.headerlist.append(('Access-Control-Allow-Origin',
                                        'http://www.openstreetmap.org'))
    return dict(multipolygon=shape.to_shape(task.geometry),
                project_id=task.project_id)


@view_config(route_name='task_difficulty', renderer='json',
             permission='project_edit')
def task_difficulty(request):
    """Change task difficulty"""
    task = __get_task(request)
    difficulty = request.matchdict['difficulty']

    task.difficulty = difficulty

    _ = request.translate
    return dict(success=True,
                msg=_("Task difficulty changed."))


@view_config(route_name='task_difficulty_delete', renderer='json',
             permission='project_edit')
def task_difficulty_delete(request):
    """Remove assignment"""
    task = __get_task(request)

    task.difficulty = None

    _ = request.translate
    return dict(success=True,
                msg=_("Task difficulty removed"))


# unlock any expired task
def check_task_expiration():  # pragma: no cover
    subquery = DBSession.query(
        TaskLock,
        func.rank().over(
            partition_by=(TaskLock.task_id, TaskLock.project_id),
            order_by=TaskLock.date.desc()
        ).label("rank")
    ).subquery()

    query = DBSession.query(
        TaskLock
    ).select_entity_from(subquery) \
     .filter(subquery.c.rank == 1, subquery.c.lock.is_(True))

    for lock in query:
        if lock.date < datetime.datetime.utcnow() - EXPIRATION_DELTA:
            new_lock = TaskLock()
            new_lock.task_id = lock.task_id
            new_lock.project_id = lock.project_id
            DBSession.add(new_lock)
