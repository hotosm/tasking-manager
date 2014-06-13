from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound
from pyramid.url import route_path
from pyramid.response import Response
from ..models import (
    DBSession,
    Project,
    Area,
    User,
    Task,
    TaskState,
    TaskLock,
    License,
)
from pyramid.security import authenticated_userid

from pyramid.i18n import (
    get_locale_name,
)
from sqlalchemy.orm import (
    joinedload,
)
from sqlalchemy.sql.expression import (
    and_,
    func,
)

from geoalchemy2 import (
    shape,
)
from geoalchemy2.functions import (
    ST_Area,
)

from geojson import (
    FeatureCollection,
)

import datetime
import itertools

from .task import get_locked_task, check_task_expiration

from ..utils import parse_geojson

import logging
log = logging.getLogger(__name__)


@view_config(route_name='project', renderer='project.mako', http_cache=0,
             permission='project')
def project(request):
    check_task_expiration()
    id = request.matchdict['project']
    project = DBSession.query(Project).get(id)

    if project is None:
        _ = request.translate
        request.session.flash(_("Sorry, this project doesn't  exist"))
        return HTTPFound(location=route_path('home', request))

    project.locale = get_locale_name(request)

    filter = and_(TaskState.project_id == id,
                  TaskState.state != TaskState.state_removed,
                  TaskState.state != TaskState.state_ready)
    history = DBSession.query(TaskState) \
                       .filter(filter) \
                       .order_by(TaskState.date.desc()) \
                       .limit(20).all()

    user_id = authenticated_userid(request)
    locked_task = None
    if user_id:
        user = DBSession.query(User).get(user_id)
        locked_task = get_locked_task(project.id, user)
    return dict(page_id='project', project=project,
                locked_task=locked_task,
                history=history,)


@view_config(route_name='project_new', renderer='project.new.mako',
             permission="add")
def project_new(request):
    return dict(page_id='project_new')


@view_config(route_name='project_new_grid',
             renderer='project.new.grid.mako',
             permission="edit")
def project_new_grid(request):
    if 'zoom' in request.params:

        user_id = authenticated_userid(request)
        user = DBSession.query(User).get(user_id)
        project = Project(
            u'Untitled project',
            user
        )

        DBSession.add(project)
        DBSession.flush()

        zoom = int(request.params['zoom'])

        geometry = request.params['geometry']

        polygons = parse_geojson(geometry)
        from shapely.geometry import MultiPolygon
        multipolygon = MultiPolygon([polygon for polygon in polygons])

        geometry = shape.from_shape(multipolygon, 4326)
        project.area = Area(geometry)
        project.auto_fill(zoom)

        _ = request.translate
        request.session.flash(_("Project #${project_id} created successfully",
                              mapping={'project_id': project.id}),
                              'success')
        return HTTPFound(location=route_path('project_edit', request,
                                             project=project.id))

    return dict(page_id='project_new_grid')


@view_config(route_name='project_new_import',
             renderer='project.new.import.mako',
             permission="edit")
def project_new_import(request):
    if 'import' in request.params:

        user_id = authenticated_userid(request)
        user = DBSession.query(User).get(user_id)
        project = Project(
            u'Untitled project',
            user
        )

        try:
            input_file = request.POST['import'].file
            count = project.import_from_geojson(input_file.read())
            _ = request.translate
            request.session.flash(_("Successfully imported ${n} geometries",
                                  mapping={'n': count}),
                                  'success')
            return HTTPFound(location=route_path('project_edit', request,
                             project=project.id))
        except Exception, e:
            msg = "Sorry, this is not a JSON valid file. <br />%s" % e.message
            request.session.flash(msg, 'alert')

    return dict(page_id='project_new_import')


@view_config(route_name='project_edit', renderer='project.edit.mako',
             permission="edit")
def project_edit(request):
    id = request.matchdict['project']
    project = DBSession.query(Project).get(id)

    licenses = DBSession.query(License).all()
    if 'form.submitted' in request.params:

        for locale, translation in project.translations.iteritems():
            with project.force_locale(locale):
                for field in ['name', 'short_description', 'description',
                              'instructions', 'per_task_instructions']:
                    translated = '_'.join([field, locale])
                    if translated in request.params:
                        setattr(project, field, request.params[translated])
                DBSession.add(project)

        for p in ['changeset_comment', 'entities_to_map', 'imagery']:
            if p in request.params:
                setattr(project, p, request.params[p])

        if 'license_id' in request.params and \
                request.params['license_id'] != "":
            license_id = int(request.params['license_id'])
            license = DBSession.query(License).get(license_id)
            project.license = license

        if 'private' in request.params and \
                request.params['private'] == 'on':
            project.private = True
        else:
            project.private = False

        project.priority = request.params['priority']

        if 'josm_preset' in request.params:
            josm_preset = request.params.get('josm_preset')
            if hasattr(josm_preset, 'value'):
                project.josm_preset = josm_preset.value.decode('UTF-8')

        DBSession.add(project)
        return HTTPFound(location=route_path('project', request,
                         project=project.id))

    return dict(page_id='project_edit', project=project, licenses=licenses)


