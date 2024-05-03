<!-- GETTING STARTED -->
## TM-Extractor with Terragrunt

This directory contains infrastructure config for deploying [tm-extractor](https://github.com/hotosm/TM-Extractor) on AWS Lambda.

Check [tm-extractor](https://github.com/hotosm/TM-Extractor) for resources created and exporter script.

To get it running on your environment follow the following.

### Prerequisites

This are list of things you will need.
* AWS IAM User with permission for creating resources such as lambda function, cloudwatch group, cloudwatch event etc.
See all resource [here](https://github.com/hotosm/TM-Extractor/blob/ec37c1318325c534b4ac47f057263050e6e92f03/main.tf).
* [Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli) or (OpenTofu)[https://opentofu.org/docs/intro/install/]
* [Terragrunt](https://terragrunt.gruntwork.io/docs/getting-started/install/#install-terragrunt)
> **_NOTE:_**  Please check compatibility note. https://terragrunt.gruntwork.io/docs/getting-started/supported-versions/
Tested on: Terraform v1.5.5 & terragrunt version v0.54.9.

### Environments

Before running deployment, make sure you have the following environment variables exported.
- `TF_VAR_rawdata_api_auth_token`, Auth token for raw data api, Request [here](https://github.com/hotosm/raw-data-api/).
- `TF_VAR_raw_data_api`, API endpoint. Defaults to https://api-prod.raw-data.hotosm.org/v1
- `TF_VAR_active_projects_api_base_url`, Your [tasking-manager](https://github.com/hotosm/tasking-manager) instance.
Defaults to https://tasking-manager-staging-api.hotosm.org/api/v2

## Inputs and Local Variables
`env.hcl` within each deployment environment overrides the input vars.
```
locals {
  environment = "stag"
  # Appends to all the resource names eg: tm-extrator-hotosm-lambda-stag

  account_name   = "hotosm"
  # Also appends to the resource names for better naming

  aws_profile = "default"
  # Acts as AWS_PROFILE environment var, If you have multiple profile defined in ~/.aws/credentials, you can set these so each envionment deployment uses its own set of profiles.

  aws_region = "ap-south-1"
  # The AWS region the resources should be created on.

  application = "tasking-manager"
  team  = "HOTOSM"
  creator = "HOTOSM"
  owner = "HOTOSM"
  # Above are used for generating tags for AWS resources.
}
```

## Plan and Apply
- `cd` into `scripts/aws/lambda/TM-Extractor/<your-environment-here>/tm-extractor`.
- `terragrunt init`, initializes providers and resources.
- `terragrunt plan`, run a plan to check for infrastructure changes.
- `terragrunt apply`, applies the configuration.


_For more information, please refer to the [TM-Extractor](https://github.com/hotosm/TM-Extractor)_ repository.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
