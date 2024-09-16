import logging

# gevent.monkey.patch_ssl is required. gevent message as follows:
# MonkeyPatchWarning: Monkey-patching ssl after ssl has already been imported may
# lead to errors, including RecursionError on Python 3.6. It may also silently
# lead to incorrect behaviour on Python 3.7. Please monkey-patch earlier.
# See https://github.com/gevent/gevent/issues/1016.
try:
    from gevent import monkey

    monkey.patch_ssl()
except ImportError as e:
    logging.warning("Not using gevent")
    logging.info(e)

import os
import json
from logging.handlers import RotatingFileHandler

# from flask import Flask, redirect, request
# from flask_cors import CORS
# from flask_migrate import Migrate
from requests_oauthlib import OAuth2Session

# from flask_restful import Api
from fastapi_mail import FastMail, ConnectionConfig

from backend.config import settings


# Load error_messages.json and store it so that it is loaded only once at startup (Used in exceptions.py)
# Construct the path to the JSON file
module_dir = os.path.dirname(__file__)
error_message_path = os.path.join(module_dir, "error_messages.json")

with open(error_message_path) as jsonfile:
    ERROR_MESSAGES = json.load(jsonfile)


def sentry_init():
    """Initialize sentry.io event tracking"""
    import sentry_sdk
    from sentry_sdk.integrations.flask import FlaskIntegration
    from backend.exceptions import (
        BadRequest,
        NotFound,
        Unauthorized,
        Forbidden,
        Conflict,
    )

    sentry_sdk.init(
        dsn=settings.SENTRY_BACKEND_DSN,
        environment=settings.ENVIRONMENT,
        integrations=[FlaskIntegration()],
        traces_sample_rate=0.1,
        ignore_errors=[
            BadRequest,
            NotFound,
            Unauthorized,
            Forbidden,
            Conflict,
        ],  # Ignore these errors as they are handled by the API
    )


def format_url(endpoint):
    parts = endpoint.strip("/")
    return "/api/{}/{}/".format(settings.API_VERSION, parts)


# db = sqlalchemy
# migrate = Migrate()

# Define the email configuration
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_DEFAULT_SENDER,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.ORG_NAME,
    MAIL_SSL_TLS=False,
    MAIL_STARTTLS=True,
    VALIDATE_CERTS=True,
)

mail = FastMail(conf)


osm = OAuth2Session(
    client_id=settings.OAUTH_CLIENT_ID,
    scope=settings.OAUTH_SCOPE,
    redirect_uri=settings.OAUTH_REDIRECT_URI,
)

# Import all models so that they are registered with SQLAlchemy
from backend.models.postgis import *  # noqa


def create_app(env="backend.config.settings"):
    """
    Bootstrap function to initialise the Flask app and config
    :return: Initialised Flask app
    """
    # If SENTRY_BACKEND_DSN is configured, init sentry_sdk tracking
    if settings.SENTRY_BACKEND_DSN:
        sentry_init()

    app = Flask(__name__, template_folder="services/messaging/templates/")

    # Load configuration options from environment
    # Set env to Testsettings if TM_ENVIRONMENT is test
    if os.getenv("TM_ENVIRONMENT") == "test":
        env = "backend.config.Testsettings"
    app.config.from_object(env)
    # Enable logging to files
    initialise_logger(app)
    app.logger.info("Starting up a new Tasking Manager application")

    # Connect to database
    app.logger.debug("Connecting to the database")
    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)

    app.logger.debug("Add root redirect route")

    @app.errorhandler(Exception)
    def handle_generic_error(error):
        """Generic error handler for all exceptions"""
        from backend.exceptions import format_sub_code

        app.logger.exception(error)

        error_message = (
            str(error)
            if len(str(error)) > 0
            else ERROR_MESSAGES["INTERNAL_SERVER_ERROR"]
        )
        error_code = error.code if hasattr(error, "code") else 500
        error_sub_code = (
            format_sub_code(error.name)
            if hasattr(error, "name")
            else "INTERNAL_SERVER_ERROR"
        )
        return (
            {
                "error": {
                    "code": error_code,
                    "sub_code": error_sub_code,
                    "message": error_message,
                    "details": {
                        "url": request.url,
                        "method": request.method,
                    },
                }
            },
            error_code,
        )

    @app.route("/")
    def index_redirect():
        return redirect(format_url("system/heartbeat/"), code=302)

    # Add paths to API endpoints
    add_api_endpoints(app)

    # Enables CORS on all API routes, meaning API is callable from anywhere
    # CORS(app)

    # Add basic oauth setup
    app.secret_key = app.config[
        "SECRET_KEY"
    ]  # Required by itsdangerous, Flask-OAuthlib for creating entropy

    return app


def initialise_logger(app):
    """
    Read environment config then initialise a 2MB rotating log.  Prod Log Level can be reduced to help diagnose Prod
    only issues.
    """
    log_dir = app.config["LOG_DIR"]
    log_level = app.config["LOG_LEVEL"]
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    file_handler = RotatingFileHandler(
        log_dir + "/tasking-manager.log", "a", 2 * 1024 * 1024, 3
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(
        logging.Formatter(
            "%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]"
        )
    )
    app.logger.addHandler(file_handler)
    app.logger.setLevel(log_level)


def initialise_counters(app):
    """Initialise homepage counters so that users don't see 0 users on first load of application"""
    from backend.services.stats_service import StatsService

    with app.app_context():
        StatsService.get_homepage_stats()
