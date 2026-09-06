variable "aws_region" {
  description = "AWS region for the S3 bucket and IAM. CloudFront is global. Mumbai = ap-south-1."
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Name prefix for the site bucket, CloudFront, IAM, and SSM parameters."
  type        = string
  default     = "vibuthar-fe"
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_200 includes Asia (needed for India)."
  type        = string
  default     = "PriceClass_200"
}

variable "domain_name" {
  description = "Optional custom domain (e.g. www.example.com). Empty = *.cloudfront.net."
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN in us-east-1 (required by CloudFront). Empty = default CloudFront cert."
  type        = string
  default     = ""
}

variable "api_origin_domain" {
  description = "Optional backend hostname (ALB DNS or custom). When set, CloudFront forwards /api/* to this origin so the SPA can use a blank VITE_API_BASE_URL."
  type        = string
  default     = ""
}

variable "api_origin_protocol_policy" {
  description = "CloudFront origin protocol for the API. Use http-only for an HTTP ALB, https-only for TLS."
  type        = string
  default     = "http-only"

  validation {
    condition     = contains(["http-only", "https-only"], var.api_origin_protocol_policy)
    error_message = "api_origin_protocol_policy must be http-only or https-only."
  }
}
