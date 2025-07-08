include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/vpc.hcl"
  # We want to reference the variables from the included config in this configuration, so we expose it.
  expose = true
}

terraform {
  source = "${include.envcommon.locals.base_source_url}?ref=oo-v1.0"
}

## Modify inputs for overriding _envcommon's inputs.

inputs = {
  vpc_id = "vpc-08ecfc1c7844c7c5a"
  private_subnets = [
    "subnet-05aa252699783b4cf",
    "subnet-0a75cddfef3213c51",
    "subnet-0a8b06831b3de5f66",
    "subnet-0f76ca222b0544a40",
    "subnet-03919b5e26cba5733",
    "subnet-0b91332acbe8b1a4c",
  ]
  public_subnets = [
    "subnet-0be484781db027eaf",
    "subnet-08d4ebd1a6c272fa2",
    "subnet-0807976e2acba8301",
    "subnet-08448f588d40c002e",
    "subnet-0a5597ba3564eef97",
    "subnet-0176ed40bffff6728",
  ]
}
