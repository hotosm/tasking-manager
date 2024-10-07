# ECS Role and Policy

resource "aws_iam_role" "task_role" {
  name               = format("%s-%s-%s",lookup(var.project_meta, "name"),"ecs-role" ,"${var.deployment_environment}" )
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
  tags = {
    Name = format("%s-%s-%s",lookup(var.project_meta, "name"),"ecs-role" ,"${var.deployment_environment}" )
  }
}

resource "aws_iam_policy" "ecs_policy" {
  name        = format("%s-%s-%s",lookup(var.project_meta, "name"),"ecs-policy" ,"${var.deployment_environment}" )
  description = format("%s-%s-%s-%s","ECS Policy For", lookup(var.project_meta, "name"),"ecs-role" ,"${var.deployment_environment}" )
  policy      = data.aws_iam_policy_document.ecs_policy.json
  tags = {
    Name = format("%s-%s-%s",lookup(var.project_meta, "name"),"ecs-policy" ,"${var.deployment_environment}" )
  }
}

resource "aws_iam_role_policy_attachment" "ecs_attachment_1" {
  role       = aws_iam_role.task_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "ecs_attachment_2" {
  role       = aws_iam_role.task_role.name
  policy_arn = aws_iam_policy.ecs_policy.arn
}

# ===================== DATA POLICY ============================

data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    sid     = "GenericAssumeRoleEC2"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "ecs_policy" {
  statement {
    sid    = "AllowECRActions"
    effect = "Allow"

    actions = [
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:BatchCheckLayerAvailability"
    ]

    resources = [
      "*"
    ]
  }

  statement {
    sid    = "AllowECRECRGetAuthorizationToken"
    effect = "Allow"

    actions = [
      "ecr:GetAuthorizationToken"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "ECSs3Bucket"
    effect = "Allow"

    resources = [
      "arn:aws:s3:::${var.s3_bucket_name}/*",
      "arn:aws:s3:::${var.s3_bucket_name}",
    ]

    actions = [
      "s3:ListBucket",
      "s3:PutObject",
      "s3:GetEncryptionConfiguration",
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:DeleteObject",
      "s3:DeleteObjectVersion",
    ]
  }

  statement {
    sid       = "ECSssmMessages"
    effect    = "Allow"
    resources = ["*"]

    actions = [
      "ssmmessages:CreateControlChannel",
      "ssmmessages:CreateDataChannel",
      "ssmmessages:OpenControlChannel",
      "ssmmessages:OpenDataChannel",
    ]
  }

  statement {
    sid       = "ECSlogs"
    effect    = "Allow"
    resources = ["arn:aws:logs:*:*:*"]

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams",
    ]
  }

  statement {
    sid       = "ECScloudwatch"
    effect    = "Allow"
    resources = ["*"]

    actions = [
      "cloudwatch:PutMetricData",
      "cloudwatch:GetMetricData",
      "cloudwatch:ListMetrics",
    ]
  }

}