from pyramid.view import view_config
from pyramid.httpexceptions import (
    HTTPFound,
    HTTPBadRequest,
    HTTPUnauthorized
    )
from ..models import (
    DBSession,
    TaskComment,
    TaskHistory,
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
    user = DBSession.query(User).get(user_id)

    comments = DBSession.query(TaskComment).filter(TaskComment.task_history.has(prev_user_id=user.id))
    return dict(page_id="messages", comments=comments)

@view_config(route_name='user', renderer='user.mako')
def user(request):

    username = request.matchdict['username']

    user = DBSession.query(User).filter(User.username==username).one()
    return dict(page_id="user", user=user)
