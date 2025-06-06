# ---------------------------------------------------------------------------------------------------------------------
# COMMON TERRAGRUNT CONFIGURATION
# This is the common component configuration for mysql. The common variables for each environment to
# deploy mysql are defined here. This configuration will be merged into the environment configuration
# via an include block.
# ---------------------------------------------------------------------------------------------------------------------

# Terragrunt will copy the Terraform configurations specified by the source parameter, along with any files in the
# working directory, into a temporary folder, and execute your Terraform commands in that folder. If any environment
# needs to deploy a different module version, it should redefine this block with a different ref to override the
# deployed version.
terraform {
  source = "${local.base_source_url}?ref=tasking-manager-infra"
}

# ---------------------------------------------------------------------------------------------------------------------
# Locals are named constants that are reusable within the configuration.
# ---------------------------------------------------------------------------------------------------------------------
locals {
  # Automatically load environment-level variables
  environment_vars = read_terragrunt_config(find_in_parent_folders("deployment_env.hcl"))

  # Extract out common variables for reuse
  environment  = local.environment_vars.locals.environment
  application  = local.environment_vars.locals.application
  team         = local.environment_vars.locals.team

  # Expose the base source URL so different versions of the module can be deployed in different environments. This will
  # be used to construct the terraform block in the child terragrunt configurations.
  base_source_url = "git::https://github.com/hotosm/terraform-aws-ecs/"
}

# ---------------------------------------------------------------------------------------------------------------------
# MODULE PARAMETERS
# These are the variables we have to pass in to use the module. This defines the parameters that are common across all
# environments.
# ---------------------------------------------------------------------------------------------------------------------
# Defaults,  overridden by env.hcl

inputs = {
  service_name = format("%s-%s-%s-%s", local.application, local.team, local.environment, "backend")

  log_configuration = {
    logdriver = "awslogs"
    options = {
      awslogs-group         = format("%s-%s-%s-%s", local.application, local.team, local.environment, "cron")
      awslogs-region        = local.environment_vars.locals.aws_region
      awslogs-stream-prefix = "cron"
    }
  }

  container_settings = {
    app_port         = 80
    cpu_architecture = "X86_64"
    image_url        = "ghcr.io/hotosm/tasking-manager/backend"
    image_tag        = "fastapi"
    service_name     = format("%s-%s-%s-%s", local.application, local.team, local.environment, "cron")
  }

  container_capacity = {
    cpu       = 2048
    memory_mb = 4096
  }
}
