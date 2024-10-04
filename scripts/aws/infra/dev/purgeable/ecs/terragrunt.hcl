# ---------------------------------------------------------------------------------------------------------------------
# TERRAGRUNT CONFIGURATION
# This is the configuration for Terragrunt, a thin wrapper for Terraform and OpenTofu that helps keep your code DRY and
# maintainable: https://github.com/gruntwork-io/terragrunt
# ---------------------------------------------------------------------------------------------------------------------

# Include the root `terragrunt.hcl` configuration. The root configuration contains settings that are common across all
# components and environments, such as how to configure remote state.
include "root" {
  path = find_in_parent_folders()
}

# Include the envcommon configuration for the component. The envcommon configuration contains settings that are common
# for the component across all environments.
include "envcommon" {
  path = "${dirname(find_in_parent_folders())}/_envcommon/ecs.hcl"
  # We want to reference the variables from the included config in this configuration, so we expose it.
  expose = true
}

# Configure the version of the module to use in this environment. This allows you to promote new versions one
# environment at a time (e.g., qa -> stage -> prod).
terraform {
  source = "${include.envcommon.locals.base_source_url}"
}

locals {
  # Automatically load environment-level variables
  environment_vars = read_terragrunt_config(find_in_parent_folders("deployment_env.hcl"))

  # Extract out common variables for reuse
  environment = local.environment_vars.locals.environment
  application = local.environment_vars.locals.application
  team = local.environment_vars.locals.team
  aws_region = local.environment_vars.locals.aws_region
  default_tags = local.environment_vars.locals.default_tags


  # Expose the base source URL so different versions of the module can be deployed in different environments. This will
  # be used to construct the terraform block in the child terragrunt configurations.
  base_source_url = "file:///app/modules/terraform-aws-ecs"
  }

# ---------------------------------------------------------------------------------------------------------------------
# We don't need to override any of the common parameters for this environment, so we don't specify any other parameters.
# ---------------------------------------------------------------------------------------------------------------------

dependency "vpc" {
  config_path = "../../non-purgeable/vpc"
}

dependency "alb" {
  config_path = "../../non-purgeable/alb"
}

dependency "rds" {
  config_path = "../../non-purgeable/rds"
}

dependency "iam" {
  config_path = "../../non-purgeable/iam"
}

dependency "secrets" {
  config_path = "../../non-purgeable/secrets"
}

# Add in any new inputs that you want to overide.

