data "aws_acm_certificate" "hotosm-wildcard" {
  domain      = "hotosm.org"
  statuses    = ["ISSUED"]
  types       = ["AMAZON_ISSUED"]
  most_recent = true
}

data "aws_cloudfront_origin_request_policy" "frontend" {
  name = "Managed-UserAgentRefererHeaders"
}

data "aws_cloudfront_response_headers_policy" "frontend" {
  name = "Managed-SecurityHeadersPolicy"
}

data "aws_cloudfront_cache_policy" "frontend" {
  name = "Managed-CachingOptimized"
}

data "aws_route53_zone" "default" {
  name = var.domain_name_dot_tld
}

locals {
  full_service_name = join(
    "-",
    [
      var.project_name,
      "frontend",
      var.deployment_environment
    ]
  )

  service_fqdn = join(
    ".",
    [
      var.instance_subdomain,
      var.domain_name_dot_tld
    ]
  )

  bucket_regional_domain_name = join(
    ".",
    [
      local.full_service_name,
      "s3.us-east-1.amazonaws.com"
    ]
  )
}

resource "aws_s3_bucket" "frontend" {
  bucket = local.full_service_name
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = local.full_service_name
  description                       = "Fully signed origin access from S3 to CloudFront"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_cache_policy" "frontend" {
  name        = local.full_service_name
  comment     = "Cache policy for Tasking Manager frontend"
  max_ttl     = 2149200
  default_ttl = 86400
  min_ttl     = 300

  parameters_in_cache_key_and_forwarded_to_origin {

    cookies_config {
      cookie_behavior = "all" // TODO: or "whitelist", "allExcept", "none"
    }

    headers_config {
      header_behavior = "whitelist" // TODO: or "none"
      headers {
        items = ["Authorization", "Accept", "x-api-key", "Referer"]
      }
    }

    query_strings_config {
      query_string_behavior = "all" // TODO: or "whitelist", "allExcept", "none"
    }

    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

  }
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled = true
  aliases = [local.service_fqdn]
  comment = "Frontend CDN for Tasking Manager"

  is_ipv6_enabled     = true
  http_version        = "http2" // TODO: or "http2and3"
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name // TODO: or local.bucket_regional_domain_name
    origin_id                = local.full_service_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    // Allowed: ["PUT", "POST", "PATCH", "DELETE"]
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    default_ttl            = 604800  // TODO: Expire after one week ~~ cadence of Frontend deploys
    max_ttl                = 2419200 // About 4 weeks
    viewer_protocol_policy = "redirect-to-https"
    target_origin_id       = local.full_service_name

    cache_policy_id            = aws_cloudfront_cache_policy.frontend.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.frontend.id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.frontend.id
  }

  restrictions {
    geo_restriction {
      locations        = []
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.hotosm-wildcard.arn
    minimum_protocol_version = lookup(var.ssl_protocol_versions, "client_to_cdn")
    ssl_support_method       = "sni-only"
  }

}

resource "aws_route53_record" "frontend" {
  zone_id = data.aws_route53_zone.default.zone_id
  name    = local.service_fqdn
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "frontendv6" {
  zone_id = data.aws_route53_zone.default.zone_id
  name    = local.service_fqdn
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = true
  }
}
