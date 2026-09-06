resource "aws_cloudfront_origin_access_control" "site" {
  name                              = local.name
  description                       = "OAC for ${local.name} static site"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_function" "spa" {
  name    = "${local.name}-spa-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Serve index.html for client-side routes"
  publish = true
  code    = <<-EOT
    function handler(event) {
      var request = event.request;
      var uri = request.uri;
      if (uri.indexOf("/api/") === 0) {
        return request;
      }
      if (uri.indexOf(".") !== -1) {
        return request;
      }
      request.uri = "/index.html";
      return request;
    }
  EOT
}

resource "aws_cloudfront_cache_policy" "html" {
  name        = "${local.name}-html"
  comment     = "Honor origin Cache-Control so index.html can be revalidated"
  default_ttl = 0
  max_ttl     = 31536000
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_response_headers_policy" "site" {
  name    = "${local.name}-security"
  comment = "Baseline security headers for the static site"

  security_headers_config {
    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
  }
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = local.name
  default_root_object = "index.html"
  price_class         = var.price_class
  aliases             = local.enable_custom_domain ? [var.domain_name] : []
  http_version        = "http2and3"

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  dynamic "origin" {
    for_each = local.enable_api_origin ? [var.api_origin_domain] : []

    content {
      domain_name = origin.value
      origin_id   = local.api_origin_id

      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = var.api_origin_protocol_policy
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }
  }

  default_cache_behavior {
    target_origin_id           = local.s3_origin_id
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = aws_cloudfront_cache_policy.html.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.site.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa.arn
    }
  }

  dynamic "ordered_cache_behavior" {
    for_each = local.enable_api_origin ? [1] : []

    content {
      path_pattern             = "/api/*"
      target_origin_id         = local.api_origin_id
      viewer_protocol_policy   = "redirect-to-https"
      allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      cached_methods           = ["GET", "HEAD"]
      compress                 = true
      cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
      origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # AllViewerExceptHostHeader
    }
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = !local.enable_custom_domain
    acm_certificate_arn            = local.enable_custom_domain ? var.acm_certificate_arn : null
    ssl_support_method             = local.enable_custom_domain ? "sni-only" : null
    minimum_protocol_version       = local.enable_custom_domain ? "TLSv1.2_2021" : null
  }
}

resource "aws_ssm_parameter" "s3_bucket" {
  name  = "/${local.name}/s3_bucket"
  type  = "String"
  value = aws_s3_bucket.site.id
}

resource "aws_ssm_parameter" "cloudfront_distribution_id" {
  name  = "/${local.name}/cloudfront_distribution_id"
  type  = "String"
  value = aws_cloudfront_distribution.site.id
}

resource "aws_ssm_parameter" "cloudfront_domain_name" {
  name  = "/${local.name}/cloudfront_domain_name"
  type  = "String"
  value = aws_cloudfront_distribution.site.domain_name
}
