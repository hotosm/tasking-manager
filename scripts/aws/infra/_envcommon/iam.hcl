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
  env = local.environment_vars.locals.environment

  # Expose the base source URL so different versions of the module can be deployed in different environments. This will
  # be used to construct the terraform block in the child terragrunt configurations.
  base_source_url = "file:///app/modules/terraform-aws-iam"
  }

# ---------------------------------------------------------------------------------------------------------------------
# MODULE PARAMETERS
# These are the variables we have to pass in to use the module. This defines the parameters that are common across all
# environments.
# ---------------------------------------------------------------------------------------------------------------------
# Defaults,  overridden by env.hcl

inputs = {
  deployment_environment = local.env
  project_meta = {
    name       = "tasking-manager"
    short_name = "tm"
    version    = "1.1.2"
    image_tag  = "develop"
    url        = "https://tasks.hotosm.org"
  }
  s3_bucket_name = "tasking-manager-hotosm-dev"
  
}
