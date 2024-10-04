# Set common variables for the environment. This is automatically pulled in in the root terragrunt.hcl configuration to
# feed forward to the child modules.
# Check ../README.md  ## Inputs and Local Variables for details.

locals {
  environment = "dev"
  account_name   = "naxadevelopers"
  aws_profile = "default"
  aws_region = "us-east-2"
  application = "tasking-manager"
  team  = "hotosm"
  creator = "HOTOSM"
  owner = "HOTOSM"
  
  default_tags = {
    project        = "tasking-manager"
    maintainer     = "dev@hotosm.org"
    documentation  = "null"
    cost_center    = null
    IaC_Management = "Terraform"
  }
}