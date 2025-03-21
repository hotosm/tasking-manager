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

import json
import os
from logging.handlers import RotatingFileHandler

from fastapi_mail import ConnectionConfig, FastMail
from requests_oauthlib import OAuth2Session

from backend.config import settings

# Load error_messages.json and store it so that it is loaded only once at startup (Used in exceptions.py)
# Construct the path to the JSON file
module_dir = os.path.dirname(__file__)
error_message_path = os.path.join(module_dir, "error_messages.json")

with open(error_message_path) as jsonfile:
    ERROR_MESSAGES = json.load(jsonfile)


def format_url(endpoint):
    parts = endpoint.strip("/")
    return "/api/{}/{}/".format(settings.API_VERSION, parts)


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
