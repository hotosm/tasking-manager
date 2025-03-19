include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path   = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/rds.hcl"
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
  subnet_ids = ["subnet-05aa252699783b4cf","subnet-0a75cddfef3213c51","subnet-0a8b06831b3de5f66","subnet-0f76ca222b0544a40",
  "subnet-03919b5e26cba5733","subnet-0b91332acbe8b1a4c"]

  ## RDS Module inputs
  serverless_capacity = {
      minimum = 1   # Lowest possible APU for Aurora Serverless
      maximum = 4   # Max APU to keep cost low for Stag
    }

  ## RDS Backup/Snapshot Config
  backup = {
    retention_days            = 7
    skip_final_snapshot       = true
    final_snapshot_identifier = "final"
  }

  # RDS Dev Deployment only.
  public_access     = true
  deletion_protection     = true
}
