from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound
from pyramid.url import route_url
from ..models import (
    DBSession,
    Map,
    Task
    )

import mapnik

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


import mapnik

@view_config(route_name='task_mapnik', renderer='mapnik')
def task_mapnik(request):
    x = request.matchdict['x']
    y = request.matchdict['y']
    z = request.matchdict['z']
    id = request.matchdict['task']

    task = DBSession.query(Task).get(id)

    query = '(SELECT * FROM maps WHERE id = %s) as maps' % (str(task.map_id))
    map_layer = mapnik.Layer('Map from PostGIS')
    map_layer.datasource = mapnik.PostGIS(
        host='localhost',
        user='www-data',
        dbname='osmtm',
        table=query
    )
    map_layer.styles.append('map')

    query = '(SELECT * FROM tiles WHERE task_id = %s) as tiles' % (str(id))
    tiles = mapnik.Layer('Map tiles from PostGIS')
    tiles.datasource = mapnik.PostGIS(
        host='localhost',
        user='www-data',
        dbname='osmtm',
        table=query
    )
    tiles.styles.append('tile')
    tiles.srs = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over"

    return [map_layer, tiles]
