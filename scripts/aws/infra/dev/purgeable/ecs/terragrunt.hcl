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
  source = "${include.envcommon.locals.base_source_url}?ref=tasking-manager-infra"
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
  base_source_url = "git::https://github.com/hotosm/terraform-aws-ecs/"
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

dependency "extras" {
  config_path = "../../non-purgeable/extras"
}

# Add in any new inputs that you want to overide.

inputs = {

  aws_vpc_id   = dependency.vpc.outputs.vpc_id

  scaling_target_values = {
    container_min_count = 1
    container_max_count = 2
  }

  load_balancer_settings = {
    enabled                 = true
    target_group_arn        = dependency.alb.outputs.target_group_arn
    target_group_arn_suffix =dependency.alb.outputs.target_group_arn_suffix
    arn_suffix              = dependency.alb.outputs.load_balancer_arn_suffix
    scaling_request_count   = 200
  }

  task_role_arn = dependency.extras.outputs.ecs_task_role_arn

  service_security_groups = [
    dependency.alb.outputs.load_balancer_app_security_group
  ]

  # Merge secrets with: key:ValueFrom together
  container_secrets = concat(dependency.extras.outputs.container_secrets, 
                              dependency.rds.outputs.database_config_as_ecs_secrets_inputs)

  # Merge non-sensetive together 
  container_envvars = merge(
    dependency.rds.outputs.database_config_as_ecs_inputs,
    {
    TM_SMTP_HOST                 = "smtp.gmail.com"
    TM_SMTP_PORT                 = "587"
    TM_SMTP_USE_TLS              = "0"
    TM_SMTP_USE_SSL              = "1"
    TM_APP_BASE_URL              = "https://tmtf.naxa.com.np"
    TM_APP_API_URL               = "https://tmtf.naxa.com.np/api"
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
    POSTGRES_TEST_DB             = "tasking-manager-test"
    UNDERPASS_URL                = "https://underpass.hotosm.org"
    TM_REDIRECT_URI              = "https://tmtf.naxa.com.np/authorized"
    TM_SEND_PROJECT_EMAIL_UPDATES = "1"
    TM_DEFAULT_LOCALE            = "en"
    # Uncomment the following as needed
    # TM_EMAIL_FROM_ADDRESS      = "noreply@localhost"
    # TM_EMAIL_CONTACT_ADDRESS   = "sysadmin@localhost"
    # TM_LOG_LEVEL               = "DEBUG"
    # TM_LOG_DIR                 = "logs"
    # TM_SUPPORTED_LANGUAGES_CODES = "en, es"
    # TM_SUPPORTED_LANGUAGES     = "English, Español"
    # TM_TASK_AUTOUNLOCK_AFTER   = "2h"
    # TM_MAPPER_LEVEL_INTERMEDIATE = "250"
    # TM_MAPPER_LEVEL_ADVANCED   = "500"
    # TM_IMPORT_MAX_FILESIZE     = "1000000"
    # TM_MAX_AOI_AREA            = "5000"
    # EXPORT_TOOL_S3_URL         = "https://foorawdataapi.s3.amazonaws.com"
    # ENABLE_EXPORT_TOOL         = "1"

  })

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

}