import json
import logging
import os
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv
from pydantic import PostgresDsn, ValidationInfo, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Base class for configuration."""

    """ Most settings can be defined through environment variables. """

    class Config:
        ignored_types = (type(json),)

    # Load configuration from file
    load_dotenv(
        os.path.normpath(
            os.path.join(os.path.dirname(__file__), "..", "tasking-manager.env")
        )
    )
    APP_NAME: str = "Tasking Manager"
    DEBUG: bool = False
    PROFILING: bool = os.getenv("PROFILING", False)
    EXTRA_CORS_ORIGINS: list = (
        os.getenv("EXTRA_CORS_ORIGINS", "").split(",")
        if os.getenv("EXTRA_CORS_ORIGINS")
        else ["*"]
    )

    # The base url the application is reachable
    APP_BASE_URL: str = os.getenv("TM_APP_BASE_URL", "http://127.0.0.1:5000/").rstrip(
        "/"
    )
    TM_APP_API_URL: str = os.getenv("TM_APP_API_URL", "http://127.0.0.1:3000/api")
    API_VERSION: str = os.getenv("TM_APP_API_VERSION", "v2")
    ORG_CODE: str = os.getenv("TM_ORG_CODE", "HOT")
    ORG_NAME: str = os.getenv("TM_ORG_NAME", "Humanitarian OpenStreetMap Team")
    ORG_LOGO: str = os.getenv(
        "TM_ORG_LOGO",
        "https://cdn.hotosm.org/tasking-manager/uploads/1588741335578_hot-logo.png",
    )
    ENVIRONMENT: str = os.getenv("TM_ENVIRONMENT", "")
    # The default tag used in the OSM changeset comment
    DEFAULT_CHANGESET_COMMENT: str = os.getenv(
        "TM_DEFAULT_CHANGESET_COMMENT", "#hot-tm-stage-project"
    )

    # The address to use as the sender on auto generated emails
    EMAIL_FROM_ADDRESS: str = os.getenv(
        "TM_EMAIL_FROM_ADDRESS", "noreply@hotosmmail.org"
    )

    # The address to use as the receiver in contact form.
    EMAIL_CONTACT_ADDRESS: str = os.getenv(
        "TM_EMAIL_CONTACT_ADDRESS", "sysadmin@hotosm.org"
    )

    # A freely definable secret key for connecting the front end with the back end
    SECRET_KEY: str = os.getenv("TM_SECRET", None)

    # OSM API, Nomimatim URLs
    OSM_SERVER_URL: str = os.getenv("OSM_SERVER_URL", "https://www.openstreetmap.org")
    OSM_NOMINATIM_SERVER_URL: str = os.getenv(
        "OSM_NOMINATIM_SERVER_URL", "https://nominatim.openstreetmap.org"
    )

    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", None)
    POSTGRES_ENDPOINT: str = os.getenv("POSTGRES_ENDPOINT", "localhost")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "postgres")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")

    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    @classmethod
    def assemble_db_connection(
        cls, v: Optional[str], info: ValidationInfo
    ) -> Optional[str]:
        """Build Postgres connection from environment variables or JSON config."""
        if v:
            return v

        if os.getenv("TM_DB"):
            return os.getenv("TM_DB")

        if os.getenv("DB_CONNECT_PARAM_JSON"):
            params = json.loads(os.getenv("DB_CONNECT_PARAM_JSON"))
            return PostgresDsn.build(
                scheme="postgresql+asyncpg",
                username=params.get("username"),
                password=params.get("password"),
                host=params.get("host"),
                port=int(params.get("port")),
                path=f"{params.get('dbname')}",
            )
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=info.data.get("POSTGRES_USER"),
            password=info.data.get("POSTGRES_PASSWORD"),
            host=info.data.get("POSTGRES_ENDPOINT"),
            port=int(info.data.get("POSTGRES_PORT")),
            path=f"{info.data.get('POSTGRES_DB')}",
        )

    # Logging settings
    LOG_LEVEL: int = os.getenv("TM_LOG_LEVEL", logging.DEBUG)
    LOG_DIR: str = os.getenv("TM_LOG_DIR", "/home/appuser/logs")
    USE_SENTRY: bool = os.getenv("USE_SENTRY", "false").lower() == "true"

    # Mapper Level values represent number of OSM changesets
    MAPPER_LEVEL_INTERMEDIATE: int = int(os.getenv("TM_MAPPER_LEVEL_INTERMEDIATE", 250))
    MAPPER_LEVEL_ADVANCED: int = int(os.getenv("TM_MAPPER_LEVEL_ADVANCED", 500))

    # Time to wait until task auto-unlock (e.g. '2h' or '7d' or '30m' or '1h30m')
    TASK_AUTOUNLOCK_AFTER: str = os.getenv("TM_TASK_AUTOUNLOCK_AFTER", "2h")

    # Configuration for sending emails
    MAIL_SERVER: Optional[str] = os.getenv("TM_SMTP_HOST", None)
    MAIL_PORT: str = os.getenv("TM_SMTP_PORT", "587")
    MAIL_USE_TLS: bool = bool(int(os.getenv("TM_SMTP_USE_TLS", True)))
    MAIL_USE_SSL: bool = bool(int(os.getenv("TM_SMTP_USE_SSL", False)))
    MAIL_USERNAME: Optional[str] = os.getenv("TM_SMTP_USER", None)
    MAIL_PASSWORD: Optional[str] = os.getenv("TM_SMTP_PASSWORD", None)
    MAIL_DEFAULT_SENDER: str = os.getenv(
        "TM_EMAIL_FROM_ADDRESS", "noreply@hotosmmail.org"
    )
    MAIL_DEBUG: bool = True if LOG_LEVEL == "DEBUG" else False

    if os.getenv("SMTP_CREDENTIALS", False):
        """
        This section reads JSON formatted SMTP connection parameters passed
        from AWS Secrets Manager with the ENVVAR key `SMTP_CREDENTIALS`.
        """

        _params: dict = json.loads(os.getenv("SMTP_CREDENTIALS", None))
        MAIL_SERVER: str = _params.get("SMTP_HOST", None)
        MAIL_PORT: str = _params.get("SMTP_PORT", "587")
        MAIL_USE_TLS: bool = bool(int(_params.get("SMTP_USE_TLS", True)))
        MAIL_USE_SSL: bool = bool(int(_params.get("SMTP_USE_SSL", False)))
        MAIL_USERNAME: str = _params.get("SMTP_USER", None)
        MAIL_PASSWORD: str = _params.get("SMTP_PASSWORD", None)

    # If disabled project update emails will not be sent.
    SEND_PROJECT_EMAIL_UPDATES: bool = bool(
        os.getenv("TM_SEND_PROJECT_EMAIL_UPDATES", True)
    )

    # Languages offered by the Tasking Manager
    # Please note that there must be exactly the same number of Codes as languages.
    SUPPORTED_LANGUAGES: dict = {
        "codes": os.getenv(
            "TM_SUPPORTED_LANGUAGES_CODES",
            ", ".join(
                [
                    "ar",
                    "cs",
                    "de",
                    "el",
                    "en",
                    "es",
                    "fa_IR",
                    "fr",
                    "he",
                    "hu",
                    "id",
                    "it",
                    "ja",
                    "ko",
                    "mg",
                    "ml",
                    "nl_NL",
                    "pt",
                    "pt_BR",
                    "ru",
                    "sv",
                    "sw",
                    "tl",
                    "tr",
                    "uk",
                    "zh_TW",
                ]
            ),
        ),
        "languages": os.getenv(
            "TM_SUPPORTED_LANGUAGES",
            ", ".join(
                [
                    "عربى",
                    "Čeština",
                    "Deutsch",
                    "Ελληνικά",
                    "English",
                    "Español",
                    "فارسی",
                    "Français",
                    "עברית",
                    "Magyar",
                    "Indonesia",
                    "Italiano",
                    "日本語",
                    "한국어",
                    "Malagasy",
                    "Malayalam",
                    "Nederlands",
                    "Português",
                    "Português (Brasil)",
                    "Русский язык",
                    "Svenska",
                    "Kiswahili",
                    "Filipino (Tagalog)",
                    "Türkçe",
                    "Українська",
                    "繁體中文",
                ]
            ),
        ),
    }

    # Connection to OSM authentification system
    OAUTH_API_URL: str = "{}/api/0.6/".format(OSM_SERVER_URL)
    OAUTH_CLIENT_ID: str = os.getenv("TM_CLIENT_ID", None)
    OAUTH_CLIENT_SECRET: str = os.getenv("TM_CLIENT_SECRET", None)
    OAUTH_SCOPE: str = os.getenv("TM_SCOPE", "read_prefs write_api")
    OAUTH_REDIRECT_URI: str = os.getenv("TM_REDIRECT_URI", None)
    DB_NAME: str = os.getenv("TM_DB", "tasking-manager")

    if os.getenv("OAUTH2_APP_CREDENTIALS", False):
        """
        This section reads JSON formatted OAuth2 app credentials passed
        from AWS Secrets Manager with the ENVVAR key `OAUTH2_APP_CREDENTIALS`.
        """

        _params: dict = json.loads(os.getenv("OAUTH2_APP_CREDENTIALS", None))
        OAUTH_CLIENT_ID: str = _params.get("CLIENT_ID", None)
        OAUTH_CLIENT_SECRET: str = _params.get("CLIENT_SECRET", None)
        OAUTH_REDIRECT_URI: str = _params.get("REDIRECT_URI", None)
        OAUTH_SCOPE: str = _params.get("ACCESS_SCOPE", "read_prefs write_api")

    # Some more definitions (not overridable)
    SQLALCHEMY_ENGINE_OPTIONS: dict = {
        "pool_size": 10,
        "max_overflow": 10,
    }
    SEND_FILE_MAX_AGE_DEFAULT: int = 0
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False

    # Image upload Api
    IMAGE_UPLOAD_API_KEY: Optional[str] = os.getenv("TM_IMAGE_UPLOAD_API_KEY", None)
    IMAGE_UPLOAD_API_URL: Optional[str] = os.getenv("TM_IMAGE_UPLOAD_API_URL", None)

    if os.getenv("IMAGE_UPLOAD_CREDENTIALS", False):
        """
        This section reads JSON formatted Image Upload credentials passed
        from AWS Secrets Manager with the ENVVAR key `IMAGE_UPLOAD_CREDENTIALS`.
        """

        _params: dict = json.loads(os.getenv("IMAGE_UPLOAD_CREDENTIALS"), None)
        IMAGE_UPLOAD_API_KEY: str = _params.get("IMAGE_UPLOAD_API_KEY", None)
        IMAGE_UPLOAD_API_URL: str = _params.get("IMAGE_UPLOAD_API_URL", None)

    # Sentry backend DSN
    SENTRY_BACKEND_DSN: str = os.getenv("TM_SENTRY_BACKEND_DSN", None)

    # Ohsome Stats Token
    OHSOME_STATS_TOKEN: str = os.getenv("OHSOME_STATS_TOKEN", None)


class TestEnvironmentConfig(Settings):
    POSTGRES_TEST_DB: str = os.getenv("POSTGRES_TEST_DB", None)

    ENVIRONMENT: str = "test"

    SQLALCHEMY_DATABASE_URI: PostgresDsn = PostgresDsn.build(
        scheme="postgresql+asyncpg",
        username=Settings().POSTGRES_USER,
        password=Settings().POSTGRES_PASSWORD,
        host=Settings().POSTGRES_ENDPOINT,
        port=int(Settings().POSTGRES_PORT),
        path=f"{POSTGRES_TEST_DB}",
    )

    LOG_LEVEL: str = "DEBUG"


@lru_cache
def get_settings(env_type: str = "default"):
    """Cache settings when accessed throughout app."""
    _settings = Settings()
    if env_type == "test":
        _settings = TestEnvironmentConfig()
    return _settings


settings = get_settings(env_type="default")
test_settings = get_settings(env_type="test")
