# ---------------------------------------------------------------------------------------------------------------------
# TERRAGRUNT CONFIGURATION
# This is the configuration for Terragrunt, a thin wrapper for Terraform and OpenTofu that helps keep your code DRY and
# maintainable: https://github.com/gruntwork-io/terragrunt
# ---------------------------------------------------------------------------------------------------------------------

# Include the root `terragrunt.hcl` configuration. The root configuration contains settings that are common across all
# components and environments, such as how to configure remote state.
include "root" {
  path = find_in_parent_folders("root.hcl")
}

# Include the envcommon configuration for the component. The envcommon configuration contains settings that are common
# for the component across all environments.
include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/ecs.hcl"
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

## Add in any new inputs that you want to overide.
inputs = {
  # Inputs from dependencies (Rarely changed)
  service_subnets = dependency.vpc.outputs.private_subnets
  aws_vpc_id = dependency.vpc.outputs.vpc_id
  service_security_groups = [ dependency.alb.outputs.load_balancer_app_security_group ]
  deployment_environment = local.environment_vars.locals.environment
  load_balancer_settings = {
    enabled                 = true
    target_group_arn        = dependency.alb.outputs.target_group_arn
    target_group_arn_suffix = dependency.alb.outputs.target_group_arn_suffix
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

  container_commands = [
                "uvicorn",
                "backend.main:api",
                "--host",
                "0.0.0.0",
                "--port",
                "5000",
                "--log-level",
                "error",
                "--workers",
                "8"
            ],

  ## Task count for ECS services.
  tasks_count = {
      desired_count   = 1
      min_healthy_pct = 25
      max_pct         = 200
    }
  
  ## Scaling Policy Target Values
  scaling_target_values = {
    container_min_count = 2
    container_max_count = 16
  }

  # Merge non-sensetive together 
  container_envvars = merge(
    dependency.rds.outputs.database_config_as_ecs_inputs,
    {
      EXTRA_CORS_ORIGINS            = get_env("EXTRA_CORS_ORIGINS" ,"[\"https://tasks-stage.hotosm.org\", \"http://localhost:3000\"]")
      TM_SMTP_HOST                  = get_env("TM_SMTP_HOST" ,"email-smtp.us-east-1.amazonaws.com")
      TM_SMTP_PORT                  = get_env("TM_SMTP_PORT" ,"587")
      TM_SMTP_USE_TLS               = get_env("TM_SMTP_USE_TLS" ,"1")
      TM_SMTP_USE_SSL               = get_env("TM_SMTP_USE_SSL" ,"0")
      TM_EMAIL_FROM_ADDRESS         = get_env("TM_EMAIL_FROM_ADDRESS", "noreply-tasks@hotosm.org")
      TM_EMAIL_CONTACT_ADDRESS      = get_env("TM_EMAIL_CONTACT_ADDRESS", "sysadmin@hotosm.org")
      TM_APP_BASE_URL               = get_env("TM_APP_BASE_URL" ,"https://tasks-stage.hotosm.org")
      TM_APP_API_URL                = get_env("TM_APP_API_URL" ,"https://tasking-manager-staging-api.hotosm.org")
      TM_APP_API_VERSION            = get_env("TM_APP_API_VERSION" ,"v2")
      TM_ORG_NAME                   = get_env("TM_ORG_NAME" ,"Humanitarian OpenStreetMap Team")
      TM_ORG_CODE                   = get_env("TM_ORG_CODE" ,"HOT")
      TM_ORG_LOGO                   = get_env("TM_ORG_LOGO" ,"https://cdn.img.url/logo.png")
      TM_ORG_URL                    = get_env("TM_ORG_URL" ,"example.com")
      TM_ORG_PRIVACY_POLICY_URL     = get_env("TM_ORG_PRIVACY_POLICY_URL" ,"https://www.hotosm.org/privacy")
      TM_ORG_TWITTER                = get_env("TM_ORG_TWITTER" ,"http://twitter.com/hotosm")
      TM_ORG_FB                     = get_env("TM_ORG_FB" ,"https://www.facebook.com/hotosm")
      TM_ORG_INSTAGRAM              = get_env("TM_ORG_INSTAGRAM" ,"https://www.instagram.com/open.mapping.hubs/")
      TM_ORG_YOUTUBE                = get_env("TM_ORG_YOUTUBE" ,"https://www.youtube.com/user/hotosm")
      TM_ORG_GITHUB                 = get_env("TM_ORG_GITHUB" ,"https://github.com/hotosm")
      OSM_SERVER_URL                = get_env("OSM_SERVER_URL" ,"https://www.openstreetmap.org")
      OSM_SERVER_API_URL            = get_env("OSM_SERVER_API_URL" ,"https://api.openstreetmap.org")
      OSM_NOMINATIM_SERVER_URL      = get_env("OSM_NOMINATIM_SERVER_URL" ,"https://nominatim.openstreetmap.org")
      OSM_REGISTER_URL              = get_env("OSM_REGISTER_URL" ,"https://www.openstreetmap.org/user/new")
      POSTGRES_TEST_DB              = get_env("POSTGRES_TEST_DB" ,"tasking-manager-test")
      UNDERPASS_URL                 = get_env("UNDERPASS_URL" ,"https://underpass.hotosm.org")
      TM_REDIRECT_URI               = get_env("TM_REDIRECT_URI" ,"https://tasks-stage.hotosm.org/authorized")
      TM_SEND_PROJECT_EMAIL_UPDATES = get_env("TM_SEND_PROJECT_EMAIL_UPDATES" ,"1")
      TM_DEFAULT_LOCALE             = get_env("TM_DEFAULT_LOCALE" ,"en")
      TM_LOG_LEVEL                  = get_env("TM_LOG_LEVEL" ,10)
      TM_LOG_DIR                    = get_env("TM_LOG_DIR", "logs")
      TM_SUPPORTED_LANGUAGES_CODES  = get_env("TM_SUPPORTED_LANGUAGES_CODES", "en, es")
      TM_SUPPORTED_LANGUAGES        = get_env("TM_SUPPORTED_LANGUAGES", "English, Español")
      TM_DEFAULT_CHANGESET_COMMENT  = get_env("TM_DEFAULT_CHANGESET_COMMENT", "#hot-tm-stage-project")
      TM_ENVIRONMENT                = get_env("TM_ENVIRONMENT", "tasking-manager-staging")
      # Uncomment the following as needed.
      # TM_TASK_AUTOUNLOCK_AFTER    = get_env("TM_TASK_AUTOUNLOCK_AFTER", "2h")
      # TM_MAPPER_LEVEL_INTERMEDIATE = get_env("TM_MAPPER_LEVEL_INTERMEDIATE", "250")
      # TM_MAPPER_LEVEL_ADVANCED   = get_env("TM_MAPPER_LEVEL_ADVANCED", "500")
      # TM_IMPORT_MAX_FILESIZE     = get_env("TM_IMPORT_MAX_FILESIZE", "1000000")
      # TM_MAX_AOI_AREA            = get_env("TM_MAX_AOI_AREA", "5000")
      # EXPORT_TOOL_S3_URL         = get_env("EXPORT_TOOL_S3_URL", "https://foorawdataapi.s3.amazonaws.com")
      # ENABLE_EXPORT_TOOL         = get_env("ENABLE_EXPORT_TOOL", "1")
  })
}