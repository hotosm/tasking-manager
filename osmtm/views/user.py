from pyramid.view import view_config
from pyramid.url import route_path
from pyramid.httpexceptions import (
    HTTPFound,
    HTTPUnauthorized,
    HTTPBadRequest,
)
from ..models import (
    DBSession,
    User,
    Project,
    TaskState,
    Message,
)
from webhelpers.paginate import (
    PageURL_WebOb,
    Page
)

from pyramid.security import authenticated_userid
from sqlalchemy import func, desc
from sqlalchemy.sql.expression import and_
from sqlalchemy.orm.exc import NoResultFound

import urllib2
from xml.dom import minidom


@view_config(route_name='users', renderer='users.mako')
def users(request):
    users = DBSession.query(User).all()
    users.sort(key=lambda user: user.username)
    users.sort(key=lambda user:
               user.is_admin or user.is_project_manager, reverse=True)

    page = int(request.params.get('page', 1))
    page_url = PageURL_WebOb(request)
    paginator = Page(users, page, url=page_url, items_per_page=40)

    return dict(page_id="users", users=users, paginator=paginator)


@view_config(route_name='users_json', renderer='json')
def users_json(request):
    query = DBSession.query(User).order_by(User.username)

    if 'q' in request.params:
        q = request.params.get('q')
        query = query.filter(User.username.ilike('%' + q + '%')).limit(10)

    return [u.username for u in query.all()]


@view_config(route_name='user_messages', http_cache=0,
             renderer='user.messages.mako')
def user_messages(request):

    user_id = authenticated_userid(request)

    if not user_id:
        raise HTTPUnauthorized()

    messages = DBSession.query(Message) \
                        .filter(Message.to_user_id == user_id) \
                        .order_by(Message.date.desc())
    return dict(page_id="messages", messages=messages)


@view_config(route_name='user_admin', permission="user_edit")
def user_admin(request):
    id = request.matchdict['id']
    user = DBSession.query(User).get(id)

    _ = request.translate
    user_id = authenticated_userid(request)
    if user.id == int(user_id):
        raise HTTPBadRequest(
            _('You probably don\'t want to remove your privileges'))

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

    user = check_user_name(user)
    creation_date, changeset_count = get_addl_user_info(user.id)

    # username has changed
    if user.username != username:
        return HTTPFound(location=route_path('user', request,
                                             username=user.username))

    projects = __get_projects(user.id)
    return dict(page_id="user", contributor=user, projects=projects,
                 creation_date=creation_date, changeset_count=changeset_count)


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


def check_user_name(user):
    ''' Get the display_name from OSM API '''
    try:
        url = 'http://www.openstreetmap.org/api/0.6/user/%s' % user.id
        usock = urllib2.urlopen(url)
        xmldoc = minidom.parse(usock)
        user_el = xmldoc.getElementsByTagName('user')[0]
        display_name = user_el.getAttribute('display_name')

        if user.username != display_name:
            user.username = display_name
            DBSession.add(user)
            DBSession.flush()
    except:
        # don't lock application if no response can be received from OSM API
        pass

    return user


def username_to_userid(username):
    ''' Looks for a username and returns corresponding id '''
    id_ = DBSession.query(User.id).filter(User.username == username).scalar()

    return str(id_) if id_ else username


def get_addl_user_info(user_id):
    ''' Get the number of changesets by a user from OSM API.'''
    try:
        url = 'http://www.openstreetmap.org/api/0.6/user/%s' % user_id
        usock = urllib2.urlopen(url)
        xmldoc = minidom.parse(usock)
        user_el = xmldoc.getElementsByTagName('user')[0]
        creation_date = user_el.getAttribute('account_created')

        changesets_el = xmldoc.getElementsByTagName('changesets')[0]
        changesets_count = changesets_el.getAttribute('count')

    except:
        # don't lock application if no reponse can be received from OSM API
        pass

    return creation_date, changesets_count
