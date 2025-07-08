include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/alb.hcl"
  # We want to reference the variables from the included config in this configuration, so we expose it.
  expose = true
}

terraform {
  source = "${include.envcommon.locals.base_source_url}?ref=v1.0"
}

dependency "vpc" {
  config_path = "../vpc"
}

inputs = {
  # General VPC Configuration
  vpc_id      = dependency.vpc.outputs.vpc_id
  alb_subnets = dependency.vpc.outputs.public_subnets

  # TLS and Certificate Configuration
  acm_tls_cert_backend_arn = get_env("ACM_TLS_CERT_BACKEND_ARN", "arn:aws:acm:us-east-1:670261699094:certificate/1d74321b-1e5b-4e31-b97a-580deb39c539")
}
