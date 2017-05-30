import logging
import os


class EnvironmentConfig:
    """ Base class for config that is shared between environments """
    DEFAULT_CHANGESET_COMMENT = '#hotosm-project'
    # This is the address we'll use as the sender on all auto generated emails
    EMAIL_FROM_ADDRESS = 'noreply@hotosmmail.org'
    LOG_LEVEL = logging.ERROR
    OSM_OAUTH_SETTINGS = {
        'base_url': 'https://www.openstreetmap.org/api/0.6/',
        'consumer_key': os.getenv('TM_CONSUMER_KEY', None),
        'consumer_secret': os.getenv('TM_CONSUMER_SECRET', None),
        'request_token_url': 'https://www.openstreetmap.org/oauth/request_token',
        'access_token_url': 'https://www.openstreetmap.org/oauth/access_token',
        'authorize_url': 'https://www.openstreetmap.org/oauth/authorize'
    }
    SQLALCHEMY_DATABASE_URI = os.getenv('TM_DB', None)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('TM_SECRET', None)
    SMTP_SETTINGS = {
        'host': 'email-smtp.eu-west-1.amazonaws.com',
        'smtp_user': 'AKIAIIBGP3IBB3NWDX5Q',
        'smtp_password': os.getenv('TM_SMTP_PASSWORD', None),
    }
    # Note that there must be exactly the same number of Codes as languages, or errors will occur
    SUPPORTED_LANGUAGES = {
        'codes': 'en, fr, es, de, pt, ja, lt, zh_TW, id, da, pt_BR, ru, sl, it, nl_NL, uk, ta, si, cs, nb, hu',
        'languages': 'English, Français, Español, Deutsch, Português, 日本語, Lietuvos, 中文, Indonesia, Dansk, Português (Brasil), Русский, Slovenščina, Italiano, Nederlands, Українська, தமிழ், සිංහල, Česky, Bokmål, Magyar'
    }

class ProdConfig(EnvironmentConfig):
    APP_BASE_URL = 'http://tasks-prod.hotosm.org'
    API_DOCS_URL = f'{APP_BASE_URL}/api-docs/swagger-ui/index.html?' + \
                   'url=http://tasks-prod.hotosm.org/api/docs'
    LOG_DIR = '/var/log/tasking-manager-logs'
    LOG_LEVEL = logging.DEBUG

class StageConfig(EnvironmentConfig):
    APP_BASE_URL = 'http://tasks-stage.hotosm.org'
    API_DOCS_URL = f'{APP_BASE_URL}/api-docs/swagger-ui/index.html?' + \
                   'url=http://tasks-stage.hotosm.org/api/docs'
    LOG_DIR = '/var/log/tasking-manager-logs'
    LOG_LEVEL = logging.DEBUG

class DemoConfig(EnvironmentConfig):
    APP_BASE_URL = 'http://tasks-demo.hotosm.org'
    API_DOCS_URL = f'{APP_BASE_URL}/api-docs/swagger-ui/index.html?' + \
                   'url=http://tasks-demo.hotosm.org/api/docs'
    LOG_DIR = '/var/log/tasking-manager-logs'
    LOG_LEVEL = logging.DEBUG

class StagingConfig(EnvironmentConfig):
    APP_BASE_URL = 'http://tasks-demo.hotosm.org'
    API_DOCS_URL = f'{APP_BASE_URL}/api-docs/swagger-ui/index.html?' + \
                   'url=http://tasks-stage.hotosm.org/api/docs'
    LOG_DIR = '/var/log/tasking-manager-logs'
    LOG_LEVEL = logging.DEBUG

class DevConfig(EnvironmentConfig):
    APP_BASE_URL = 'http://127.0.0.1:5000'
    API_DOCS_URL = f'{APP_BASE_URL}/api-docs/swagger-ui/index.html?url=http://127.0.0.1:5000/api/docs'
    LOG_DIR = 'logs'
    LOG_LEVEL = logging.DEBUG


class DevIPv6Config(EnvironmentConfig):
    APP_BASE_URL = 'http://[::1]:5000'
    API_DOCS_URL = f'{APP_BASE_URL}/api-docs/swagger-ui/index.html?url=http://[::1]:5000/api/docs'
    LOG_DIR = 'logs'
    LOG_LEVEL = logging.DEBUG
