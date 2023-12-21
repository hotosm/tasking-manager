
data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "iam_for_lambda_tm" {
  name               = "iam_for_lambda_tm"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

data "archive_file" "lambda" {
  type        = "zip"
  source_file = "lambda_function.py"
  output_path = "cron_raw_data.zip"
}

resource "aws_lambda_layer_version" "lambda_layer" {
  filename   = "lambda_raw_data_cron_layer.zip"
  layer_name = "lambda_raw_data_cron_layer"

  compatible_runtimes = ["python3.8"]
}
resource "aws_cloudwatch_log_group" "lambda_raw_data_cron" {
  name = "/aws/lambda/${aws_lambda_function.lambda_raw_data.function_name}"
  retention_in_days = 14
  lifecycle {
    prevent_destroy = false
  }
  tags = {
  Application = "lambda"
  }
}

resource "aws_lambda_function" "lambda_raw_data" {

  filename      = "cron_raw_data.zip"
  function_name = "lambda_raw_data_cron"
  role          = aws_iam_role.iam_for_lambda_tm.arn
  handler       = "lambda_function.lambda_handler"
  memory_size   = 128
  timeout = 20 # To be Increased if active projects are more.
  layers = [ aws_lambda_layer_version.lambda_layer.id ]
  
  source_code_hash = data.archive_file.lambda.output_base64sha256

  runtime = "python3.9"
  # To be accessed from Environmnet varible TF_VAR_rawdata_api_auth_token & TF_VAR_active_projects_api_base_url.
  depends_on = [
    aws_lambda_layer_version.lambda_layer,
    aws_iam_role.iam_for_lambda_tm,
    aws_iam_role_policy_attachment.lambda_logs,
  ]
  environment {
    variables = {
      ACTIVE_PROJECTS_API_BASE_URL = "${var.active_projects_api_base_url}",
      RAWDATA_API_AUTH_TOKEN = "${var.rawdata_api_auth_token}"
    }
  }
  
  tracing_config {
    mode = "PassThrough"
  }
  lifecycle {
    ignore_changes = [layers]  # Ignore changes to layers for now
  }
}

resource "aws_iam_policy" "lambda_logging" {
  name        = "lambda_raw_data_logging"
  path        = "/"
  description = "IAM policy for logging from this lambda function"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.iam_for_lambda_tm.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

resource "aws_cloudwatch_event_rule" "cron_raw_data_lambda_schedule" {
  name        = "cron_raw_data_lambda_schedule"
  description = "Schedule rule to trigger Lambda"
  schedule_expression = "cron(0 0 * * ? *)"  # Runs day 12 am.
}

resource "aws_lambda_permission" "eventbridge_invoke_permission" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_raw_data.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cron_raw_data_lambda_schedule.arn
}

resource "aws_cloudwatch_event_target" "cron_raw_data_lambda_target" {
  rule      = aws_cloudwatch_event_rule.cron_raw_data_lambda_schedule.name
  arn       = aws_lambda_function.lambda_raw_data.arn
}


resource "aws_cloudwatch_metric_alarm" "lambda_error_alarm" {
  alarm_name          = "lambda_raw_data_error_alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 5
  threshold           = 2  # Number of errors that trigger the alarm.
  period              = 14400  # 1 Day
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  statistic           = "Maximum"
  dimensions = {
    FunctionName = aws_lambda_function.lambda_raw_data.function_name
  }

  alarm_description = "Alarm triggered when Lambda function has 3 or more errors in 5 minutes."

  actions_enabled = false  # Disable actions, meaning no notification actions will be taken

  treat_missing_data = "breaching"
}


