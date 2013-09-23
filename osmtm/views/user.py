from pyramid.view import view_config
from pyramid.httpexceptions import (
    HTTPFound,
    HTTPBadRequest,
    HTTPUnauthorized
    )
from ..models import (
    DBSession,
    Task,
    TaskHistory,
    User
    )

@view_config(route_name='user_messages', renderer='user.messages.mako')
def user_messages(request):
    return dict(page_id="messages")
