## Tasking Manager Terraform/Terragrunt Setup

This repository contains the infrastructure setup using Terraform with Terragrunt. It is structured to support multiple environments such as `dev`, `stag`, and others by reusing configurations and managing them efficiently.

### Versions Used

`terraform: hashicorp/terraform:1.9.5`
`terragrunt: terragrunt version v0.67.15`


### Directory Structure

The current directory structure is as follows:
```
.
├── _envcommon
│   ├── alb.hcl
│   ├── ecs.hcl
│   ├── extras.hcl
│   ├── rds.hcl
│   └── vpc.hcl
├── dev
│   ├── deployment_env.hcl
│   ├── non-purgeable
│   │   ├── alb
│   │   │   └── terragrunt.hcl
│   │   ├── extras
│   │   │   └── terragrunt.hcl
│   │   ├── rds
│   │   │   └── terragrunt.hcl
│   │   └── vpc
│   │       └── terragrunt.hcl
│   └── purgeable
│       └── ecs
│           └── terragrunt.hcl
├── terraform-aws-extras
│   ├── outputs.tf
│   ├── secrets.tf
│   ├── task-role.tf
│   └── variables.tf
└── terragrunt.hcl
```

### Key Components

#### `_envcommon`: 
This directory contains shared configurations that are common across environments, such as configurations for the ALB, ECS, RDS, and VPC. These are used across different deployment environments.

#### `dev/`: 
The dev environment contains environment-specific configuration files. 
It includes:
- `deployment_env.hcl`: Environment-specific variables for the dev environment.
- `non-purgeable/`: Contains resources that are not to be normally destroyed and are not expected to be updated often. Also have data related services, which are not expected to be purged.
- `purgeable/`: Contains resources that can be purged (e.g., ECS).

#### `terraform-aws-extras/`: 
This is a module with specific `terraform` configurations like task roles, secrets, and outputs. It supplements the core terraform modules that are specific to `tasking-manager`.

## Managing Environments

### To create a new environment (e.g., stag):

- Copy the dev directory and rename it to stag.
- Adjust `deployment_env.hcl` in the new environment to reflect environment-specific values.
- Update any relevant configurations for environment-specific resources.

### Running Terraform with Terragrunt

Install Terragrunt and Terraform if you haven’t already.
You can install Terragrunt via the following commands:
```
brew install terragrunt   # On macOS
```
To deploy resources individually, navigate to the resource and run:
```
# Example for creating VPC resource for developement environment.
cd scripts/aws/infra/dev/non-purgeable/vpc
terragrunt plan
terragrunt apply

# Example for creating RDS instance for development environment.
cd scripts/aws/infra/dev/non-purgeable/rds
terragrunt plan
terragrunt apply
```

To deploy all resources in dependency order, navigate to the desired environment directory (dev or stag) and run:
```
cd scripts/aws/infra/<to-your-environment-dir>
terragrunt init
terragrunt plan
terragrunt run-all apply
```

### Destroying Resources with Terragrunt

To destroy the RDS instance that you created for development environment, navigate to the same directory and run:
```
cd scripts/aws/infra/dev/non-purgeable/rds
terragrunt destroy
```