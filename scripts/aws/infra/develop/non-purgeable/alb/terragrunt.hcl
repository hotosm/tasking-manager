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

# dependency "vpc" {
#   config_path = "../vpc"
# }

# Add in any new inputs that you want to overide.
inputs = {
  ## VPC Inputs for RDS Instance
  vpc_id     = "vpc-08ecfc1c7844c7c5a"
  alb_subnets = ["subnet-0176ed40bffff6728","subnet-08448f588d40c002e"]

  # TLS and Certificate Configuration
  acm_tls_cert_backend_arn = get_env("ACM_TLS_CERT_BACKEND_ARN", "arn:aws:acm:us-east-1:670261699094:certificate/1d74321b-1e5b-4e31-b97a-580deb39c539")
}
