terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.1.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project       = "tasking-manager"
      Maintainer    = "DK_Benjamin and Yogesh_Girikumar"
      Documentation = "https://docs.hotosm.org/tasking_manager_infra"
    }
  }
}

provider "random" {
  # config options
}


