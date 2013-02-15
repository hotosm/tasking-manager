from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound, HTTPBadRequest
from pyramid.url import route_url

from ..models import (
    DBSession,
    Map,
    Task
    )

import mapnik

@view_config(route_name='task_new', renderer='task.new.jade')
def task_new(request):
    if 'form.submitted' in request.params:
        map_id = request.matchdict['map']
        map = DBSession.query(Map).get(int(map_id))
        task = Task(
            map,
            request.params['short_description'],
            int(request.params['zoom']),
        )
        DBSession.add(task)
        DBSession.flush()
        return HTTPFound(location = route_url('tasks_manage', request, map=map.id))
    return dict(title='task_new')

@view_config(route_name='tasks_manage', renderer='task.manage.jade')
def tasks_manage(request):
    map_id = request.matchdict['map']
    map = DBSession.query(Map).get(map_id)
    tasks = DBSession.query(Task).filter(Task.map_id==map_id).all()
    return {'title': 'tasks_manage', 'map': map, 'tasks': tasks}

@view_config(route_name='task_mapnik', renderer='mapnik')
def task_mapnik(request):
    map_id = request.matchdict['map']
    x = request.matchdict['x']
    y = request.matchdict['y']
    z = request.matchdict['z']
    task_id = request.matchdict['task']

    task = DBSession.query(Task).get(task_id)
    if task.map_id != int(map_id):
        # map and task don't match
        return HTTPBadRequest('Map and Task don\'t match')

    query = '(SELECT * FROM tiles WHERE task_id = %s) as tiles' % (str(task_id))
    tiles = mapnik.Layer('Map tiles from PostGIS')
    tiles.datasource = mapnik.PostGIS(
        host='localhost',
        user='www-data',
        dbname='osmtm',
        table=query
    )
    tiles.styles.append('tile')
    tiles.srs = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over"

    return [tiles]
