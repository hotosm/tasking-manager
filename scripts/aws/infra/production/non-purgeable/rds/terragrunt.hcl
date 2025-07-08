include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path   = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/rds.hcl"
  expose = true
}

terraform {
  source = "${include.envcommon.locals.base_source_url}?ref=v1.0"
}

dependency "vpc" {
  config_path = "../vpc"
}

# Add in any new inputs that you want to overide.
inputs = {
  ## VPC Inputs for RDS Instance
  vpc_id     = dependency.vpc.outputs.vpc_id
  subnet_ids = dependency.vpc.outputs.private_subnets

  ## RDS Module inputs
  serverless_capacity = {
    minimum = 4 # Lowest possible APU for Aurora Serverless
    maximum = 16 # Max APU to keep cost low for Stag
  }

  ## RDS Backup/Snapshot Config
  backup = {
    retention_days            = 7
    skip_final_snapshot       = true
    final_snapshot_identifier = "final"
  }

  # RDS Dev Deployment only.
  public_access       = false
  deletion_protection = true
}
