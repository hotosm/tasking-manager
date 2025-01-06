include "root" {
  path = find_in_parent_folders()
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders())}/_envcommon/extras.hcl"
  # We want to reference the variables from the included config in this configuration, so we expose it.
  expose = true
}

terraform {
  source = "${include.envcommon.locals.base_source_url}"
}

inputs = {
  ## Override them by exporting the vars to the environment.
  ## Example:
  ## export TM_SECRET=`openssl rand -hex 32`
  container_secrets = [
    {
      name      = "TM_SECRET"
      valueFrom = get_env("TM_SECRET", "default_secret_value")
    },
    {
      name      = "TM_CLIENT_ID"
      valueFrom = get_env("TM_CLIENT_ID", "default_client_id")
    },
    {
      name      = "TM_CLIENT_SECRET"
      valueFrom = get_env("TM_CLIENT_SECRET", "default_client_secret")
    },
    {
      name      = "OHSOME_STATS_TOKEN"
      valueFrom = get_env("OHSOME_STATS_TOKEN", "default_ohsome_stats_token")
    },
    {
      name      = "TM_SMTP_USER"
      valueFrom = get_env("TM_SMTP_USER", "default_smtp_user")
    },
    {
      name      = "TM_SMTP_PASSWORD"
      valueFrom = get_env("TM_SMTP_PASSWORD", "default_smtp_password")
    },
    {
      name      = "TM_SENTRY_FRONTEND_DSN"
      valueFrom = get_env("TM_SMTP_PASSWORD", "https://foo.ingest.sentry.io/1234567")
    },
    {
      name      = "TM_SENTRY_BACKEND_DSN"
      valueFrom = get_env("TM_SMTP_PASSWORD", "https://bar.ingest.sentry.io/8901234")
    }
  ]
}