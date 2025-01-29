## Tasking Manager Terraform/Terragrunt Setup

This repository contains the infrastructure setup using Terraform with Terragrunt. It is structured to support multiple environments such as `dev`, `stag`, and others by reusing configurations and managing them efficiently.

### Versions Used

`terraform: hashicorp/terraform:1.9.5`
`terragrunt: terragrunt version v0.67.15`

### Directory Structure

The current directory structure is as follows:

```
.
├── Readme.md
├── _envcommon
│   ├── alb.hcl
│   ├── ecs.hcl
│   ├── extras.hcl
│   ├── rds.hcl
│   └── vpc.hcl
├── dev
│   ├── deployment_env.hcl
│   ├── non-purgeable
│   │   ├── alb
│   │   │   └── terragrunt.hcl
│   │   ├── extras
│   │   │   └── terragrunt.hcl
│   │   ├── rds
│   │   │   └── terragrunt.hcl
│   │   └── vpc
│   │       └── terragrunt.hcl
│   └── purgeable
│       └── ecs
│           └── terragrunt.hcl
├── terraform-aws-extras
│   ├── outputs.tf
│   ├── secrets.tf
│   ├── task-role.tf
│   └── variables.tf
└── root.hcl
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

```bash
brew install terragrunt   # On macOS
```

### Environments and Inputs

Depending on the setup the inputs and vars that needs to be configured are:

#### 1. Container non-sensative varibles

These can be configured by appending `container_envvars` located `infra/<environment>/purgeable/ecs/terragrunt.hcl`.
As an option for CI, their values can be overridden from env variables too.

Example:

```conf
EXTRA_CORS_ORIGINS            = get_env("EXTRA_CORS_ORIGINS" ,"[\"https://tasks-stage.hotosm.org\", \"http://localhost:3000\"]")
TM_SMTP_HOST                  = get_env("TM_SMTP_HOST" ,"smtp.gmail.com")
TM_SMTP_PORT                  = get_env("TM_SMTP_PORT" ,"587")
TM_SMTP_USE_TLS               = get_env("TM_SMTP_USE_TLS" ,"0")
TM_SMTP_USE_SSL               = get_env("TM_SMTP_USE_SSL" ,"1")
TM_APP_BASE_URL               = get_env("TM_APP_BASE_URL" ,"https://tasks-stage.hotosm.org")
```

#### 2. Container Secrets

These can be configured to automatically be stored within AWS Secrets Manager.
Since these vary depending on deployment environment, you can find them at `infra/<environment>/non-purgeable/extras/terragrunt.hcl`
It's not recommended to have them here, so you will need to export them using environment variable.

Write TM required environment files. Export environment variables for container secrets.
The sample env files is located in `scripts/aws/infra/infra.env.example`. Edit the env file and export them for infra deployment.

A. Copy the example environment file to a new file:

```bash
$ cp infra.env.example infra.env
```

B. Edit the file to configure your environment variables:

```bash
$ nano infra.env  # or use vi, vim, etc.
```

C. Export the variables for the deployment:

```bash
$ export $(grep -v '#' infra.env | xargs)
```

The secret section is sent to `infra/<environment>/non-purgeable/extras/terragrunt.hcl`. These secret are configured can be configured to automatically be stored within AWS Secrets Manager.

```conf
container_secrets = [
    {
      name      = "TM_SECRET"
      valueFrom = get_env("TM_SECRET", "default_secret_value")
    },
    {
      name      = "TM_CLIENT_ID"
      valueFrom = get_env("TM_CLIENT_ID", "default_client_id")
    }
]
```

#### 3. Terragrunt Inputs

Just like variables and secrets the input ALB-ACM-CERT-BACKEND-ARN can be taken from the environment or edited inline.

These are inputs that different resources will need. Ideally, everything is passed within terraform modules using outputs, but in cases of resources that already exists eg: `SSL certificates`, `IAM role` etc they will need to be passed manually.

- ALB Certificate ARN:

```json
# tasking-manager/scripts/aws/infra/dev/non-purgeable/alb/terragrunt.hcl

inputs = {
    # TLS and Certificate Configuration
    acm_tls_cert_backend_arn = get_env("ACM_TLS_CERT_BACKEND_ARN", "arn:aws:acm:us-east-2:123456789:certificate/810d8829-5e61-arn-cert-example")
}
```

### Terragrunt plan & apply

To deploy resources individually, navigate to the resource and run:

```bash
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

```bash
cd scripts/aws/infra/<to-your-environment-dir>
terragrunt init
terragrunt plan
terragrunt run-all apply
```

### Destroying Resources with Terragrunt

To destroy the RDS instance that you created for development environment, navigate to the same directory and run:

```bash
cd scripts/aws/infra/dev/non-purgeable/rds
terragrunt destroy
```
