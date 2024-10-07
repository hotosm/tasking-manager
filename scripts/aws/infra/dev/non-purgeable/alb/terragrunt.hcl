include "root" {
  path = find_in_parent_folders()
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders())}/_envcommon/alb.hcl"
  # We want to reference the variables from the included config in this configuration, so we expose it.
  expose = true
}

terraform {
  source = "${include.envcommon.locals.base_source_url}?ref=tasking-manager-infra"
}

dependency "vpc" {
  config_path = "../vpc"
}

# Add in any new inputs that you want to overide.
inputs = {
  vpc_id              = dependency.vpc.outputs.vpc_id
  alb_subnets  = dependency.vpc.outputs.public_subnets
}