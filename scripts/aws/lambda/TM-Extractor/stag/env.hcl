# Set common variables for the environment. This is automatically pulled in in the root terragrunt.hcl configuration to
# feed forward to the child modules.
# Check ../README.md  ## Inputs and Local Variables for details.

locals {
  environment = "stag"
  account_name   = "hotosm"
  aws_profile = "default"
  aws_region = "ap-south-1"
  application = "tasking-manager"
  team  = "HOTOSM"
  creator = "HOTOSM"
  owner = "HOTOSM"
}