@view_config(route_name='project_contributors', renderer='json')
def project_contributors(request):
    id = request.matchdict['project']
    project = DBSession.query(Project).get(id)

    return get_contributors(project)


@view_config(route_name='project_stats', renderer='json')
def project_stats(request):
    id = request.matchdict['project']
    project = DBSession.query(Project).get(id)

    return get_stats(project)


@view_config(route_name="project_check_for_update", renderer='json')
def check_for_updates(request):
    id = request.matchdict['project']
    interval = request.GET['interval']
    date = datetime.datetime.utcnow() \
        - datetime.timedelta(0, 0, 0, int(interval))
    updated = []

    tasks = DBSession.query(Task) \
                     .filter(Task.project_id == id, Task.date > date) \
                     .all()
    for task in tasks:
        updated.append(task.to_feature())

    tasks_lock = DBSession.query(TaskLock) \
        .filter(TaskLock.project_id == id, TaskLock.date > date) \
        .all()
    for lock in tasks_lock:
        updated.append(lock.task.to_feature())

    states = DBSession.query(TaskState) \
        .filter(TaskState.project_id == id, TaskState.date > date) \
        .all()
    for state in states:
        updated.append(state.task.to_feature())

    if len(updated) > 0:
        return dict(update=True, updated=updated)
    return dict(update=False)


@view_config(route_name="project_tasks_json", renderer='json',
             http_cache=0)
def project_tasks_json(request):
    id = request.matchdict['project']
    project = DBSession.query(Project).get(id)

    tasks = DBSession.query(Task) \
                     .filter(Task.project_id == project.id) \
                     .options(joinedload(Task.cur_state)) \
                     .options(joinedload(Task.cur_lock)) \

    return FeatureCollection([task.to_feature() for task in tasks])


@view_config(route_name="project_user_add", renderer='json',
             permission="edit")
def project_user_add(request):
    id = request.matchdict['project']
    project = DBSession.query(Project).get(id)

    username = request.matchdict['user']
    user = DBSession.query(User).filter(User.username == username).one()

    project.allowed_users.append(user)
    DBSession.add(project)

    return dict(user=user.as_dict())


@view_config(route_name="project_user_delete", renderer='json',
             permission="edit")
def project_user_delete(request):
    id = request.matchdict['project']
    project = DBSession.query(Project).get(id)

    user_id = request.matchdict['user']
    user = DBSession.query(User).get(user_id)

    project.allowed_users.remove(user)
    DBSession.add(project)

    return dict()


@view_config(route_name='project_preset')
def project_preset(request):
    id = request.matchdict['project']
    project = DBSession.query(Project).get(id)

    response = Response()
    response.text = project.josm_preset
    response.content_disposition = \
        'attachment; filename=hotosm_tasking_manager_project_%s.xml' \
        % project.id
    response.content_type = 'application/x-josm-preset'
    return response


def get_contributors(project):
    """ get the list of contributors and the tasks they worked on """

    # filter on tasks with state DONE
    filter = and_(
        TaskState.project_id == project.id,
        TaskState.state == TaskState.state_done
    )

    tasks = DBSession.query(TaskState.id, User.username) \
                     .join(TaskState.user) \
                     .filter(filter) \
                     .order_by(TaskState.user_id) \
                     .all()

    contributors = {}
    for username, tasks in itertools.groupby(tasks, key=lambda t: t.username):
        contributors[username] = [task[0] for task in tasks]

    return contributors


def get_stats(project):
    """
    the changes to create a chart with
    """

    total = DBSession.query(func.sum(ST_Area(Task.geometry))) \
        .filter(
            Task.cur_state.has(TaskState.state != TaskState.state_removed)
        ) \
        .scalar()

    subquery = DBSession.query(
        TaskState.state,
        TaskState.date,
        ST_Area(Task.geometry).label('area'),
        func.lag(TaskState.state).over(
            partition_by=(
                TaskState.task_id,
                TaskState.project_id
            ),
            order_by=TaskState.date
        ).label('prev_state')
    ).join(Task).filter(TaskState.project_id == project.id) \
     .order_by(TaskState.date)

    tasks = subquery.all()
    log.debug('Number of tiles: %s', len(tasks))
    stats = [[project.created.isoformat(), 0, 0]]
    done = 0
    validated = 0

    # for every day count number of changes and aggregate changed tiles
    for task in tasks:
        if task.state == TaskState.state_done:
            done += task.area
        if task.state == TaskState.state_invalidated:
            if task.prev_state == TaskState.state_done:
                done -= task.area
            elif task.prev_state == TaskState.state_validated:
                validated -= task.area
        if task.state == TaskState.state_validated:
            validated += task.area
            done -= task.area

        # append a day to the stats and add total number of 'done' tiles and a
        # copy of a current tile_changes list
        stats.append([task.date.isoformat(), done, validated])

    return {"total": total, "stats": stats}
