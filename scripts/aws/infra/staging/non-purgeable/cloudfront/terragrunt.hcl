include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/cloudfront.hcl"
  # We want to reference the variables from the included config in this configuration, so we expose it.
  expose = true
}

terraform {
  source = "${include.envcommon.locals.base_source_url}?ref=v1.0.0"
}

dependency "s3" {
  config_path = "../s3"
}

inputs = {
  # S3 bucket configuration - only need to provide the bucket name
  s3_bucket_name          = dependency.s3.outputs.bucket_name
  create_s3_bucket_policy = true

  aliases = split(" ", get_env("CLOUDFRONT_DIST_ALIASES", "tasks-stage.hotosm.org"))

  # CloudFront configuration
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Frontend Static distribution for ${include.envcommon.locals.distribution_name}"
  default_root_object = "index.html"

  # Price class - choose one of: [
  # - PriceClass_100 (US, Canada, Europe)
  # - PriceClass_200 (PriceClass_100 + South America, Australia, New Zealand, and parts of Asia)
  # - PriceClass_All (All regions)
  # ]

  # Cache behavior
  allowed_methods        = ["GET", "HEAD", "OPTIONS"]
  cached_methods         = ["GET", "HEAD"]
  forward_query_string   = false
  forward_cookies        = "none"
  viewer_protocol_policy = "redirect-to-https"
  min_ttl                = 0
  default_ttl            = 3600
  max_ttl                = 86400
  compress               = true

  # Geo restrictions
  geo_restriction_type      = "none"
  geo_restriction_locations = []

  custom_error_response_pages = [
    {
      error_code            = 404
      response_page_path    = "/index.html"
      response_code         = 404
      error_caching_min_ttl = 60
    },
    {
      error_code            = 403
      response_page_path    = "/index.html"
      response_code         = 403
      error_caching_min_ttl = 60
    }
  ]

  # SSL/TLS configuration
  use_default_certificate = false
  # If use_default_certificate is false, provide these:
  acm_certificate_arn = get_env("ACM_TLS_CERT_FRONTEND_ARN", "arn:aws:acm:us-east-1:670261699094:certificate/1d74321b-1e5b-4e31-b97a-580deb39c539")
}
