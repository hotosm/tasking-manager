# The block below configures Terraform to use the 'remote' backend with Terraform Cloud.
# For more information, see https://www.terraform.io/docs/backends/types/remote.html
terraform {
  backend "remote" {
    organization = "hotosm"

    workspaces {
      name = "tasking-manager"
    }
  }

  required_version = ">= 1.1.0"
}
