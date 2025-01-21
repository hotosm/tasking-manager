include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/alb.hcl"
  # We want to reference the variables from the included config in this configuration, so we expose it.
  expose = true
}

terraform {
  source = "${include.envcommon.locals.base_source_url}?ref=tasking-manager-infra"
}

dependency "vpc" {
  config_path = "../vpc"
}

inputs = {
  # General VPC Configuration
  vpc_id      = dependency.vpc.outputs.vpc_id
  alb_subnets = dependency.vpc.outputs.public_subnets

  # TLS and Certificate Configuration
  acm_tls_cert_backend_arn = "arn:aws:acm:us-east-2:685797548389:certificate/810d8829-5e61-44f6-a030-f06eb5b66ae6"
}