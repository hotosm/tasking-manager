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
  environment = local.environment_vars.locals.environment
  application = local.environment_vars.locals.application
  team = local.environment_vars.locals.team
  
  
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
            name       = "tasking-manager"
            short_name = "tm"
            version    = "1.1.2"
            image_tag  = "develop"
            url        = "https://tasks.hotosm.org"
        }
    org_meta     = {
        name       = "hotosm.org"
        short_name = "hot"
        url        = "hotosm.org"
    }

    deployment_environment = local.environment
    deletion_protection    = false
    // default_tags           = var.default_tags

    serverless_capacity = {
        minimum = 0.5  # Lowest possible APU for Aurora Serverless
        maximum = 1    # Max APU to keep cost low for dev
    }
    
    database = {
        name            = "tm"
        admin_user      = "tmadmin"
        password_length = 48
        engine_version  = 15
        port            = 5432
    }

    backup = {
        retention_days            = 1
        skip_final_snapshot       = true
        final_snapshot_identifier = "final"
    }
    network_type = "IPV4"
}