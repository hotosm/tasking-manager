from pyramid.view import view_config
from pyramid.url import route_url
from pyramid.httpexceptions import (
    HTTPFound,
    HTTPUnauthorized
)
from ..models import (
    DBSession,
    User,
)

from pyramid.security import authenticated_userid


@view_config(route_name='users', renderer='users.mako')
def users(request):
    users = DBSession.query(User).all()

    return dict(page_id="users", users=users)


@view_config(route_name='user_messages', renderer='user.messages.mako')
def user_messages(request):

    user_id = authenticated_userid(request)

    if not user_id:
        raise HTTPUnauthorized()
    DBSession.query(User).get(user_id)

    comments = []
    return dict(page_id="messages", comments=comments)


@view_config(route_name='user_admin', permission="admin")
def user_admin(request):

    id = request.matchdict['id']

    user = DBSession.query(User).get(id)
    user.admin = not user.admin
    DBSession.flush()

    return HTTPFound(location=route_url("user", request,
                                        username=user.username))


@view_config(route_name='user', renderer='user.mako')
def user(request):

    username = request.matchdict['username']

    user = DBSession.query(User).filter(User.username == username).one()
    return dict(page_id="user", contributor=user)
