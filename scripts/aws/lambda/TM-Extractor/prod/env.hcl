# Set common variables for the environment. This is automatically pulled in in the root terragrunt.hcl configuration to
# feed forward to the child modules.

locals {
  environment = "prod"
  account_name   = "hotosm"
  aws_region = "ap-south-1"
  application = "tasking-manager"
  team  = "HOTOSM"
  creator = "HOTOSM"
  owner = "HOTOSM"
}