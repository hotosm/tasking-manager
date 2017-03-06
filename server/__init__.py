import logging
import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy
from logging.handlers import RotatingFileHandler

db = SQLAlchemy()
migrate = Migrate()

# Import all models so that they are registered with SQLAlchemy
from server.models import *  # noqa


def create_app(env=None):
    """
    Bootstrap function to initialise the Flask app and config
    :return: Initialised Flask app
    """
    app = Flask(__name__)

    if env is None:
        env = os.getenv('TASKING_MANAGER_ENV', 'Dev')  # default to Dev if config environment var not set

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
    api = Api(app, default_mediatype='application/json')

    from server.api.health_check_api import HealthCheckAPI
    from server.api.projects_api import ProjectsAPI
    from server.api.swagger_docs_api import SwaggerDocsAPI

    api.add_resource(SwaggerDocsAPI, '/api/docs')
    api.add_resource(HealthCheckAPI, '/api/health-check')
    api.add_resource(ProjectsAPI,    '/api/v1/project')
