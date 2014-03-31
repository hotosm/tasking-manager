from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound
from pyramid.url import route_url
from ..models import (
    DBSession,
    Project,
    Area,
    User,
    Task,
    TaskHistory,
    License,
)
from pyramid.security import authenticated_userid

from pyramid.i18n import (
    get_locale_name,
)
from sqlalchemy.sql.expression import and_

from geoalchemy2 import (
    shape,
)

import datetime

import mapnik


@view_config(route_name='project', renderer='project.mako', http_cache=0)
def project(request):
    id = request.matchdict['project']
    project = DBSession.query(Project).get(id)

    if project is None:
        _ = request.translate
        request.session.flash(_("Sorry, this project doesn't  exist"))
        return HTTPFound(location=route_url('home', request))

    project.locale = get_locale_name(request)

    filter = and_(TaskHistory.project_id == id,
                  TaskHistory.state != TaskHistory.state_removed,
                  TaskHistory.update.isnot(None))
    history = DBSession.query(TaskHistory) \
                       .filter(filter) \
                       .order_by(TaskHistory.update.desc()) \
                       .limit(10).all()
    return dict(page_id='project', project=project,
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

        import shapely
        import geojson
        geometry = request.params['geometry']
        geometry = geojson.loads(geometry,
                                 object_hook=geojson.GeoJSON.to_instance)
        geometry = shapely.geometry.asShape(geometry)
        geometry = shape.from_shape(geometry, 4326)
        project.area = Area(geometry)
        project.auto_fill(zoom)

        _ = request.translate
        request.session.flash(_("Project #${project_id} created successfully",
                              mapping={'project_id': project.id}),
                              'success')
        return HTTPFound(location=route_url('project_edit', request,
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

        DBSession.add(project)
        DBSession.flush()

        try:
            input_file = request.POST['import'].file
            count = project.import_from_geojson(input_file.read())
            _ = request.translate
            request.session.flash(_("Successfully imported ${n} geometries",
                                  mapping={'n': count}),
                                  'success')
            return HTTPFound(location=route_url('project_edit', request,
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
            if p in request.params and request.params[p] != '':
                setattr(project, p, request.params[p])

        if 'license_id' in request.params and \
                request.params['license_id'] != "":
            license_id = int(request.params['license_id'])
            license = DBSession.query(License).get(license_id)
            project.license = license

        DBSession.add(project)
        return HTTPFound(location=route_url('project', request,
                         project=project.id))

    return dict(page_id='project_edit', project=project, licenses=licenses)


@view_config(route_name='project_mapnik', renderer='mapnik')
def project_mapnik(request):
    project_id = request.matchdict['project']

    query = '(SELECT * FROM tasks WHERE project_id = %s) as tasks' % \
            (str(project_id))
    tasks = mapnik.Layer('Map tasks from PostGIS')
    tasks.datasource = mapnik.PostGIS(
        host='localhost',
        user='www-data',
        dbname='osmtm',
        table=query
    )
    tasks.styles.append('tile')
    tasks.srs = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"

    return [tasks]


@view_config(route_name="project_check_for_update", renderer='json')
def check_for_updates(request):
    interval = request.GET['interval']
    date = datetime.datetime.now() - datetime.timedelta(0, 0, 0, int(interval))
    tasks = DBSession.query(Task).filter(Task.update > date).all()
    print len(tasks)
    if len(tasks) > 0:
        return dict(update=True)
    return dict(update=False)
