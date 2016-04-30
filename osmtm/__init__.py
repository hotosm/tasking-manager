import bleach
from pyramid.config import Configurator
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.session import UnencryptedCookieSessionFactoryConfig

from sqlalchemy import engine_from_config

from .models import (
    DBSession,
    Base,
)

from .utils import load_local_settings

from sqlalchemy_i18n.manager import translation_manager

from .security import (
    RootFactory,
    group_membership,
)

from .views.task import check_task_expiration

from apscheduler.schedulers.background import BackgroundScheduler
scheduler = BackgroundScheduler()
scheduler.start()


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    settings['mako.directories'] = 'osmtm:templates'
    load_local_settings(settings)

    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)
    Base.metadata.bind = engine

    authn_policy = AuthTktAuthenticationPolicy(
        secret='super_secret',
        callback=group_membership)
    authz_policy = ACLAuthorizationPolicy()
    config = Configurator(settings=settings,
                          root_factory=RootFactory,
                          authentication_policy=authn_policy,
                          authorization_policy=authz_policy)
    # fixes backwards incompatibilities when running Pyramid 1.5a
    # https://pypi.python.org/pypi/pyramid#features
    config.include('pyramid_mako')

    # pyramid_tm uses the transaction module to begin/commit/rollback
    # transaction when requests begin/end.
    config.include('pyramid_tm')

    # enable exception logger
    config.include('pyramid_exclog')

    session_factory = UnencryptedCookieSessionFactoryConfig('itsasecret')
    config.set_session_factory(session_factory)

    config.add_static_view('static', 'static', cachebust=True)
    config.add_route('home', '/')
    config.add_route('home_json', '/projects.json')
    config.add_route('about', '/about')
    config.add_route('login', '/login')
    config.add_route('logout', '/logout')
    config.add_route('oauth_callback', '/oauth_callback')
    config.add_route('project_new', '/project/new')
    config.add_route('project_new_grid', '/project/new/grid')
    config.add_route('project_new_arbitrary', '/project/new/arbitrary')
    config.add_route('project_grid_simulate', '/project/grid_simulate')
    config.add_route('project_json', '/project/{project:\d+}.json')
    config.add_route('project', '/project/{project:\d+}')
    config.add_route('project_edit', '/project/{project:\d+}/edit')
    config.add_route('project_publish', '/project/{project:\d+}/publish')
    config.add_route('project_check_for_update',
                     '/project/{project:\d+}/check_for_updates')
    config.add_route('project_contributors',
                     '/project/{project:\d+}/contributors', xhr=True)
    config.add_route('project_stats', '/project/{project:\d+}/stats')
    config.add_route('project_tasks_json', '/project/{project:\d+}/tasks.json')
    config.add_route('project_user_add', '/project/{project:\d+}/user/{user}',
                     request_method="PUT")
    config.add_route('project_user_delete',
                     '/project/{project:\d+}/user/{user}',
                     request_method="DELETE")
    config.add_route('project_preset', '/project/{project:\d+}/preset')
    config.add_route('project_users', '/project/{project:\d+}/users')
    config.add_route('project_invalidate_all',
                     '/project/{project:\d+}/invalidate_all')
    config.add_route('project_message_all',
                     '/project/{project:\d+}/message_all')
    config.add_route('task_random', '/project/{project:\d+}/random', xhr=True)
    config.add_route('task_empty', '/project/{project:\d+}/task/empty',
                     xhr=True)
    config.add_route('task_xhr', '/project/{project:\d+}/task/{task:\d+}',
                     xhr=True)
    config.add_route('task_done',
                     '/project/{project:\d+}/task/{task:\d+}/done', xhr=True)
    config.add_route('task_lock',
                     '/project/{project:\d+}/task/{task:\d+}/lock', xhr=True)
    config.add_route('task_unlock',
                     '/project/{project:\d+}/task/{task:\d+}/unlock', xhr=True)
    config.add_route('task_split',
                     '/project/{project:\d+}/task/{task:\d+}/split', xhr=True)
    config.add_route('task_validate',
                     '/project/{project:\d+}/task/{task:\d+}/validate',
                     xhr=True)
    config.add_route('task_comment',
                     '/project/{project:\d+}/task/{task:\d+}/comment',
                     xhr=True)
    config.add_route('task_gpx', '/project/{project:\d+}/task/{task:\d+}.gpx')
    config.add_route('task_osm', '/project/{project:\d+}/task/{task:\d+}.osm')
    config.add_route('task_assign',
                     '/project/{project:\d+}/task/{task:\d+}/user/{user}',
                     xhr=True)
    config.add_route('task_assign_delete',
                     '/project/{project:\d+}/task/{task:\d+}/user', xhr=True,
                     request_method="DELETE")
    config.add_route('task_difficulty',
                     '/project/{project:\d+}/task/{task:\d+}/difficulty/' +
                     '{difficulty:\d+}', xhr=True)
    config.add_route('task_difficulty_delete',
                     '/project/{project:\d+}/task/{task:\d+}/difficulty',
                     xhr=True, request_method='DELETE')

    config.add_route('users', '/users')
    config.add_route('users_json', '/users.json')
    config.add_route('user_messages', '/user/messages')
    config.add_route('user', '/user/{username}')
    config.add_route('user_admin', '/user/{id:\d+}/admin')
    config.add_route('user_project_manager', '/user/{id:\d+}/project_manager')
    config.add_route('user_prefered_editor',
                     '/user/prefered_editor/{editor}', xhr=True)
    config.add_route('user_prefered_language',
                     '/user/prefered_language/{language}', xhr=True)
    config.add_route('licenses', '/licenses')
    config.add_route('license_new', '/license/new')
    config.add_route('license', '/license/{license:\d+}')
    config.add_route('license_edit', '/license/{license:\d+}/edit')
    config.add_route('license_delete', '/license/{license:\d+}/delete')

    config.add_route('message_read', '/message/read/{message:\d+}')

    config.add_translation_dirs('osmtm:locale')
    config.set_locale_negotiator('osmtm.i18n.custom_locale_negotiator')

    translation_manager.options.update({
        'locales': settings['available_languages'].split(),
        'get_locale_fallback': True
    })

    config.scan(ignore=['osmtm.tests', 'osmtm.scripts'])

    bleach.ALLOWED_TAGS.append(u'p')
    bleach.ALLOWED_TAGS.append(u'pre')

    scheduler.add_job(check_task_expiration, 'interval', seconds=5,
                      replace_existing=True)

    return config.make_wsgi_app()
