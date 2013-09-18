from pyramid.view import view_config

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
    if DBSession.query(User.username).count() == 0:
        request.override_renderer = 'start.mako'
        return dict(page_id="start")

    projects = DBSession.query(Project).order_by(desc(Project.id)).all()
    return dict(page_id="home", projects=projects,)

@view_config(route_name="user_prefered_editor", renderer='json')
def user_prefered_editor(request):
    editor = request.matchdict['editor']
    request.response.set_cookie('prefered_editor', value=editor, max_age=20*7*24*60*60)

    return dict()
