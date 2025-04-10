# Outputs
output "container_secrets" {
  value = [
    for secret in var.container_secrets : {
      name      = secret.name
      valueFrom = aws_secretsmanager_secret.tm_secrets[secret.name].arn  # Get the ARN of the secret
    }
  ]
}

output "ecs_task_role_arn" {
  value       = aws_iam_role.task_role.arn
  description = "ARN of the task role for ECS"
}
