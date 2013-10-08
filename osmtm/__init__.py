from pyramid.config import Configurator
from sqlalchemy import engine_from_config
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.session import UnencryptedCookieSessionFactoryConfig

from .models import (
    DBSession,
    Base,
    )

from .resources import (
    MapnikRendererFactory
    )

from sqlalchemy_i18n.manager import translation_manager

from .security import (
    RootFactory,
    group_membership,
    )

def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    settings['mako.directories'] = 'osmtm:templates'

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

    session_factory = UnencryptedCookieSessionFactoryConfig('itsasecret')
    config.set_session_factory(session_factory)

    config.add_static_view('static', 'static', cache_max_age=3600)
    config.add_route('home', '/')
    config.add_route('login', '/login')
    config.add_route('logout', '/logout')
    config.add_route('oauth_callback', '/oauth_callback')
    config.add_route('project_new', '/project/new')
    config.add_route('project', '/project/{project}')
    config.add_route('project_edit', '/project/{project}/edit')
    config.add_route('project_partition', '/project/{project}/partition')
    config.add_route('project_mapnik', '/project/{project}/{z}/{x}/{y}.{format}')
    config.add_route('task_xhr', '/task/{id}', xhr=True)
    config.add_route('task_done', '/task/{id}/done', xhr=True)
    config.add_route('task_lock', '/task/{id}/lock', xhr=True)
    config.add_route('task_unlock', '/task/{id}/unlock', xhr=True)
    config.add_route('task_split', '/task/{id}/split', xhr=True)
    config.add_route('task_invalidate', '/task/{id}/invalidate', xhr=True)
    config.add_route('users', '/users')
    config.add_route('user', '/user/{username}')
    config.add_route('user_admin', '/user/{id}/admin')
    config.add_route('user_messages', '/user/messages')
    config.add_route('user_prefered_editor', '/user/prefered_editor/{editor}', xhr=True)
    config.add_route('user_prefered_language', '/user/prefered_language/{language}', xhr=True)
    config.add_route('licenses', '/licenses')
    config.add_route('license_new', '/license/new')
    config.add_route('license', '/license/{license}')
    config.add_route('license_edit', '/license/{license}/edit')
    config.add_route('license_delete', '/license/{license}/delete')
    config.add_route('import_osm', '/import_osm')

    config.add_renderer('mapnik', MapnikRendererFactory)

    config.add_translation_dirs('osmtm:locale')
    config.set_locale_negotiator('osmtm.i18n.custom_locale_negotiator')

    translation_manager.options.update({
        'locales': settings['available_languages'].split(),
        'get_locale_fallback': True
    })

    config.scan()
    return config.make_wsgi_app()
