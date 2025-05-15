include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/ec2.hcl"
  # We want to reference the variables from the included config in this configuration, so we expose it.
  expose = true
}

terraform {
  source = "${include.envcommon.locals.base_source_url}?ref=v1.1.0"
}

locals {
  # Automatically load environment-level variables
  environment_vars = read_terragrunt_config(find_in_parent_folders("deployment_env.hcl"))
  dependency_writer = run_cmd("--terragrunt-quiet", "sh", "-c", <<EOF
echo 'dependency "extras" {
  config_path = "../extras"
}' | tee temporary-dep-hack.hcl
EOF
  )

  extras_deps = read_terragrunt_config("temporary-dep-hack.hcl")

  JUMPCLOUD_CONNECT_KEY_ARN = try([
    for secret in local.extras_deps.dependency.extras.outputs.container_secrets : secret.valueFrom
    if secret.name == "JUMPCLOUD_CONNECT_KEY"
  ][0], "JUMPCLOUD_CONNECT_KEY_NOT_FOUND_IN_SECRETS")
}

dependency "vpc" {
  config_path = "../vpc"
}

inputs = {
  vpc_id              = dependency.vpc.outputs.vpc_id
  ec2_subnet_id       = dependency.vpc.outputs.public_subnets[0]
  ec2_instance_ami    = "ami-084568db4383264d4"
  create_ssh_key_pair = false
  ec2_root_vol_size   = 50
  ec2_ebs_volumes     = []

  create_n_attach_ec2_iam_instance_profile = true
  ec2_instance_profile_policy_statements = [
    {
      sid    = "RetrieveSecretManager"
      effect = "Allow"

      resources = [
        local.JUMPCLOUD_CONNECT_KEY_ARN
      ]

      actions = [
        "secretsmanager:GetSecretValue"
      ]
    }
  ]

  ec2_user_data = templatefile("user_data.yml", { JUMPCLOUD_CONNECT_KEY_ARN = local.JUMPCLOUD_CONNECT_KEY_ARN }
  )
}
