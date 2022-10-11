#Based on the CF Script


variable "GitSha" {
    type        = String
    default     = ""
}
      
variable "NetworkEnvironment" {
    type         = String
    AllowedValues = ["staging", "production"]
}
      
variable "AutoscalingPolicy" {
    description = "development: min 1, max 1 instance; demo: min 1 max 3 instances; production: min 2 max 9 instances"
    type        = String
    AllowedValues = ["development", "demo", "production"]
}
      
variable "DBSnapshot" {
    description = "Specify an RDS snapshot ID, if you want to create the DB from a snapshot."
    type        = String
    default     = ""
}
      
variable "DatabaseDump" {
    type        = String
    description = "Path to database dump on S3; Ex: s3://my-bkt/tm.sql"
}
      
variable "NewRelicLicense" {
    description = "NEW_RELIC_LICENSE"
    type        = String
}
      
variable "PostgresDB" {
    description = "POSTGRES_DB"
    type        = String
}

variable "PostgresPassword" {
    description = "POSTGRES_PASSWORD"
    type        = String
}

variable "PostgresUser" {
    description = "POSTGRES_USER"
    type        = String
}

variable "DatabaseEngineVersion" {
    description = "AWS PostgreSQL Engine version"
    type        = String
    default = "11.12"
}

variable "DatabaseInstanceType" {
    description = "Database instance type"
    type        = String
    default = "db.t3.xlarge"
}

variable "DatabaseDiskSize" {
    description = "Database size in GB"
    type        = String
    default = "100"
}

variable "DatabaseParameterGroupName" {
    description = "Name of the customized parameter group for the database"
    type        = String
    default =  "tm3-logging-postgres11"
}

variable "DatabaseSnapshotRetentionPeriod" {
    description = "Retention period for automatic (scheduled) snapshots in days"
    type        = Number
    default = 10
}

variable "ELBSubnets" {
    description = "ELB subnets"
    type        = String
}

variable "SSLCertificateIdentifier" {
    description = "SSL certificate for HTTPS protocol"
    type        = String
}

variable "TaskingManagerLogDirectory" {
    description = "TM_LOG_DIR environment variable"
    type        = String
}

variable "TaskingManagerConsumerKey" {
    description = "TM_CONSUMER_KEY"
    type        = String
}

variable "TaskingManagerConsumerSecret" {
    description = "TM_CONSUMER_SECRET"
    type        = String
}

variable "TaskingManagerSecret" {
    description = "TM_SECRET"
    type        = String
}

variable "TaskingManagerAppBaseUrl" {
    description = "TM_APP_BASE_URL; Ex: https://example.hotosm.org"
    type        = String
}

variable "TaskingManagerEmailFromAddress" {
    description = "TM_EMAIL_FROM_ADDRESS"
    type        = String
}

variable "TaskingManagerEmailContactAddress" {
    description = "TM_EMAIL_CONTACT_ADDRESS"
    type        = String
}

variable "TaskingManagerLogLevel" {
    description = "TM_LOG_LEVEL"
    type        = String
    default     = "INFO"
}

variable "TaskingManagerImageUploadAPIURL" {
    description = "URL for image upload service"
    type        = String
}

variable "TaskingManagerImageUploadAPIKey" {
    description = "API Key for image upload service"
    type        = String
}

variable "TaskingManagerImageUploadAPIKey" {
    description = "API Key for image upload service"
    type        = String
}

variable "TaskingManagerSMTPHost" {
    description = "TM_SMTP_HOST environment variable"
    type        = String
}

variable "TaskingManagerSMTPPassword" {
    description = "TM_SMTP_USER environment variable"
    type        = String
}

variable "TaskingManagerSMTPUser" {
    description = "TM_SMTP_USER environment variable"
    type        = String
}

variable "TaskingManagerSMTPSSL" {
    description = "TM_SMTP_USE_SSL environment variable"
    type        = Number
    AllowedValues = [1, 0]
    default =  0
}

variable "TaskingManagerSMTPTLS" {
    description = "TM_SMTP_USE_TLS environment variable"
    type        = Number
    AllowedValues = [1, 0]
    Default = 1
}

variable "TaskingManagerSendProjectUpdateEmails" {
    description = "TM_SEND_PROJECT_UPDATE_EMAILS environment variable"
    type        = Number
    AllowedValues = [1, 0]
    Default = 1
}

variable "TaskingManagerDefaultChangesetComment" {
    description = "TM_DEFAULT_CHANGESET_COMMENT environment variable"
    type        = String
}

variable "TaskingManagerURL" {
    description = "URL for setting CNAME in Distribution; Ex: example.hotosm.org"
    type        = String
    AllowedPattern = "^([a-zA-Z0-9-]*\\.){2}(\\w){2,20}$"
    ConstraintDescription = "Parameter must be in the form of a url with subdomain."
}

variable "TaskingManagerOrgName" {
    description = "Org Name"
    type        = String
}

variable "TaskingManagerOrgCode" {
    description = "Org Code"
    type        = String
}

variable "SentryBackendDSN" {
    description = "DSN for sentry"
    type        = String
}

variable "TaskingManagerLogo" {
    description = "URL for logo"
    type        = String
}