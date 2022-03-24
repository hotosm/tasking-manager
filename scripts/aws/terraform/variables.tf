variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "tasking-manager"
}

variable "legacy_vpc_id" {
  type    = string
  default = "vpc-ea2..."
}

variable "vpc_id" {
  type = map(string)
  default = {
    new    = "vpc-0dccf9ef074569683"
    legacy = "vpc-ea28198f"
    galaxy = "vpc-06689185525f2fb43"
  }
}

variable "database_engine_version" {
  type    = string
  default = "12.8"
}

variable "instance_types" {
  type = map(string)

  default = {
    database = "db.t4g.micro"
  }
}

variable "database_name" {
  type    = string
  default = "taskingmanager"
}

variable "database_username" {
  type    = string
  default = "tm"
}

variable "deployment_environment" {
  type    = string
  default = "production"
}

variable "disk_sizes" {
  type = map(number)
  default = {
    db_min = 100
    db_max = 1000
  }
}

variable "final_database_snapshot_identifier" {
  type    = string
  default = "final-snapshot"
}