inputs = {

  service_name = format("%s-%s-%s-%s", local.application, local.team, local.environment, "backend")
  aws_vpc_id   = dependency.vpc.outputs.vpc_id

  scaling_target_values = {
    container_min_count = 1
    container_max_count = 1
  }

  // ecs_cluster_name = aws_ecs_cluster.main.name
  // ecs_cluster_arn  = aws_ecs_cluster.main.arn

  load_balancer_settings = {
    enabled                 = true
    target_group_arn        = dependency.alb.outputs.target_group_arn
    target_group_arn_suffix =dependency.alb.outputs.target_group_arn_suffix
    arn_suffix              = dependency.alb.outputs.load_balancer_arn_suffix
    scaling_request_count   = 200
  }
  task_role_arn = dependency.iam.outputs.ecs_task_role_arn

  service_security_groups = [
    dependency.alb.outputs.load_balancer_app_security_group
  ]
  container_secrets = dependency.secrets.outputs.container_secrets_key_arn

  container_envvars = {
    TM_APP_BASE_URL              = "https://tm-ecs-frontend.naxa.com.np"
    TM_APP_API_URL               = "https://tm-ecs.naxa.com.np/api"
    TM_APP_API_VERSION           = "v2"
    TM_ORG_NAME                  = "Humanitarian OpenStreetMap Team"
    TM_ORG_CODE                  = "HOT"
    TM_ORG_LOGO                  = "https://cdn.img.url/logo.png"
    TM_ORG_URL                   = "example.com"
    TM_ORG_PRIVACY_POLICY_URL    = "https://www.hotosm.org/privacy"
    TM_ORG_TWITTER               = "http://twitter.com/hotosm"
    TM_ORG_FB                    = "https://www.facebook.com/hotosm"
    TM_ORG_INSTAGRAM             = "https://www.instagram.com/open.mapping.hubs/"
    TM_ORG_YOUTUBE               = "https://www.youtube.com/user/hotosm"
    TM_ORG_GITHUB                = "https://github.com/hotosm"
    OSM_SERVER_URL               = "https://www.openstreetmap.org"
    OSM_SERVER_API_URL           = "https://api.openstreetmap.org"
    OSM_NOMINATIM_SERVER_URL     = "https://nominatim.openstreetmap.org"
    OSM_REGISTER_URL             = "https://www.openstreetmap.org/user/new"
    POSTGRES_DB                  = "tm_db_new"
    POSTGRES_USER                = "tm"
    POSTGRES_ENDPOINT            = "43.204.84.238"
    POSTGRES_PORT                = "5432"
    POSTGRES_TEST_DB             = "tasking-manager-test"
    UNDERPASS_URL                = "https://underpass.hotosm.org"
    TM_REDIRECT_URI              = "https://tm-ecs.naxa.com.np/authorized"
    TM_SENTRY_BACKEND_DSN        = "https://5f5afa9becbcc183ef1e184eae604c38@o1189705.ingest.sentry.io/4505945825148928"
    TM_SENTRY_FRONTEND_DSN       = "https://cb7fad0aabf90b255fe2ff32622dea49@o1189705.ingest.sentry.io/4505945830916096"
    TM_SEND_PROJECT_EMAIL_UPDATES = "1"
    TM_DEFAULT_LOCALE            = "en"

    # Uncomment the following as needed
    # TM_EMAIL_FROM_ADDRESS      = "noreply@localhost"
    # TM_EMAIL_CONTACT_ADDRESS   = "sysadmin@localhost"
    # TM_SMTP_HOST               = ""
    # TM_SMTP_PORT               = "25"
    # TM_SMTP_USER               = ""
    # TM_SMTP_PASSWORD           = ""
    # TM_SMTP_USE_TLS            = "0"
    # TM_SMTP_USE_SSL            = "1"
    # TM_LOG_LEVEL               = "DEBUG"
    # TM_LOG_DIR                 = "logs"
    # TM_SUPPORTED_LANGUAGES_CODES = "en, es"
    # TM_SUPPORTED_LANGUAGES     = "English, Español"
    # TM_TASK_AUTOUNLOCK_AFTER   = "2h"
    # TM_MAPPER_LEVEL_INTERMEDIATE = "250"
    # TM_MAPPER_LEVEL_ADVANCED   = "500"
    # TM_IMPORT_MAX_FILESIZE     = "1000000"
    # TM_MAX_AOI_AREA            = "5000"
    # TM_SENTRY_BACKEND_DSN      = "https://foo.ingest.sentry.io/1234567"
    # TM_SENTRY_FRONTEND_DSN     = "https://bar.ingest.sentry.io/8901234"
    # EXPORT_TOOL_S3_URL         = "https://foorawdataapi.s3.amazonaws.com"
    # ENABLE_EXPORT_TOOL         = "1"
  }

  service_subnets = dependency.vpc.outputs.private_subnets

  container_capacity = {
    cpu       = 512
    memory_mb = 1024
  }

  container_settings = {
    app_port         = 80
    cpu_architecture = "X86_64"
    image_url        = "ghcr.io/hotosm/tasking-manager-backend"
    image_tag        = "fastapi"
    service_name     = format("%s-%s-%s-%s", local.application, local.team, local.environment, "fastapi")
  }

  log_configuration = {
    logdriver = "awslogs"
    options = {
      awslogs-group         = format("%s-%s-%s-%s", local.application, local.team, local.environment, "fastapi")
      awslogs-region        = local.aws_region
      awslogs-stream-prefix = "api"
    }
  }

  default_tags = local.default_tags
  // efs_settings = False
  
}