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

  # Expose the base source URL so different versions of the module can be deployed in different environments. This will
  # be used to construct the terraform block in the child terragrunt configurations.
  base_source_url = "git::https://github.com/hotosm/terraform-aws-rds/"
}

# ---------------------------------------------------------------------------------------------------------------------
# MODULE PARAMETERS
# These are the variables we have to pass in to use the module. This defines the parameters that are common across all
# environments.
# ---------------------------------------------------------------------------------------------------------------------
# Defaults,  overridden by env.hcl

inputs = {

  project_meta = {
    name    = local.environment_vars.locals.project
    short_name = local.environment_vars.locals.short_name
    team       = local.environment_vars.locals.team
    version    = local.environment_vars.locals.version
    url        = local.environment_vars.locals.url
  }

  org_meta = {
    name       = local.environment_vars.locals.project
    short_name = local.environment_vars.locals.short_name
    url        = local.environment_vars.locals.url
  }

  deployment_environment = local.environment_vars.locals.environment
  deletion_protection    = true
  // default_tags           = var.default_tags

  database = {
    name            = join("_", [
        local.environment_vars.locals.short_name,
        local.environment_vars.locals.environment,
    ])
    admin_user      = join("_", [
        local.environment_vars.locals.short_name,
        local.environment_vars.locals.environment,
    ])
    password_length = 48
    engine_version  = 15
    port            = 5432
  }

  network_type = "IPV4"
}