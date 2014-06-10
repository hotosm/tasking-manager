from pyramid.view import view_config
from pyramid.url import route_path
from pyramid.httpexceptions import (
    HTTPFound,
    HTTPUnauthorized
)
from ..models import (
    DBSession,
    User,
    Project,
    TaskState,
)

from pyramid.security import authenticated_userid
from sqlalchemy import func, desc
from sqlalchemy.sql.expression import and_
from sqlalchemy.orm.exc import NoResultFound


@view_config(route_name='users', renderer='users.mako')
def users(request):
    users = DBSession.query(User).all()

    return dict(page_id="users", users=users)


@view_config(route_name='users_json', renderer='json')
def users_json(request):
    users = DBSession.query(User).all()

    r = []
    for user in users:
        r.append(user.username)

    return r


@view_config(route_name='user_messages', renderer='user.messages.mako')
def user_messages(request):

    user_id = authenticated_userid(request)

    if not user_id:
        raise HTTPUnauthorized()
    DBSession.query(User).get(user_id)

    comments = []
    return dict(page_id="messages", comments=comments)


@view_config(route_name='user_admin', permission="user_edit")
def user_admin(request):
    id = request.matchdict['id']
    user = DBSession.query(User).get(id)

    user.role = User.role_admin if not user.is_admin else None
    DBSession.flush()

    return HTTPFound(location=route_path("user", request,
                                         username=user.username))


@view_config(route_name='user_project_manager', permission="user_edit")
def user_project_manager(request):
    id = request.matchdict['id']
    user = DBSession.query(User).get(id)

    user.role = User.role_project_manager if not user.is_project_manager  \
        else None
    DBSession.flush()

    return HTTPFound(location=route_path("user", request,
                                         username=user.username))


@view_config(route_name='user', renderer='user.mako')
def user(request):

    username = request.matchdict['username']

    try:
        user = DBSession.query(User).filter(User.username == username).one()
    except NoResultFound:
        _ = request.translate
        request.session.flash(_("Sorry, this user doesn't  exist"))
        return HTTPFound(location=route_path('users', request))

    projects = __get_projects(user.id)
    return dict(page_id="user", contributor=user, projects=projects)


def __get_projects(user_id):
    """ get the tiles that changed """
    filter = and_(TaskState.state == TaskState.state_done,
                  TaskState.user_id == user_id,
                  TaskState.project_id == Project.id)
    projects = DBSession.query(Project, func.count(TaskState.user_id)) \
                        .filter(filter) \
                        .group_by(Project.id) \
                        .order_by(desc(Project.id)) \
                        .all()
    return [{"project": p[0], "count": int(p[1])} for p in projects]
