variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "tasking-manager"
}

variable "deployment_environment" {
  type    = string
  default = "production"
}

variable "domain_name_dot_tld" {
  type    = string
  default = "hotosm.org"
}

variable "instance_subdomain" {
  type    = string
  default = "tasks0"
}

variable "ssl_protocol_versions" {
  type = map(string)

  default = {
    client_to_cdn          = "TLSv1.2_2021"
    client_to_loadbalancer = ""
  }
}

