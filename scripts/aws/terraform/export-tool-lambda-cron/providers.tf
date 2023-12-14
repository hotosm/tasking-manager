# Terraform provider

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.67.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"

  default_tags {
    tags = {
      Environment = "Production"
      Application = "tasking-manager"
      Team        = "HOTOSM"
      Creator     = "Terraform"
      Owner       = "HOTOSM"
    }
  }
}
