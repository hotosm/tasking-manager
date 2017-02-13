import logging
import os
from flask import Flask
from logging.handlers import RotatingFileHandler

app = Flask(__name__)


def bootstrap_app():
    """
    Bootstrap function to initialise the Flask app and config
    :return: Initialised Flask app
    """
    set_config()

    initialise_logger()
    app.logger.info('HOT Tasking Manager App Starting Up, Environment = {0}'.format(get_current_environment()))

    app.logger.debug('Initialising Blueprints')
    from .web import main as main_blueprint
    from .web import swagger as swagger_blueprint

    app.register_blueprint(main_blueprint)
    app.register_blueprint(swagger_blueprint)

    return app


def get_current_environment():
    """
    Gets the currently running environment from the OS Env Var
    :return: Current environment
    """
    env = os.getenv('TASKING_MANAGER_ENV', 'Dev')  # default to Dev if config environment var not set
    return env.capitalize()


def set_config():
    """
    Sets the config for the current environment
    """
    env = get_current_environment()
    app.config.from_object('server.config.{0}Config'.format(env))


def initialise_logger():
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
