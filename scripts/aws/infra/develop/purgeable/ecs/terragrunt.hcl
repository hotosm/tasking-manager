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

  #Enable Execute Command
  enable_execute_command = get_env("ECS_TASK_ENABLE_EXECUTE_COMMAND", "false") == "true" ? true : false

  # Merge secrets with: key:ValueFrom together
  container_secrets = concat(dependency.extras.outputs.container_secrets,
  dependency.rds.outputs.database_config_as_ecs_secrets_inputs)

  container_commands = [
    "sh",
    "-c",
    "alembic -c migrations/alembic.ini upgrade head && newrelic-admin run-program uvicorn backend.main:api --host 0.0.0.0 --port 5000 --workers 8  --log-level critical --no-access-log"
  ]

  ## Task count for ECS services.
  tasks_count = {
    desired_count   = 1
    min_healthy_pct = 100
    max_pct         = 300
  }

  health_check_grace_period_seconds = 60

  ## Scaling Policy Target Values
  scaling_target_values = {
    container_min_count = 1
    container_max_count = 3
  }

  # Merge non-sensetive together
  container_envvars = merge(
    dependency.rds.outputs.database_config_as_ecs_inputs,
    local.common_ecs_envs.locals.envs
  )

  # terraform.tfvars

  cpu_scaling_config = {
    enabled             = true
    threshold           = 60
    evaluation_periods  = 1
    period              = 30
    scale_up_cooldown   = 60
    scale_down_cooldown = 180
    scale_up_steps = [
      { lower_bound = 0, upper_bound = 10, adjustment = 1 },
      { lower_bound = 10, upper_bound = null, adjustment = 2 }
    ]
    scale_down_steps = [
      { lower_bound = null, upper_bound = -60, adjustment = -1 }
    ]
  }

  memory_scaling_config = {
    enabled             = true
    threshold           = 70
    evaluation_periods  = 1
    period              = 30
    scale_up_cooldown   = 60
    scale_down_cooldown = 180
    scale_up_steps = [
      { lower_bound = 0, upper_bound = 10, adjustment = 1 },
      { lower_bound = 10, upper_bound = null, adjustment = 2 },
    ]
    scale_down_steps = [
      { lower_bound = null, upper_bound = -40, adjustment = -1 }
    ]
  }

  request_scaling_config = {
    enabled             = true
    threshold           = 100
    evaluation_periods  = 1
    period              = 30
    scale_up_cooldown   = 60
    scale_down_cooldown = 180
    scale_up_steps = [
      { lower_bound = 0, upper_bound = 100, adjustment = 1 },
      { lower_bound = 100, upper_bound = null, adjustment = 2 },
    ]
    scale_down_steps = [
      { lower_bound = null, upper_bound = 0, adjustment = -1 }
    ]
  }
}
