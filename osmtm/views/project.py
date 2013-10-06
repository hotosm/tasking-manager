from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound, HTTPBadRequest
from pyramid.url import route_url
from ..models import (
    DBSession,
    Project,
    Area,
    User,
    TaskHistory,
    License,
    )
from pyramid.security import authenticated_userid

from pyramid.i18n import get_locale_name
from sqlalchemy.sql.expression import and_

import mapnik

@view_config(route_name='project', renderer='project.mako', http_cache=0)
def project(request):
    id = request.matchdict['project']
    project = DBSession.query(Project).get(id)

    if project is None:
        request.session.flash("Sorry, this project doesn't  exist")
        return HTTPFound(location = route_url('home', request))

    locale = get_locale_name(request)
    project.get_locale = lambda: locale

    filter = and_(TaskHistory.project_id==id, TaskHistory.update!=None)
    history = DBSession.query(TaskHistory). \
            filter(filter). \
            order_by(TaskHistory.update.desc()). \
            limit(10).all()
    return dict(page_id='project', project=project,
            history=history,)


@view_config(route_name='project_new', renderer='project.new.mako',
        permission="add")
def project_new(request):
    if 'form.submitted' in request.params:
        user_id = authenticated_userid(request)
        user = DBSession.query(User).get(user_id)

        area = Area(
            request.params['geometry']
        )

        DBSession.add(area)
        DBSession.flush()

        project = Project(
            request.params['name'],
            area,
            user
        )

        DBSession.add(project)
        DBSession.flush()
        return HTTPFound(location = route_url('project_partition', request, project=project.id))
    return dict(page_id='project_new')

@view_config(route_name='project_partition', renderer='project.partition.mako',
        permission="edit")
def project_partition(request):
    id = request.matchdict['project']
    project = DBSession.query(Project).get(id)

    if 'form.submitted' in request.params:
        zoom = int(request.params['zoom'])
        project.auto_fill(zoom)

        return HTTPFound(location = route_url('project_edit', request, project=project.id))

    return dict(page_id='project_partition', project=project)

@view_config(route_name='project_edit', renderer='project.edit.mako',
        permission="edit")
def project_edit(request):
    id = request.matchdict['project']
    project = DBSession.query(Project).get(id)

    licenses = DBSession.query(License).all()
    if 'form.submitted' in request.params:

        for locale, translation in project.translations.iteritems():
            with project.force_locale(locale):
                for field in ['name', 'short_description', 'description']:
                    translated = '_'.join([field, locale])
                    if translated in request.params:
                        setattr(project, field, request.params[translated])
                DBSession.add(project)

        if request.params['imagery'] != "":
            project.imagery = request.params['imagery']

        if request.params['license_id'] != "":
            license_id = int(request.params['license_id'])
            license = DBSession.query(License).get(license_id)
            project.license = license

        DBSession.add(project)
        return HTTPFound(location = route_url('project', request, project=project.id))

    return dict(page_id='project_edit', project=project, licenses=licenses)

@view_config(route_name='project_mapnik', renderer='mapnik')
def project_mapnik(request):
    x = request.matchdict['x']
    y = request.matchdict['y']
    z = request.matchdict['z']
    project_id = request.matchdict['project']

    query = '(SELECT * FROM tasks WHERE project_id = %s) as tasks' % (str(project_id))
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
