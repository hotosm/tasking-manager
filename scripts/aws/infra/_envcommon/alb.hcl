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
  # Sourcing from https://github.com/hotosm/TM-Extractor/
  # source = "${local.base_source_url}?ref=v1.0.1"
    source = "${local.base_source_url}"

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
  base_source_url = "git::file:///app/modules/terraform-aws-alb"
  }

# ---------------------------------------------------------------------------------------------------------------------
# MODULE PARAMETERS
# These are the variables we have to pass in to use the module. This defines the parameters that are common across all
# environments.
# ---------------------------------------------------------------------------------------------------------------------
# Defaults,  overridden by env.hcl

inputs = {
  app_port            = "5000" #TODOTM
  acm_tls_cert_backend_arn = "arn:aws:acm:us-east-2:685797548389:certificate/810d8829-5e61-44f6-a030-f06eb5b66ae6" #TODOTM
  health_check_path   = "/api/v2/system/heartbeat/" #TODOTM
  alb_name              = format("%s-%s-%s-%s", local.application, local.team, local.environment, "alb")
  target_group_name     = format("%s-%s-%s-%s", local.application, local.team, local.environment, "tg")
}