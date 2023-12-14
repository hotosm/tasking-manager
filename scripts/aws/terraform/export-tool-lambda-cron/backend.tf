## Initializes Tf backend to use S3, create s3 bucket first.

# terraform {
#   backend "s3" {
#     bucket         = "hotosm-tm-terraform-statefiles"
#     dynamodb_table = "hotosm-tm-terraform-locks"
#     key            = "terraform.state"
#     region         = "ap-south-1"
#   }
# }