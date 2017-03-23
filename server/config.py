import logging
import os
from server.models.postgis.utils import DateTimeEncoder


class EnvironmentConfig:
    """
    Base class for config that is shared between environments
    """
    LOG_LEVEL = logging.ERROR
    SQLALCHEMY_DATABASE_URI = os.getenv('TASKING_MANAGER_DB', None)


class StagingConfig(EnvironmentConfig):
    API_DOCS_URL = 'http://tasking-manager-staging.eu-west-1.elasticbeanstalk.com/api-docs/swagger-ui/index.html?' + \
        'url=http://tasking-manager-staging.eu-west-1.elasticbeanstalk.com/api/docs'
    LOG_DIR = '/var/log/tasking-manager-logs'
    LOG_LEVEL = logging.DEBUG


class DevConfig(EnvironmentConfig):
    API_DOCS_URL = 'http://localhost:5000/api-docs/swagger-ui/index.html?url=http://localhost:5000/api/docs'
    LOG_DIR = 'logs'
    LOG_LEVEL = logging.DEBUG
    OSM_OAUTH_SETTINGS = {
        'base_url': 'https://www.openstreetmap.org/api/0.6/',
        'consumer_key': '85kx1NtVqBq51SU2S0c2e5EgO3W9Q9cBGJvqDusd',
        'consumer_secret': 'TGWsvZqy0fQcpPCS1OsFnIbfdbawKH0GjmdGK1h1',
        'request_token_url': 'https://www.openstreetmap.org/oauth/request_token',
        'access_token_url': 'https://www.openstreetmap.org/oauth/access_token',
        'authorize_url': 'https://www.openstreetmap.org/oauth/authorize'
    }


