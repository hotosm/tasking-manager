import logging
import os


class EnvironmentConfig:
    """ Base class for config that is shared between environments """
    DEFAULT_CHANGESET_COMMENT = '#teachosm-project'
    # This is the address we'll use as the sender on all auto generated emails
    EMAIL_FROM_ADDRESS = 'noreply@hotosmmail.org'
    LOG_LEVEL = logging.ERROR
    # Mapper Level values represent number of OSM changesets
    MAPPER_LEVEL_INTERMEDIATE = 250
    MAPPER_LEVEL_ADVANCED = 500
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
        'smtp_password': os.getenv('TM_SMTP_PASSWORD', None),
    }
    # Note that there must be exactly the same number of Codes as languages, or errors will occur
    SUPPORTED_LANGUAGES = {
        'codes': 'en, fr, es, de, pt, ja, lt, zh_TW, id, da, pt_BR, ru, sl, it, nl_NL, uk, ta, si, cs, nb, hu, mg',
        'languages': 'English, Français, Español, Deutsch, Português, 日本語, Lietuvos, 中文, Indonesia, Dansk,'
                     ' Português (Brasil), Русский, Slovenščina, Italiano, Nederlands, Українська, தமிழ், සිංහල,'
                     ' Česky, Bokmål, Magyar, Malagasy'
    }


class ProdConfig(EnvironmentConfig):
    APP_BASE_URL = 'http://tasks-teachosm.hotosm.org'
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
