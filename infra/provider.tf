terraform {

  required_version = ">= 1.3.8"

  /**
  backend "remote" {
    organization = "hotosm"

    workspaces {
      name = "tasking-manager"
    }
  }
**/

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.54.0"
    }

    random = {
      source  = "hashicorp/random"
      version = "3.4.3"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project        = "tasking-manager"
      Maintainer     = "DK_Benjamin Yogesh_Girikumar Ramya_Ragupathy and Kathmandu_Living_Labs"
      Documentation  = "docs.hotosm.org/tasking_manager_infra"
      IaC_Management = "Terraform"
    }
  }
}

provider "random" {
  # config options
}

