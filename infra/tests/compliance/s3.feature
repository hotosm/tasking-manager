# CHECK SECURITY OF S3 Bucket

Feature: Ensure that S3 bucket has tags assigned
  As an S3 bucket containing sensitive information
  It has to contain tags
  So that it can be used to classify the bucket

  Acceptance criteria:
    - Bucket should have tags

Scenario Outline: Ensure specific tags are defined for S3 buckets
  Given I have aws_s3_bucket defined
  When it has tags
  Then it must contain <tags>
  And its value must match the "<value>" regex

Examples:
  |tags         |value                    |
  |Name         |.+                       |
  |Environment  |^(prod\|dev\|stage\|uat)+|
  |Project      |.+                       |
  |Maintainer   |.+                       |
  |Documentation|.+                       |
