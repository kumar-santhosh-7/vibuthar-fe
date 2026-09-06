terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment after creating the bucket/table yourself.
  #
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "vibuthar-academy/frontend/terraform.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "your-terraform-locks"
  #   encrypt        = true
  # }
}
