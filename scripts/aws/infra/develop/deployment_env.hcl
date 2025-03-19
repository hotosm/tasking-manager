locals {
  account_name    = "hotosm"
  aws_profile     = "admin"
  aws_region      = "us-east-1"
  team            = get_env("TEAM", "hotosm")
  owner           = "HOTOSM"
  environment     = "develop"
  project         = "tasking-manager"
  application     = "tasking-manager"
  short_name      = "tm"
  maintainer      = "dev@hotosm.org"
  url             = "https://tasks-dev.hotosm.org"
  documentation   = "https://hotosm.github.io"
  IaC_Management  = "Terraform/Terragrunt"
  cost_center     = "False"
  version         = "4.8.2"
}
