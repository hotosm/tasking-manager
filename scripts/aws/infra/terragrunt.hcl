# ---------------------------------------------------------------------------------------------------------------------
# TERRAGRUNT CONFIGURATION
# Terragrunt is a thin wrapper for Terraform that provides extra tools for working with multiple Terraform modules,
# remote state, and locking: https://github.com/gruntwork-io/terragrunt
# ---------------------------------------------------------------------------------------------------------------------

locals {
  # Automatically load deployment environment-level variables
  deployment_vars = read_terragrunt_config(find_in_parent_folders("deployment_env.hcl"))

  # Extract the variables we need for easy access
  account_name = local.deployment_vars.locals.account_name
  aws_profile = local.deployment_vars.locals.aws_profile
  aws_region   = local.deployment_vars.locals.aws_region
  environment = local.deployment_vars.locals.environment
  application = local.deployment_vars.locals.application
  team = local.deployment_vars.locals.team
  creator = local.deployment_vars.locals.creator
  owner = local.deployment_vars.locals.owner
}

# Generate an AWS provider block
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
  provider "aws" {
      region = "${local.aws_region}"
      profile = "${local.aws_profile}"
      default_tags {
        tags = {
          Environment = "${local.environment}"
          Application = "${local.application}"
          Team        = "${local.team}"
          Creator     = "${local.creator}"
          Owner       = "${local.owner}"
        }
      }
    }
EOF
}

#Export AWS_PROFILE env var.
terraform {
  extra_arguments "aws_profile" {
    commands = [
      "init",
      "apply",
      "refresh",
      "import",
      "plan",
      "destroy"
    ]

    env_vars = {
      AWS_PROFILE = "${local.aws_profile}"
    }
  }
}

# Configure Terragrunt to automatically store tfstate files in an S3 bucket
remote_state {
  backend = "s3"
  config = {
    encrypt        = true
    bucket         = "${local.application}-${local.team}-${local.environment}"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = local.aws_region
    dynamodb_table = "tm-locks"
    profile = "${local.aws_profile}"
  }
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# GLOBAL PARAMETERS
# These variables apply to all configurations in this subfolder. These are automatically merged into the child
# `terragrunt.hcl` config via the include block.
# ---------------------------------------------------------------------------------------------------------------------

# Configure root level variables that all resources can inherit. This is especially helpful with multi-account configs
# where terraform_remote_state data sources are placed directly into the modules.
inputs = merge(
  local.deployment_vars.locals,
)
