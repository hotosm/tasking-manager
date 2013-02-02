from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound
from pyramid.url import route_url
from ..models import (
    DBSession,
    Job,
    )

@view_config(route_name='job_new', renderer='job.new.mako',)
def job_new(request):
    if 'form.submitted' in request.params:
        job = Job(
            request.params['title'],
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
        return HTTPFound(location = route_url('job_edit', request, job=job.id))

    return dict(job=job)
