variable "org_meta" {
  description = "Org info for secrets manager prefix"
  type = map(string)
  default = {
    name       = "hotosm.org"
    short_name = "hot"
    url        = "hotosm.org"
  }
}

variable "project_meta" {
  description = "Metadata relating to the project for which the VPC is being created"
  type        = map(string)

  default = {
    name       = "tasking-manager"
    short_name = "tm"
    version    = "1.1.2"
    image_tag  = "develop"
    url        = "https://tasks.hotosm.org"
  }
}

variable "s3_bucket_name" {
  type    = string
  description = "S3 Bucket to store state files for terraform"
  default = "tasking-manager-terraform"
}

variable "deployment_environment" {
  description = "Deployment flavour or variant identified by this name"
  type        = string

  default = "dev"
}

variable "container_secrets" {
  description = "Secrets from Secrets Manager to pass to containers"
  type        = list(object({
    name      = string
    valueFrom = string
  }))
  nullable = true
  default  = []
}
