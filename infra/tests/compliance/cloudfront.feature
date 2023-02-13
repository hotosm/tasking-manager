Feature: Cloudfront CDN related policies
	Cloudfront distribution must be secure by default

	Acceptance criteria
	  - Cloudfront clients must connect over TLS/SSL
	  - Cloudfront viewer TLS protocol must be TLSv1.2 minimum
	  - Cloudfront cache sane defaults must be enabled for Security Headers
	
	Cloudfront distributions must have sane defaults set for networking
	
	Acceptance criteria
	  - Cloudfront distributions must have IPv6 enabled
	  - Cloudfront distributions should connect over http2
	  - Cloudfront distributions must not restrict by geography

	Cloudfront distributions must have reasonable cache settings

	Acceptance criteria
	  - Minimum cache TTL must be longer than 5 minutes
	  - Maximum cache TTL must be no longer than one month

	Scenario: Cloudfront distribution ViewerProtocolPolicy must be set to redirect to HTTPS
		Given I have aws_cloudfront_distribution defined
		Then it must have default_cache_behavior
		And it must have viewer_protocol_policy
		And its value must be redirect-to-https

	Scenario: Cloudfront distribution must have IPv6 enabled
		Given I have aws_cloudfront_distribution defined
		Then it must have is_ipv6_enabled
		And its value must be true

	Scenario: Cloudfront distribution must have http2 enabled
		Given I have aws_cloudfront_distribution defined
		Then it must have http_version
		And its value must be http2

	Scenario: Cloudfront clients must use at least TLSv1.2 to connect
		Given I have aws_cloudfront_distribution defined
		Then it must have viewer_certificate
		And it must have minimum_protocol_version
		And its value must be TLSv1.2_2021
	
	Scenario: Cloudfront must not restrict by geography
		Given I have aws_cloudfront_distribution defined
		Then it must have restrictions
		And it must have geo_restriction
		And it must have restriction_type
		And its value must be none

	Scenario: Cloudfront cache maximum TTL must be shorter than a month
		Given I have aws_cloudfront_distribution defined
		Then it must have default_cache_behavior
		And it must have max_ttl
		And its value must be 2419200

	Scenario: Cloudfront cache default TTL must be about a week
		Given I have aws_cloudfront_distribution defined
		Then it must have default_cache_behavior
		And it must have default_ttl
		And its value must be 604800

