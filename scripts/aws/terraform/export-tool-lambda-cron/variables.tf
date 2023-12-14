# ====================== GLOBALS ==================== #
variable "aws_region" {
  type    = string
  default = "ap-south-1"
  description = "AWS region for all resources."
}

variable "project_name" {
  type    = string
  default = "hotosm"
  description = "prefix for all resources."
}

# To be Exported from environment as TF_VAR_active_projects_api_base_url, from circleci or gh actions.
variable "active_projects_api_base_url" {
   type= string
} 

# To be Exported from environment as TF_VAR_rawdata_api_auth_token, from circleci or gh actions.
variable "rawdata_api_auth_token" {
   type= string
} 