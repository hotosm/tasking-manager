import logging


class EnvironmentConfig:
    """
    Base class for config that is shared between environments
    """
    LOG_LEVEL = logging.ERROR


class DevConfig(EnvironmentConfig):
    API_DOCS_URL = 'http://localhost:5000/api-docs/swagger-ui/index.html?url=http://localhost:5000/api/docs'
    LOG_DIR = 'logs'
    LOG_LEVEL = logging.DEBUG
