import logging
import os


class EnvironmentConfig:
    """ Base class for config that is shared between environments """
    DEFAULT_CHANGESET_COMMENT = '#hotosm-project'
    # This is the address we'll use as the sender on all auto generated emails
    EMAIL_FROM_ADDRESS = 'noreply@hotosmmail.org'
    LOG_LEVEL = logging.ERROR
    # Mapper Level values represent number of OSM changesets
    MAPPER_LEVEL_INTERMEDIATE = 250
    MAPPER_LEVEL_ADVANCED = 500
    # Time to wait until task auto-unlock,
    # e.g. '2h' (2 hours) or '7d' (7 days) or '30m' (30 minutes) or '1h30m' (1.5 hours)
    TASK_AUTOUNLOCK_AFTER = '2h'

    OSM_OAUTH_SETTINGS = {
        'base_url': 'https://www.openstreetmap.org/api/0.6/',
        'consumer_key': os.getenv('TM_CONSUMER_KEY', None),
        'consumer_secret': os.getenv('TM_CONSUMER_SECRET', None),
        'request_token_url': 'https://www.openstreetmap.org/oauth/request_token',
        'access_token_url': 'https://www.openstreetmap.org/oauth/access_token',
        'authorize_url': 'https://www.openstreetmap.org/oauth/authorize'
    }
    SEND_FILE_MAX_AGE_DEFAULT = 0
    SQLALCHEMY_DATABASE_URI = os.getenv('TM_DB', None)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_POOL_SIZE = 10
    SQLALCHEMY_MAX_OVERFLOW = 10
    SECRET_KEY = os.getenv('TM_SECRET', None)
    SMTP_SETTINGS = {
        'host': os.getenv('TM_SMTP_HOST', None),
        'smtp_user': os.getenv('TM_SMTP_USER', None),
        'smtp_port': os.getenv('TM_SMTP_PORT', 25), # GMail SMTP is over port 587 and will fail on the default port
        'smtp_password': os.getenv('TM_SMTP_PASSWORD', None),
    }
    # Note that there must be exactly the same number of Codes as languages, or errors will occur
    SUPPORTED_LANGUAGES = {
        'codes': 'ar, cs, da, de, en, es, fa_IR, fi, fr, hu, gl, id, it, ja, lt, mg, nb, nl_NL, pl, pt, pt_BR, ru, si, sl, ta, uk, vi, zh_TW',
        'languages': 'Arabic, Česky, Dansk, Deutsch, English, Español, Persian (Iran), Suomi, Français, Magyar, Galician, Indonesia, Italiano, 日本語, Lietuvos, Malagasy, Bokmål, Nederlands, Polish, Português, Português (Brasil), Русский, සිංහල, Slovenščina, தமிழ், Українська, tiếng Việt, 中文'
    }


class ProdConfig(EnvironmentConfig):
    APP_BASE_URL = 'https://tasks.hotosm.org'
    API_DOCS_URL = f'{APP_BASE_URL}/api-docs/swagger-ui/index.html?' + \
                   f'url={APP_BASE_URL}/api/docs'
    LOG_DIR = '/var/log/tasking-manager-logs'
    LOG_LEVEL = logging.ERROR


class StageConfig(EnvironmentConfig):
    APP_BASE_URL = 'https://tasks-stage.hotosm.org'
    API_DOCS_URL = f'{APP_BASE_URL}/api-docs/swagger-ui/index.html?' + \
                   f'url={APP_BASE_URL}/api/docs'
    LOG_DIR = '/var/log/tasking-manager-logs'
    LOG_LEVEL = logging.DEBUG


class DemoConfig(EnvironmentConfig):
    APP_BASE_URL = 'https://tasks-demo.hotosm.org'
    API_DOCS_URL = f'{APP_BASE_URL}/api-docs/swagger-ui/index.html?' + \
                   f'url={APP_BASE_URL}/api/docs'
    LOG_DIR = '/var/log/tasking-manager-logs'
    LOG_LEVEL = logging.DEBUG


class StagingConfig(EnvironmentConfig):
    # Currently being used by Thinkwhere
    APP_BASE_URL = 'http://tasking-manager-staging.eu-west-1.elasticbeanstalk.com'
    API_DOCS_URL = f'{APP_BASE_URL}/api-docs/swagger-ui/index.html?' + \
                   f'url={APP_BASE_URL}/api/docs'
    LOG_DIR = '/var/log/tasking-manager-logs'
    LOG_LEVEL = logging.DEBUG


class DevConfig(EnvironmentConfig):
    APP_BASE_URL = 'http://127.0.0.1:5000'
    API_DOCS_URL = f'{APP_BASE_URL}/api-docs/swagger-ui/index.html?' + \
                   f'url={APP_BASE_URL}/api/docs'
    LOG_DIR = 'logs'
    LOG_LEVEL = logging.DEBUG


class DevIPv6Config(EnvironmentConfig):
    APP_BASE_URL = 'http://[::1]:5000'
    API_DOCS_URL = f'{APP_BASE_URL}/api-docs/swagger-ui/index.html?' + \
                   f'url={APP_BASE_URL}/api/docs'
    LOG_DIR = 'logs'
    LOG_LEVEL = logging.DEBUG
