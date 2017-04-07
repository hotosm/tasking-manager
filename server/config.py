import logging
import os


class EnvironmentConfig:
    """ Base class for config that is shared between environments """
    LOG_LEVEL = logging.ERROR
    # TODO rename this env_var
    SQLALCHEMY_DATABASE_URI = os.getenv('TM_DB', None)
    SECRET_KEY = os.getenv('TM_SECRET', None)
    # TODO recreate for go-live.
    OSM_OAUTH_SETTINGS = {
        'base_url': 'https://www.openstreetmap.org/api/0.6/',
        'consumer_key': '4I5YXs4VQkXTTrMgau11rmE5tuTVoAIWsQXE5HnW',
        'consumer_secret': os.getenv('TM_CONSUMER_SECRET', None),
        'request_token_url': 'https://www.openstreetmap.org/oauth/request_token',
        'access_token_url': 'https://www.openstreetmap.org/oauth/access_token',
        'authorize_url': 'https://www.openstreetmap.org/oauth/authorize'
    }


class StagingConfig(EnvironmentConfig):
    APP_BASE_URL = 'http://tasking-manager-staging.eu-west-1.elasticbeanstalk.com'
    API_DOCS_URL = f'{APP_BASE_URL}/api-docs/swagger-ui/index.html?' + \
        'url=http://tasking-manager-staging.eu-west-1.elasticbeanstalk.com/api/docs'
    LOG_DIR = '/var/log/tasking-manager-logs'
    LOG_LEVEL = logging.DEBUG


class DevConfig(EnvironmentConfig):
    APP_BASE_URL = 'http://localhost:5000'
    API_DOCS_URL = f'{APP_BASE_URL}/api-docs/swagger-ui/index.html?url=http://localhost:5000/api/docs'
    LOG_DIR = 'logs'
    LOG_LEVEL = logging.DEBUG
