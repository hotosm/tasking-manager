from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound

from sqlalchemy import (
    desc,
    )

from ..models import (
    DBSession,
    Project,
    User,
    )

@view_config(route_name='home', renderer='home.mako')
def home(request):
    # no user in the DB yet
    if DBSession.query(User.username).count() == 0:   # pragma: no cover
        request.override_renderer = 'start.mako'
        return dict(page_id="start")

    projects = DBSession.query(Project).order_by(desc(Project.id)).all()
    return dict(page_id="home", projects=projects,)

@view_config(route_name="user_prefered_editor", renderer='json')
def user_prefered_editor(request):
    editor = request.matchdict['editor']
    request.response.set_cookie('prefered_editor', value=editor, max_age=20*7*24*60*60)

    return dict()

@view_config(route_name="user_prefered_language", renderer='json')
def user_prefered_language(request):
    language = request.matchdict['language']
    request.response.set_cookie('_LOCALE_', value=language, max_age=20*7*24*60*60)
    return dict()

@view_config(context='pyramid.httpexceptions.HTTPUnauthorized')
def unauthorized(request):
    return HTTPFound(request.route_url('login', _query=[('came_from', request.url)]))
