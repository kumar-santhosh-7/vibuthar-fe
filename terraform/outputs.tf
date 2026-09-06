output "aws_region" {
  value = var.aws_region
}

output "s3_bucket" {
  value = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.site.domain_name
}

output "site_url" {
  value = "https://${local.enable_custom_domain ? var.domain_name : aws_cloudfront_distribution.site.domain_name}"
}

output "github_actions_access_key_id" {
  description = "GitHub Actions secret AWS_ACCESS_KEY_ID."
  value       = aws_iam_access_key.github_actions.id
}

output "github_actions_secret_access_key" {
  description = "GitHub Actions secret AWS_SECRET_ACCESS_KEY."
  value       = aws_iam_access_key.github_actions.secret
  sensitive   = true
}
