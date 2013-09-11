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


    projects = DBSession.query(Project).order_by(desc(Project.id))
    return dict(page_id="home", projects=projects,)
