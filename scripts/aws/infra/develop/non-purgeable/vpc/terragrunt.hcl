include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/vpc.hcl"
  # We want to reference the variables from the included config in this configuration, so we expose it.
  expose = true
}

terraform {
  source = "${include.envcommon.locals.base_source_url}?ref=tasking-manager-infra"
}

## Modify inputs for overriding _envcommon's inputs.

# inputs = {
#   deployment_environment = "dev" # or any other value you need
# }
