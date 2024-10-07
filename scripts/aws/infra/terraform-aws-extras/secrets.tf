# Resource for AWS Secrets Manager
resource "aws_secretsmanager_secret" "tm_secrets" {
  for_each = {
    for secret in var.container_secrets : secret.name => secret
  }

  name        = join("/", [
    lookup(var.org_meta, "url"),
    lookup(var.project_meta, "short_name"),
    var.deployment_environment,
    "backend",
    each.key
  ])

  description = "Container secret for the ${lookup(var.project_meta, "name")} project (${each.key})"
}

# Define secret versions
resource "aws_secretsmanager_secret_version" "tm_secret_version" {
  for_each = {
    for secret in var.container_secrets : secret.name => secret
  }

  secret_id     = aws_secretsmanager_secret.tm_secrets[each.key].id
  secret_string = each.value.valueFrom  # Accessing valueFrom from the object
}

