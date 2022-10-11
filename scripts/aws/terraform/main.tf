#Based on the CF Script

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
    random = {
      source  = "hashicorp/random"
      version = "4.16"
    }
  }

  required_version = ">= 4.16"
}

provider "aws" {
  region  = "us-west-2"
  default_tags {
    tags = {
      Project       = "tasking-manager"
      Maintainer    = "DK_Benjamin and Yogesh_Girikumar"
      Documentation = "https://docs.hotosm.org/tasking_manager_infra"
    }
  }
}

#LaunchConfiguration

data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "TaskingManagerLaunchConfiguration"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-14.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

resource "aws_launch_configuration" "TaskingManagerASG" {
  name          = "TaskingManagerLaunchConfiguration"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
}

#part for the AmazonCloudWatchAgent and IamInstanceProfile



#AutoScalingGroup

resource "aws_autoscaling_group" "AutoScalingGroup" {
    name                      = "TaskingManagerASG"
    default_cooldown          = 300
    launch_configuration      = aws_launch_configuration.TaskingManagerASG.name
    max_size                  = 3
    desired_capacity          = 3
    min_size                  = 9
    health_check_grace_period = 600
    health_check_type         = "EC2"
    target_group_arns         = TaskingManagerTargetGroup
    availability_zones        = ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d", "us-east-1f"]
    force_delete              = true
    placement_group           = aws_placement_group.test.id

    Tags = [{
        "Key" = "Name",
       " PropagateAtLaunch"= true,
        "Value" = "AutoScalingGroup"
    }]

    # This Terraform Module creates an Auto Scaling Group (ASG) that can do a zero-downtime rolling deployment. 
    # That means every time you update your app (e.g. publish a new AMI), all you have to do is run terraform 
    # apply and the new version of your app will automatically roll out across your Auto Scaling Group.
    # So no need for Update Policy I think.
}

#AutoscalingPolicy

resource "aws_autoscaling_policy" "ScalingPolicy" {
  autoscaling_group_name = "TaskingManagerASG"
  name                   = "ScalingPolicy"
  policy_type            = "PredictiveScaling"

  # ... other configuration ...

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 500
  }

  predictive_scaling_configuration {
        metric_specification {
        predefined_load_metric_specification {
            predefined_metric_type = "ALBRequestCount"
            resource_label         = "????" #not sure? concat them?
            }
        }
        #cooldown
        #The following arguments are only available to "SimpleScaling" type policies
    }
}


//IAM Role 

resource "aws_iam_role_policy" "aws_iam_role_policy" {
    name = "TaskingManagerEC2Role"
    role = aws_iam_role.test_role.id

    # Terraform's "jsonencode" function converts a
    # Terraform expression result to valid JSON syntax.
    policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
        {
            Action = [
            "ec2:Describe*",
            ]
            Effect   = "Allow"
            Resource = "*" #service?
        },
        ]
    })
    }

    #managed policy arns?
    # data "aws_arn" "db_instance" {
    #     arn ="arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforAWSCodeDeploy"
    #     arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
    #     arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
    # }

    resource "aws_iam_role" "TaskingManagerEC2Role" {
    name = "TaskingManagerEC2Role"

    assume_role_policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
        {
            Action = "sts:AssumeRole"
            Effect = "Allow"
            Principal = {
            Service = "ec2.amazonaws.com"
            }
        },
        ]
    })
}
