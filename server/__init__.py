import logging
import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_oauthlib.client import OAuth
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy
from logging.handlers import RotatingFileHandler

db = SQLAlchemy()
migrate = Migrate()
oauth = OAuth()

osm = oauth.remote_app(
    'osm',
    app_key='OSM_OAUTH_SETTINGS'
)

# Import all models so that they are registered with SQLAlchemy
from server.models.postgis import *  # noqa


def create_app(env=None):
    """
    Bootstrap function to initialise the Flask app and config
    :return: Initialised Flask app
    """
    app = Flask(__name__)

    if env is None:
        env = os.getenv('TM_ENV', 'Dev')  # default to Dev if config environment var not set

    app.config.from_object(f'server.config.{env}Config')

    initialise_logger(app)
    app.logger.info(f'HOT Tasking Manager App Starting Up, Environment = {env}')

    db.init_app(app)
    migrate.init_app(app, db)

    app.logger.debug('Initialising Blueprints')
    from .web import main as main_blueprint
    from .web import swagger as swagger_blueprint
    app.register_blueprint(main_blueprint)
    app.register_blueprint(swagger_blueprint)

    init_flask_restful_routes(app)

    CORS(app)  # Enables CORS on all API routes, meaning API is callable from anywhere

    app.secret_key = app.config['SECRET_KEY']  # Required by itsdangeroud, Flask-OAuthlib for creating entropy
    oauth.init_app(app)

    return app


def initialise_logger(app):
    """
    Read environment config then initialise a 2MB rotating log.  Prod Log Level can be reduced to help diagnose Prod
    only issues.
    """

    log_dir = app.config['LOG_DIR']
    log_level = app.config['LOG_LEVEL']

    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    file_handler = RotatingFileHandler(log_dir + '/tasking-manager.log', 'a', 2 * 1024 * 1024, 3)
    file_handler.setLevel(log_level)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))

    app.logger.addHandler(file_handler)
    app.logger.setLevel(log_level)


def init_flask_restful_routes(app):
    """
    Define the routes the API exposes using Flask-Restful.  See docs here
    http://flask-restful-cn.readthedocs.org/en/0.3.5/quickstart.html#endpoints
    """
    app.logger.debug('Initialising API Routes')
    api = Api(app)

    from server.api.health_check_api import HealthCheckAPI
    from server.api.mapping_apis import MappingTaskAPI, LockTaskForMappingAPI, UnlockTaskForMappingAPI
    from server.api.project_admin_api import ProjectAdminAPI
    from server.api.project_apis import ProjectAPI, ProjectSearchAPI, HasUserTaskOnProject
    from server.api.swagger_docs_api import SwaggerDocsAPI
    from server.api.authentication_apis import LoginAPI, OAuthAPI
    from server.api.user_apis import UserAPI, UserOSMAPI
    from server.api.validator_apis import LockTasksForValidationAPI, UnlockTasksAfterValidationAPI

    api.add_resource(SwaggerDocsAPI,                '/api/docs')
    api.add_resource(HealthCheckAPI,                '/api/health-check')
    api.add_resource(ProjectSearchAPI,              '/api/v1/project/search')
    api.add_resource(ProjectAPI,                    '/api/v1/project/<int:project_id>')
    api.add_resource(HasUserTaskOnProject,          '/api/v1/project/<int:project_id>/has-user-locked-task')
    api.add_resource(LockTaskForMappingAPI,         '/api/v1/project/<int:project_id>/task/<int:task_id>/lock-for-mapping')
    api.add_resource(ProjectAdminAPI,               '/api/v1/admin/project', endpoint="create_project", methods=['PUT'])
    api.add_resource(ProjectAdminAPI,               '/api/v1/admin/project/<int:project_id>', methods=['GET', 'POST'])
    api.add_resource(MappingTaskAPI,                '/api/v1/project/<int:project_id>/task/<int:task_id>')
    api.add_resource(UnlockTaskForMappingAPI,       '/api/v1/project/<int:project_id>/task/<int:task_id>/unlock-after-mapping')
    api.add_resource(LockTasksForValidationAPI,     '/api/v1/project/<int:project_id>/lock-for-validation')
    api.add_resource(UnlockTasksAfterValidationAPI, '/api/v1/project/<int:project_id>/unlock-after-validation')
    api.add_resource(UserAPI,                       '/api/v1/user/<string:username>')
    api.add_resource(UserOSMAPI,                    '/api/v1/user/<string:username>/osm-details')
    api.add_resource(LoginAPI,                      '/api/v1/auth/login')
    api.add_resource(OAuthAPI,                      '/api/v1/auth/oauth-callback')
