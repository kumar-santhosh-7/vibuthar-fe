data "aws_iam_policy_document" "github_actions" {
  statement {
    sid = "S3Sync"
    actions = [
      "s3:DeleteObject",
      "s3:GetBucketLocation",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:PutObject",
    ]
    resources = [
      aws_s3_bucket.site.arn,
      "${aws_s3_bucket.site.arn}/*",
    ]
  }

  statement {
    sid = "CloudFrontInvalidate"
    actions = [
      "cloudfront:CreateInvalidation",
      "cloudfront:GetDistribution",
      "cloudfront:GetInvalidation",
      "cloudfront:ListInvalidations",
    ]
    resources = [aws_cloudfront_distribution.site.arn]
  }

  statement {
    sid = "ReadDeployParams"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
    ]
    resources = [
      aws_ssm_parameter.s3_bucket.arn,
      aws_ssm_parameter.cloudfront_distribution_id.arn,
      aws_ssm_parameter.cloudfront_domain_name.arn,
    ]
  }
}

resource "aws_iam_user" "github_actions" {
  name = "${local.name}-github-actions"
}

resource "aws_iam_user_policy" "github_actions" {
  name   = "deploy"
  user   = aws_iam_user.github_actions.name
  policy = data.aws_iam_policy_document.github_actions.json
}

resource "aws_iam_access_key" "github_actions" {
  user = aws_iam_user.github_actions.name
}
