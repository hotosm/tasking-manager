from pyramid.view import view_config

from sqlalchemy import (
    desc,
    )

from ..models import (
    DBSession,
    Project,
    )

@view_config(route_name='home', renderer='home.jade')
def home(request):

    projects = DBSession.query(Project).order_by(desc(Project.id))
    return dict(page_id="home", projects=projects,)
