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


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    settings['mako.directories'] = 'osmtm:templates'

    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)
    Base.metadata.bind = engine

    authn_policy = AuthTktAuthenticationPolicy(
            secret='super_secret')
    authz_policy = ACLAuthorizationPolicy()
    config = Configurator(settings=settings,
            authentication_policy=authn_policy,
            authorization_policy=authz_policy)

    session_factory = UnencryptedCookieSessionFactoryConfig('itsasecret')
    config.set_session_factory(session_factory)

    config.include('pyjade.ext.pyramid')
    config.add_static_view('static', 'static', cache_max_age=3600)
    config.add_route('home', '/')
    config.add_route('login', '/login')
    config.add_route('logout', '/logout')
    config.add_route('oauth_callback', '/oauth_callback')
    config.add_route('project_new', '/project/new')
    config.add_route('project', '/project/{project}')
    config.add_route('project_edit', '/project/{project}/edit')
    config.add_route('project_mapnik', '/project/{project}/{z}/{x}/{y}.{format}')

    config.add_renderer('mapnik', MapnikRendererFactory)

    config.scan()
    return config.make_wsgi_app()
