from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound, HTTPBadRequest
from pyramid.url import route_url
from ..models import (
    DBSession,
    Map,
    Task
    )

@view_config(route_name='map', renderer='map.mako', http_cache=0)
def map(request):
    id = request.matchdict['map']
    map = DBSession.query(Map).get(id)

    if map is None:
        request.session.flash("Sorry, this map doesn't  exist")
        return HTTPFound(location = route_url('home', request))

    return dict(map=map)

@view_config(route_name='map_new', renderer='map.new.mako',)
def map_new(request):
    if 'form.submitted' in request.params:
        map = Map(
            request.params['title'],
            request.params['geometry']
        )

        DBSession.add(map)
        DBSession.flush()
        return HTTPFound(location = route_url('map_edit', request, map=map.id))
    return {}

@view_config(route_name='map_edit', renderer='map.edit.mako', )
def map_edit(request):
    id = request.matchdict['map']
    map = DBSession.query(Map).get(id)

    if 'form.submitted' in request.params:
        map.title = request.params['title']
        map.short_description = request.params['short_description']
        map.description = request.params['description']

        DBSession.add(map)
        return HTTPFound(location = route_url('map', request, map=map.id))

    return dict(map=map)
