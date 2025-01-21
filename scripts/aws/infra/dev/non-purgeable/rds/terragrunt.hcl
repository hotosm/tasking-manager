include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path   = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/rds.hcl"
  expose = true
}

terraform {
  // source = "${include.envcommon.locals.base_source_url}?ref=tasking-manager-infra"
  source = "${include.envcommon.locals.base_source_url}?ref=tasking-manager-infra"
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
      minimum = 0.5 # Lowest possible APU for Aurora Serverless
      maximum = 4   # Max APU to keep cost low for dev
    }
  
  ## RDS Backup/Snapshot Config
  backup = {
    retention_days            = 1
    skip_final_snapshot       = true
    final_snapshot_identifier = "final"
  }

  # RDS Dev Deployment only.
  public_access     = true
  deletion_protection     = true
}