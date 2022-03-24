data "aws_vpc" "tasking_manager" {
  id = lookup(var.vpc_id, "new")
}

data "aws_vpc" "tasking_manager_legacy" {
  id = lookup(var.vpc_id, "legacy")
}

data "aws_vpc" "galaxy" {
  id = lookup(var.vpc_id, "galaxy")
}

data "aws_subnets" "tasking_manager_private_subnets" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.tasking_manager.id]
  }

  tags = {
    Name = "TM Private*"
  }
}

data "aws_security_groups" "tasking_manager_vpc" {
  filter {
    name   = "group-name"
    values = ["hotosm-network-production-production-ec2s", "Underpass Postgres Access", "Insights-database"]
  }

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.tasking_manager.id]
  }
}

data "aws_security_groups" "galaxy_vpc" {
  filter {
    name   = "group-name"
    values = ["app", "api", "database"]
  }

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.galaxy.id]
  }
}


// data "aws_route_table" "tasking-manager" {
// }

// resource "aws_route_table_attachment" "legacy-new" {
// }

resource "aws_vpc_peering_connection" "legacy-new" {
  tags = {
    Name = "tasking-manager-legacy-new"
  }
  vpc_id      = data.aws_vpc.tasking_manager.id
  peer_vpc_id = data.aws_vpc.tasking_manager_legacy.id
  auto_accept = true

  accepter {
    allow_remote_vpc_dns_resolution = true
  }

  requester {
    allow_remote_vpc_dns_resolution = true
  }
}

resource "aws_security_group" "database_app_access" {
  name        = "tasking_manager_app_access"
  description = "Allow access to database from applications"
  vpc_id      = data.aws_vpc.tasking_manager.id

  ingress {
    description     = "Allow connection to database from TM Backend"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = data.aws_security_groups.tasking_manager_vpc.ids
  }

  ingress {
    description     = "Allow connection to database from Galaxy API"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = data.aws_security_groups.galaxy_vpc.ids
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_security_group" "database_user_access" {
  name        = "tasking_manager_user_access"
  description = "Allow access to database from users"
  vpc_id      = data.aws_vpc.tasking_manager.id

  ingress {
    description = "Allow connection to database from User1"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["127.0.0.1/32"]
  }

  ingress {
    description     = "Allow connection to database from User2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = ["172.31.0.1/32"]

  }

  ingress {
    description     = "Allow connection to database from User3"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = ["192.168.0.1/32"]
  }

}

resource "random_password" "tasking_manager_db_admin_password" {
  length  = 32
  special = false
  number  = true
  lower   = true
  upper   = true

  keepers = {
  }
}

resource "aws_db_subnet_group" "tasking_manager" {
  name       = var.project_name
  subnet_ids = data.aws_subnets.tasking_manager_private_subnets[*].id
}

resource "aws_db_instance" "tasking-manager" {
  lifecycle {
    ignore_changes = [
      // max_allocated_storage,
      // instance_class
    ]
  }

  identifier = var.project_name

  allocated_storage     = lookup(var.disk_sizes, "db_min", 100)
  max_allocated_storage = lookup(var.disk_sizes, "db_max", 1000)

  engine         = "postgres"
  engine_version = var.database_engine_version
  instance_class = lookup(var.instance_types, "database", "db.t4g.micro")

  name     = var.database_name
  username = var.database_username
  password = random_password.tasking_manager_db_admin_password.result

  skip_final_snapshot       = false
  final_snapshot_identifier = var.final_database_snapshot_identifier

  iam_database_authentication_enabled = true

  vpc_security_group_ids = [
    aws_security_group.database_app_access.id,
    aws_security_group.database_user_access.id
  ]
  db_subnet_group_name = aws_db_subnet_group.tasking_manager.name

  tags = {
    Name        = "tasking-manager"
    Role        = "Database Server"
    Environment = var.deployment_environment
  }
}

