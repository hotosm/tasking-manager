from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound, HTTPUnauthorized

import re
import sqlalchemy
from sqlalchemy import (
    desc,
    or_,
    and_,
)

from ..models import (
    DBSession,
    Project,
    ProjectTranslation,
    User,
    TaskLock,
)

from webhelpers.paginate import (
    PageURL_WebOb,
    Page
)

from geojson import (
    FeatureCollection
)

from .task import check_task_expiration
from .project import check_project_expiration

from pyramid.security import authenticated_userid

from sqlalchemy.orm import joinedload


@view_config(route_name='home', renderer='home.mako')
def home(request):
    check_task_expiration()
    check_project_expiration()

    # no user in the DB yet
    if DBSession.query(User).filter(User.role == User.role_admin) \
                .count() == 0:   # pragma: no cover
        request.override_renderer = 'start.mako'
        return dict(page_id="start")

    paginator = get_projects(request, 10)

    return dict(page_id="home", paginator=paginator)


@view_config(route_name='home_json', renderer='json')
def home_json(request):
    request.response.content_disposition = \
        'attachment; filename="hot_osmtm.json"'
    paginator = get_projects(request, 100)
    return FeatureCollection([project.to_feature() for project in paginator])


@view_config(route_name='home_json_xhr', renderer='json')
def home_json_xhr(request):
    request.response.headerlist.append(('Access-Control-Allow-Origin', '*'))
    paginator = get_projects(request, 100)
    return FeatureCollection([project.to_feature() for project in paginator])


def get_projects(request, items_per_page):
    query = DBSession.query(Project) \
        .options(joinedload(Project.translations['en'])) \
        .options(joinedload(Project.translations[request.locale_name])) \
        .options(joinedload(Project.author)) \
        .options(joinedload(Project.area))

    user_id = authenticated_userid(request)
    user = None
    if user_id is not None:
        user = DBSession.query(User).get(user_id)

    if not user:
        filter = Project.private == False  # noqa
    elif not user.is_admin and not user.is_project_manager:
        query = query.outerjoin(Project.allowed_users)
        filter = or_(Project.private == False,  # noqa
                     User.id == user_id)
    else:
        filter = True  # make it work with an and_ filter

    if not user or (not user.is_admin and not user.is_project_manager):
        filter = and_(Project.status == Project.status_published, filter)

    if 'search' in request.params:
        s = request.params.get('search')
        PT = ProjectTranslation
        search_filter = or_(PT.name.ilike('%%%s%%' % s),
                            PT.short_description.ilike('%%%s%%' % s),
                            PT.description.ilike('%%%s%%' % s),)
        '''The below code extracts all the numerals in the
           search string as a list, if there are some it
           joins that list of number characters into a string,
           casts it as an integer and searchs to see if there
           is a project with that id. If there is, it adds
           it to the search results.'''
        digits = re.findall('\d+', s)
        if digits:
            search_filter = or_(
                ProjectTranslation.id == (int(''.join(digits))),
                search_filter)
        ids = DBSession.query(ProjectTranslation.id) \
                       .filter(search_filter) \
                       .all()
        filter = and_(Project.id.in_(ids), filter)

    # filter projects on which the current user worked on
    if request.params.get('my_projects', '') == 'on':
        ids = DBSession.query(TaskLock.project_id) \
                       .filter(TaskLock.user_id == user_id) \
                       .all()

        if len(ids) > 0:
            filter = and_(Project.id.in_(ids), filter)
        else:
            # IN-predicate  with emty sequence can be expensive
            filter = and_(False == True)  # noqa

    sort_by = 'project.%s' % request.params.get('sort_by', 'priority')
    direction = request.params.get('direction', 'asc')
    direction_func = getattr(sqlalchemy, direction, None)
    sort_by = direction_func(sort_by)

    query = query.order_by(sort_by, desc(Project.id))

    query = query.filter(filter)

    page = int(request.params.get('page', 1))
    page_url = PageURL_WebOb(request)
    paginator = Page(query, page, url=page_url, items_per_page=items_per_page)

    return paginator


@view_config(route_name='about', renderer='about.mako')
def about(request):
    return dict(page_id="about")


@view_config(route_name="user_prefered_editor", renderer='json')
def user_prefered_editor(request):
    editor = request.matchdict['editor']
    request.response.set_cookie('prefered_editor', value=editor,
                                max_age=20 * 7 * 24 * 60 * 60)

    return dict()


@view_config(route_name="user_prefered_language", renderer='json')
def user_prefered_language(request):
    language = request.matchdict['language']
    request.response.set_cookie('_LOCALE_', value=language,
                                max_age=20 * 7 * 24 * 60 * 60)
    return dict()


@view_config(context='pyramid.httpexceptions.HTTPUnauthorized')
def unauthorized(request):
    if request.is_xhr:
        return HTTPUnauthorized()
    return HTTPFound(request.route_path('login',
                                        _query=[('came_from', request.url)]))
