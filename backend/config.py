import logging
import os
from dotenv import load_dotenv


class EnvironmentConfig:
    """ Base class for configuration. """

    """ Most settings can be defined through environment variables. """

    # Load configuration from file
    load_dotenv(
        os.path.normpath(
            os.path.join(os.path.dirname(__file__), "..", "tasking-manager.env")
        )
    )

    # The base url the application is reachable
    APP_BASE_URL = os.getenv("TM_APP_BASE_URL", "http://127.0.0.1:5000/")
    if APP_BASE_URL.endswith("/"):
        APP_BASE_URL = APP_BASE_URL[:-1]

    API_VERSION = os.getenv("TM_APP_API_VERSION", "v2")
    ORG_CODE = os.getenv("TM_ORG_CODE", "")
    ORG_NAME = os.getenv("TM_ORG_NAME", "")
    ORG_LOGO = os.getenv(
        "TM_ORG_LOGO",
        "https://cdn.hotosm.org/tasking-manager/uploads/1588741335578_hot-logo.png",
    )
    ENVIRONMENT = os.getenv("TM_ENVIRONMENT", "")
    # The default tag used in the OSM changeset comment
    DEFAULT_CHANGESET_COMMENT = os.getenv("TM_DEFAULT_CHANGESET_COMMENT", None)

    # The address to use as the sender on auto generated emails
    EMAIL_FROM_ADDRESS = os.getenv("TM_EMAIL_FROM_ADDRESS", None)

    # The address to use as the receiver in contact form.
    EMAIL_CONTACT_ADDRESS = os.getenv("TM_EMAIL_CONTACT_ADDRESS", None)

    # A freely definable secret key for connecting the front end with the back end
    SECRET_KEY = os.getenv("TM_SECRET", None)

    # OSM API, Nomimatim URLs
    OSM_SERVER_URL = os.getenv("OSM_SERVER_URL", "https://www.openstreetmap.org")
    OSM_NOMINATIM_SERVER_URL = os.getenv(
        "OSM_NOMINATIM_SERVER_URL", "https://nominatim.openstreetmap.org"
    )

    # Database connection
    POSTGRES_USER = os.getenv("POSTGRES_USER", None)
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", None)
    POSTGRES_ENDPOINT = os.getenv("POSTGRES_ENDPOINT", "postgresql")
    POSTGRES_DB = os.getenv("POSTGRES_DB", None)
    POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

    # Assamble the database uri
    if os.getenv("TM_DB", False):
        SQLALCHEMY_DATABASE_URI = os.getenv("TM_DB", None)
    else:
        SQLALCHEMY_DATABASE_URI = (
            f"postgresql://{POSTGRES_USER}"
            + f":{POSTGRES_PASSWORD}"
            + f"@{POSTGRES_ENDPOINT}:"
            + f"{POSTGRES_PORT}"
            + f"/{POSTGRES_DB}"
        )

    # Logging settings
    LOG_LEVEL = os.getenv("TM_LOG_LEVEL", logging.DEBUG)
    LOG_DIR = os.getenv("TM_LOG_DIR", "logs")

    # Mapper Level values represent number of OSM changesets
    MAPPER_LEVEL_INTERMEDIATE = int(os.getenv("TM_MAPPER_LEVEL_INTERMEDIATE", 250))
    MAPPER_LEVEL_ADVANCED = int(os.getenv("TM_MAPPER_LEVEL_ADVANCED", 500))

    # Time to wait until task auto-unlock (e.g. '2h' or '7d' or '30m' or '1h30m')
    TASK_AUTOUNLOCK_AFTER = os.getenv("TM_TASK_AUTOUNLOCK_AFTER", "2h")

    # Configuration for sending emails
    SMTP_SETTINGS = {
        "host": os.getenv("TM_SMTP_HOST", None),
        "smtp_user": os.getenv("TM_SMTP_USER", None),
        "smtp_port": os.getenv("TM_SMTP_PORT", 25),
        "smtp_password": os.getenv("TM_SMTP_PASSWORD", None),
    }

    # Languages offered by the Tasking Manager
    # Please note that there must be exactly the same number of Codes as languages.
    SUPPORTED_LANGUAGES = {
        "codes": os.getenv(
            "TM_SUPPORTED_LANGUAGES_CODES",
            "ar, cs, de, el, en, es, fa_IR, fr, he, hu, id, it, ja, mg, ml, nl_NL, pt, pt_BR, ru, sv, sw, tl, tr, uk, zh_TW",  # noqa
        ),
        "languages": os.getenv(
            "TM_SUPPORTED_LANGUAGES",
            "عربى, Česky, Deutsch, Ελληνικά, English, Español, فارسی, Français, עברית, Magyar, Indonesia, Italiano, 日本語, Malagasy, Malayalam, Nederlands, Português, Português (Brasil), Русский язык, Svenska, Kiswahili, Filipino (Tagalog), Türkçe, Українська, 中国台湾",  # noqa
        ),
    }

    # Connection to OSM authentification system
    OSM_OAUTH_SETTINGS = {
        "base_url": "{}/api/0.6/".format(OSM_SERVER_URL),
        "consumer_key": os.getenv("TM_CONSUMER_KEY", None),
        "consumer_secret": os.getenv("TM_CONSUMER_SECRET", None),
        "request_token_url": "{}/oauth/request_token".format(OSM_SERVER_URL),
        "access_token_url": "{}/oauth/access_token".format(OSM_SERVER_URL),
        "authorize_url": "{}/oauth/authorize".format(OSM_SERVER_URL),
    }

    # Some more definitions (not overridable)
    SEND_FILE_MAX_AGE_DEFAULT = 0
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_POOL_SIZE = 10
    SQLALCHEMY_MAX_OVERFLOW = 10

    # Image upload Api
    IMAGE_UPLOAD_API_KEY = os.getenv("TM_IMAGE_UPLOAD_API_KEY", None)
    IMAGE_UPLOAD_API_URL = os.getenv("TM_IMAGE_UPLOAD_API_URL", None)

    # Sentry backend DSN
    SENTRY_BACKEND_DSN = os.getenv("TM_SENTRY_BACKEND_DSN", None)
