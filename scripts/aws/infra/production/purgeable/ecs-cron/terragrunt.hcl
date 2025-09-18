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
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/ecs-cron.hcl"
  # We want to reference the variables from the included config in this configuration, so we expose it.
  expose = true
}

# Configure the version of the module to use in this environment. This allows you to promote new versions one
# environment at a time (e.g., qa -> stage -> prod).
terraform {
  source = "${include.envcommon.locals.base_source_url}?ref=v1.2.1"
}

locals {
  # Automatically load environment-level variables
  environment_vars = read_terragrunt_config(find_in_parent_folders("deployment_env.hcl"))
  common_ecs_envs  = read_terragrunt_config(find_in_parent_folders("common-ecs-env.hcl"))
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
  service_subnets         = dependency.vpc.outputs.private_subnets
  aws_vpc_id              = dependency.vpc.outputs.vpc_id
  service_security_groups = [dependency.alb.outputs.load_balancer_app_security_group]
  deployment_environment  = local.environment_vars.locals.environment

  task_role_arn = dependency.extras.outputs.ecs_task_role_arn

  service_security_groups = [
    dependency.alb.outputs.load_balancer_app_security_group
  ]

  #Enable Execute Command
  enable_execute_command = get_env("ECS_TASK_ENABLE_EXECUTE_COMMAND", "false") == "true" ? true : false

  # Merge secrets with: key:ValueFrom together
  container_secrets = concat(dependency.extras.outputs.container_secrets,
  dependency.rds.outputs.database_config_as_ecs_secrets_inputs)

  container_commands = [
    "sh",
    "-c",
    "python3 backend/cron_jobs.py"
  ]

  ## Task count for ECS services.
  tasks_count = {
    desired_count   = 1
    min_healthy_pct = 100
    max_pct         = 200
  }

  ## Scaling Policy Target Values
  scaling_target_values = {
    container_min_count = 1
    container_max_count = 1
  }

  # Merge non-sensetive together
  container_envvars = merge(
    dependency.rds.outputs.database_config_as_ecs_inputs,
    local.common_ecs_envs.locals.envs
  )

  # Override image to use "main" image tag (default is environment variable eg. develop)
  container_settings = {
    app_port         = 80
    cpu_architecture = "X86_64"
    image_url        = "ghcr.io/hotosm/tasking-manager/backend"
    image_tag        = "main"
    service_name     = format("%s-%s-%s-%s", local.environment_vars.locals.application, local.environment_vars.locals.team, local.environment_vars.locals.environment, "cron")
  }
}
