locals {
  envs = {
    EXTRA_CORS_ORIGINS            = get_env("EXTRA_CORS_ORIGINS", "[\"https://hotosm.github.io\", \"https://tasks-dev.hotosm.org\", \"http://localhost:3000\"]")
    TM_SMTP_HOST                  = get_env("TM_SMTP_HOST", "email-smtp.us-east-1.amazonaws.com")
    TM_SMTP_PORT                  = get_env("TM_SMTP_PORT", "587")
    TM_SMTP_USE_TLS               = get_env("TM_SMTP_USE_TLS", "1")
    TM_SMTP_USE_SSL               = get_env("TM_SMTP_USE_SSL", "0")
    TM_EMAIL_FROM_ADDRESS         = get_env("TM_EMAIL_FROM_ADDRESS", "noreply@hotosmmail.org")
    TM_EMAIL_CONTACT_ADDRESS      = get_env("TM_EMAIL_CONTACT_ADDRESS", "sysadmin@hotosm.org")
    TM_APP_BASE_URL               = get_env("TM_APP_BASE_URL", "https://tasks-dev.hotosm.org")
    TM_APP_API_URL                = get_env("TM_APP_API_URL", "https://tasking-manager-dev-api.hotosm.org/api")
    TM_REDIRECT_URI               = get_env("TM_REDIRECT_URI", "https://tasks-dev.hotosm.org/authorized")
    TM_APP_API_VERSION            = get_env("TM_APP_API_VERSION", "v2")
    TM_ORG_NAME                   = get_env("TM_ORG_NAME", "Humanitarian OpenStreetMap Team")
    TM_ORG_CODE                   = get_env("TM_ORG_CODE", "HOT")
    TM_ORG_LOGO                   = get_env("TM_ORG_LOGO", "https://cdn.hotosm.org/tasking-manager/uploads/1588741335578_hot-logo.png")
    TM_ORG_URL                    = get_env("TM_ORG_URL", "https://www.hotosm.org/")
    TM_ORG_PRIVACY_POLICY_URL     = get_env("TM_ORG_PRIVACY_POLICY_URL", "https://www.hotosm.org/privacy")
    TM_ORG_TWITTER                = get_env("TM_ORG_TWITTER", "http://twitter.com/hotosm")
    TM_ORG_FB                     = get_env("TM_ORG_FB", "https://www.facebook.com/hotosm")
    TM_ORG_INSTAGRAM              = get_env("TM_ORG_INSTAGRAM", "https://www.instagram.com/open.mapping.hubs/")
    TM_ORG_YOUTUBE                = get_env("TM_ORG_YOUTUBE", "https://www.youtube.com/user/hotosm")
    TM_ORG_GITHUB                 = get_env("TM_ORG_GITHUB", "https://github.com/hotosm")
    OSM_SERVER_URL                = get_env("OSM_SERVER_URL", "https://www.openstreetmap.org")
    OSM_SERVER_API_URL            = get_env("OSM_SERVER_API_URL", "https://api.openstreetmap.org")
    OSM_NOMINATIM_SERVER_URL      = get_env("OSM_NOMINATIM_SERVER_URL", "https://nominatim.openstreetmap.org")
    OSM_REGISTER_URL              = get_env("OSM_REGISTER_URL", "https://www.openstreetmap.org/user/new")
    POSTGRES_TEST_DB              = get_env("POSTGRES_TEST_DB", "tasking-manager-test")
    TM_SEND_PROJECT_EMAIL_UPDATES = get_env("TM_SEND_PROJECT_EMAIL_UPDATES", "1")
    TM_DEFAULT_LOCALE             = get_env("TM_DEFAULT_LOCALE", "en")
    TM_LOG_LEVEL                  = get_env("TM_LOG_LEVEL", "10")
    TM_LOG_DIR                    = get_env("TM_LOG_DIR", "/var/log/tasking-manager-logs")
    TM_SUPPORTED_LANGUAGES_CODES  = get_env("TM_SUPPORTED_LANGUAGES_CODES", "ar, cs, de, el, en, es, fa_IR, fr, he, hu, id, it, ja, ko, mg, ml, nl_NL, pt, pt_BR, ru, sv, sw, tl, tr, uk, zh_TW")
    TM_SUPPORTED_LANGUAGES        = get_env("TM_SUPPORTED_LANGUAGES", "عربى, Čeština, Deutsch, Ελληνικά, English, Español, فارسی, Français, עברית, Magyar, Indonesia, Italiano, 日本語, 한국어, Malagasy, Malayalam, Nederlands, Português, Português (Brasil), Русский язык, Svenska, Kiswahili, Filipino (Tagalog), Türkçe, Українська, 繁體中文")
    TM_DEFAULT_CHANGESET_COMMENT  = get_env("TM_DEFAULT_CHANGESET_COMMENT", "#hot-tm-stage-project")
    TM_ENVIRONMENT                = get_env("TM_ENVIRONMENT", "tasking-manager-develop")
    NEW_RELIC_ENVIRONMENT         = get_env("NEW_RELIC_ENVIRONMENT", "tasking-manager-develop")
    NEW_RELIC_CONFIG_FILE         = get_env("NEW_RELIC_CONFIG_FILE", "./scripts/aws/cloudformation/newrelic.ini")
    USE_SENTRY                    = get_env("USE_SENTRY", "true")
    # Uncomment the following as needed.
    # TM_TASK_AUTOUNLOCK_AFTER    = get_env("TM_TASK_AUTOUNLOCK_AFTER", "2h")
    # TM_MAPPER_LEVEL_INTERMEDIATE = get_env("TM_MAPPER_LEVEL_INTERMEDIATE", "250")
    # TM_MAPPER_LEVEL_ADVANCED   = get_env("TM_MAPPER_LEVEL_ADVANCED", "500")
    # TM_IMPORT_MAX_FILESIZE     = get_env("TM_IMPORT_MAX_FILESIZE", "1000000")
    # TM_MAX_AOI_AREA            = get_env("TM_MAX_AOI_AREA", "5000")
    # EXPORT_TOOL_S3_URL         = get_env("EXPORT_TOOL_S3_URL", "https://foorawdataapi.s3.amazonaws.com")
    # ENABLE_EXPORT_TOOL         = get_env("ENABLE_EXPORT_TOOL", "1")
  }
}
