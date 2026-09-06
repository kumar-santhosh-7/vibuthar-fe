data "aws_caller_identity" "current" {}

locals {
  name = var.project_name

  enable_custom_domain = var.domain_name != "" && var.acm_certificate_arn != ""
  enable_api_origin    = var.api_origin_domain != ""

  s3_origin_id  = "s3-site"
  api_origin_id = "api"
}
