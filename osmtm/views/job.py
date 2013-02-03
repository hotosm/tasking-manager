from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound
from pyramid.url import route_url
from ..models import (
    DBSession,
    Job,
    )

import mapnik

@view_config(route_name='job', renderer='job.mako', http_cache=0)
def job(request):
    id = request.matchdict['job']
    job = DBSession.query(Job).get(id)

    if job is None:
        request.session.flash("Sorry, this job doesn't  exist")
        return HTTPFound(location = route_url('home', request))

    return dict(job=job)

@view_config(route_name='job_new', renderer='job.new.mako',)
def job_new(request):
    if 'form.submitted' in request.params:
        job = Job(
            request.params['title'],
            request.params['geometry']
        )

        DBSession.add(job)
        DBSession.flush()
        return HTTPFound(location = route_url('job_edit', request, job=job.id))
    return {}

@view_config(route_name='job_edit', renderer='job.edit.mako', )
def job_edit(request):
    id = request.matchdict['job']
    job = DBSession.query(Job).get(id)

    if 'form.submitted' in request.params:
        job.title = request.params['title']
        job.short_description = request.params['short_description']
        job.description = request.params['description']

        DBSession.add(job)
        return HTTPFound(location = route_url('job', request, job=job.id))

    return dict(job=job)


import mapnik

@view_config(route_name='job_mapnik', renderer='mapnik')
def job_mapnik(request):
    x = request.matchdict['x']
    y = request.matchdict['y']
    z = request.matchdict['z']
    job = request.matchdict['job']

    query = '(SELECT * FROM jobs WHERE id = %s) as jobs' % (str(job))
    layer = mapnik.Layer('Job from PostGIS')
    layer.datasource = mapnik.PostGIS(
        host='localhost',
        user='www-data',
        dbname='osmtm',
        table=query
    )
    layer.styles.append('job')

    return layer
