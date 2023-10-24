const cf = require('@mapbox/cloudfriend');

const Parameters = {
  TaskingManagerBackendAMI: {
    Type: "AWS::EC2::Image::Id",
    Description: 'AMI ID of Backend VM, currently Ubuntu 20.04 LTS - Was ami-00fa576fb10a52a1c',
    Default: "ami-0aa2b7722dc1b5612",
  },
  TaskingManagerBackendInstanceType: {
    Type: 'String',
    Description: 'Instance Type of  Backend VM',
    Default: 'c6a.large'
  },
  GitSha: {
    Type: 'String'
  },
  NetworkEnvironment: {
    Type :'String',
    AllowedValues: ['staging', 'production']
  },
  AutoscalingPolicy: {
    Type: 'String',
    AllowedValues: ['development', 'demo', 'production'],
    Description: "development: min 1, max 1 instance; demo: min 1 max 3 instances; production: min 2 max 9 instances"
  },
  DBSnapshot: {
    Type: 'String',
    Description: 'Specify an RDS snapshot ID, if you want to create the DB from a snapshot.',
    Default: ''
  },
  DatabaseDump: {
    Type: 'String',
    Description: 'Path to database dump on S3; Ex: s3://my-bkt/tm.sql'
  },
  NewRelicLicense: {
    Type: 'String',
    Description: 'NEW_RELIC_LICENSE'
  },
  PostgresDB: {
    Type: 'String',
    Description: 'POSTGRES_DB'
  },
  PostgresPassword: {
    Type: 'String',
    Description: 'POSTGRES_PASSWORD'
  },
  PostgresUser: {
    Type: 'String',
    Description: 'POSTGRES_USER'
  },
  DatabaseEngineVersion: {
    Description: 'AWS PostgreSQL Engine version',
    Type: 'String',
    Default: '11.19'
  },
  DatabaseInstanceType: {
    Description: 'Database instance type',
    Type: 'String',
    Default: 'db.t3.xlarge'
  },
  DatabaseDiskSize: {
    Description: 'Database size in GB',
    Type: 'String',
    Default: '100'
  },
  DatabaseParameterGroupName: {
    Description: 'Name of the customized parameter group for the database',
    Type: 'String',
    Default: 'tm3-logging-postgres11'
  },
  DatabaseSnapshotRetentionPeriod: {
    Description: 'Retention period for automatic (scheduled) snapshots in days',
    Type: 'Number',
    Default: 10
  },
  ELBSubnets: {
    Description: 'ELB subnets',
    Type: "List<AWS::EC2::Subnet::Id>"
  },
  SSLCertificateIdentifier: {
    Type: 'String',
    Description: 'SSL certificate for HTTPS protocol'
  },
  TaskingManagerLogDirectory: {
    Description: 'TM_LOG_DIR environment variable',
    Type: 'String'
  },
  TaskingManagerOAuthClientID: {
    Description: 'TM_CLIENT_ID',
    Type: 'String'
  },
  TaskingManagerOAuthClientSecret: {
      Description: 'TM_CLIENT_SECRET',
      Type: 'String'
  },
  TaskingManagerSecret: {
    Description: 'TM_SECRET',
    Type: 'String'
  },
  TaskingManagerAppBaseUrl: {
    Type: 'String',
    Description: 'TM_APP_BASE_URL; Ex: https://example.hotosm.org'
  },
  TaskingManagerEmailFromAddress: {
    Description: 'TM_EMAIL_FROM_ADDRESS',
    Type: 'String'
  },
  TaskingManagerEmailContactAddress: {
    Description: 'TM_EMAIL_CONTACT_ADDRESS',
    Type: 'String'
  },
  TaskingManagerLogLevel: {
    Description: 'TM_LOG_LEVEL',
    Type: 'String',
    Default: 'INFO'
  },
  TaskingManagerImageUploadAPIURL: {
    Description: 'URL for image upload service',
    Type: 'String'
  },
  TaskingManagerImageUploadAPIKey: {
    Description: 'API Key for image upload service',
    Type: 'String'
  },
  TaskingManagerSMTPHost: {
    Description: 'TM_SMTP_HOST environment variable',
    Type: 'String'
  },
  TaskingManagerSMTPPassword: {
    Description: 'TM_SMTP_PASSWORD environment variable',
    Type: 'String'
  },
  TaskingManagerSMTPUser: {
    Description: 'TM_SMTP_USER environment variable',
    Type: 'String'
  },
  TaskingManagerSMTPPort: {
    Description: 'TM_SMTP_PORT environment variable',
    Type: 'String'
  },
  TaskingManagerSMTPSSL: {
    Description: 'TM_SMTP_USE_SSL environment variable',
    Type: 'Number',
    AllowedValues: ['1', '0'],
    Default: '0'
  },
  TaskingManagerSMTPTLS: {
    Description: 'TM_SMTP_USE_TLS environment variable',
    Type: 'Number',
    AllowedValues: ['1', '0'],
    Default: '1'
  },
  TaskingManagerSendProjectUpdateEmails:{
    Description: 'TM_SEND_PROJECT_UPDATE_EMAILS environment variable',
    Type: 'Number',
    AllowedValues: ['1', '0'],
    Default: '1'
  },
  TaskingManagerDefaultChangesetComment: {
    Description: 'TM_DEFAULT_CHANGESET_COMMENT environment variable',
    Type: 'String'
  },
  TaskingManagerURL: {
    Description: 'URL for setting CNAME in Distribution; Ex: example.hotosm.org',
    Type: 'String',
    AllowedPattern: '^([a-zA-Z0-9-]*\\.){2}(\\w){2,20}$',
    ConstraintDescription: 'Parameter must be in the form of a url with subdomain.'
  },
  TaskingManagerOrgName: {
    Description: 'Org Name',
    Type: 'String'
  },
  TaskingManagerOrgCode: {
    Description: 'Org Code',
    Type: 'String'
  },
  SentryBackendDSN: {
    Description: "DSN for sentry",
    Type: 'String'
  },
  TaskingManagerLogo: {
    Description: "URL for logo",
    Type: "String"
  }
};

const Conditions = {
  UseASnapshot: cf.notEquals(cf.ref('DBSnapshot'), ''),
  DatabaseDumpFileGiven: cf.notEquals(cf.ref('DatabaseDump'), ''),
  IsTaskingManagerProduction: cf.equals(cf.ref('AutoscalingPolicy'), 'production'),
  IsTaskingManagerDemo: cf.equals(cf.ref('AutoscalingPolicy'), 'Demo (max 3)'),
  IsHOTOSMUrl: cf.equals(
    cf.select('1', cf.split('.', cf.ref('TaskingManagerURL')))
    , 'hotosm')
};

const Resources = {
  TaskingManagerASG: {
    DependsOn: 'TaskingManagerLaunchConfiguration',
    Type: 'AWS::AutoScaling::AutoScalingGroup',
    Properties: {
      AutoScalingGroupName: cf.stackName,
      Cooldown: 300,
      MinSize: cf.if('IsTaskingManagerProduction', 3, 1),
      DesiredCapacity: cf.if('IsTaskingManagerProduction', 3, 1),
      MaxSize: cf.if('IsTaskingManagerProduction', 9, cf.if('IsTaskingManagerDemo', 3, 1)),
      HealthCheckGracePeriod: 600,
      LaunchConfigurationName: cf.ref('TaskingManagerLaunchConfiguration'),
      TargetGroupARNs: [ cf.ref('TaskingManagerTargetGroup') ],
      HealthCheckType: 'EC2',
      AvailabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d', 'us-east-1f'],
      Tags: [{
        Key: 'Name',
        PropagateAtLaunch: true,
        Value: cf.stackName
      }]
    },
    UpdatePolicy: {
      AutoScalingRollingUpdate: {
        PauseTime: 'PT10M',
        MaxBatchSize: 2,
        WaitOnResourceSignals: true
      }
    }
  },
  TaskingManagerScaleUp: {
      Type: "AWS::AutoScaling::ScalingPolicy",
      Properties: {
        AutoScalingGroupName: cf.ref('TaskingManagerASG'),
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          TargetValue: 500,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ALBRequestCountPerTarget',
            ResourceLabel: cf.join('/', [
              cf.getAtt("TaskingManagerLoadBalancer", "LoadBalancerFullName"),
              cf.getAtt("TaskingManagerTargetGroup", "TargetGroupFullName")
            ])
          }
        },
        Cooldown: 300
      }
  },
  TaskingManagerLaunchConfiguration: {
    Type: "AWS::AutoScaling::LaunchConfiguration",
    Metadata: {
      "AWS::CloudFormation::Init": {
        "configSets": {
          "default": [
            "01_setupCfnHup",
            "02_config-amazon-cloudwatch-agent",
            "03_restart_amazon-cloudwatch-agent"
          ],
          "UpdateEnvironment": [
            "02_config-amazon-cloudwatch-agent",
            "03_restart_amazon-cloudwatch-agent"
            ]
        },
        // Definition of json configuration of AmazonCloudWatchAgent, you can change the configuration below.
        "02_config-amazon-cloudwatch-agent": {
          "files": {
            '/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json': {
              "content": cf.join("\n", [
                  "{\"logs\": {",
                  "\"logs_collected\": {",
                  "\"files\": {",
                  "\"collect_list\": [",
                  "{",
                  "\"file_path\": \"/opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log\",",
                  cf.sub("\"log_group_name\": \"${AWS::StackName}.log\","),
                  cf.sub("\"log_stream_name\": \"${AWS::StackName}-cloudwatch-agent.log\","),
                  "\"timezone\": \"UTC\"",
                  "},",
                  "{",
                  cf.sub("\"file_path\": \"${TaskingManagerLogDirectory}/tasking-manager.log\","),
                  cf.sub("\"log_group_name\": \"${AWS::StackName}.log\","),
                  cf.sub("\"log_stream_name\": \"${AWS::StackName}.log\","),
                  "\"timezone\": \"UTC\"",
                  "},",
                  "{",
                  cf.sub("\"file_path\": \"${TaskingManagerLogDirectory}/gunicorn-access.log\","),
                  cf.sub("\"log_group_name\": \"${AWS::StackName}.log\","),
                  cf.sub("\"log_stream_name\": \"${AWS::StackName}-gunicorn.log\","),
                  "\"timezone\": \"UTC\"",
                  "}]}},",
                  cf.sub("\"log_stream_name\": \"${AWS::StackName}-logs\","),
                  "\"force_flush_interval\" : 15",
                  "}}"
              ])
            }
          }
        },
        // Invoke amazon-cloudwatch-agent-ctl to restart the AmazonCloudWatchAgent.
        "03_restart_amazon-cloudwatch-agent": {
          "commands": {
            "01_stop_service": {
              "command": "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a stop"
            },
            "02_start_service": {
              "command": "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s"
            }
          }
        },
        // Cfn-hup setting, it is to monitor the change of metadata.
        // When there is change in the contents of json file in the metadata section, cfn-hup will call cfn-init to restart the AmazonCloudWatchAgent.
        "01_setupCfnHup": {
          "files": {
            "/etc/cfn/cfn-hup.conf": {
              "content": cf.join('\n', [
                "[main]",
                cf.sub("stack=${!AWS::StackName}"),
                cf.sub("region=${!AWS::Region}"),
                "interval=1"
              ]),
              "mode": "000400",
              "owner": "root",
              "group": "root"
            },
            "/etc/cfn/hooks.d/amazon-cloudwatch-agent-auto-reloader.conf": {
              "content": cf.join('\n', [
                "[cfn-auto-reloader-hook]",
                "triggers=post.update",
                "path=Resources.EC2Instance.Metadata.AWS::CloudFormation::Init.02_config-amazon-cloudwatch-agent",
                cf.sub("action=/usr/local/bin/cfn-init -v --stack ${AWS::StackName} --resource EC2Instance --region ${AWS::Region} --configsets UpdateEnvironment"),
                "runas=root"
              ]),
              "mode": "000400",
              "owner": "root",
              "group": "root"
            },
            "/lib/systemd/system/cfn-hup.service": {
              "content": cf.join('\n', [
                "[Unit]",
                "Description=cfn-hup daemon",
                "[Service]",
                "Type=simple",
                "ExecStart=/usr/local/bin/cfn-hup",
                "Restart=always",
                "[Install]",
                "WantedBy=multi-user.target"
                ])
            }
          },
          "commands": {
            "01enable_cfn_hup": {
            "command": "systemctl enable cfn-hup.service"
            },
            "02start_cfn_hup": {
              "command": "systemctl start cfn-hup.service"
            }
          }
        }
      }
    },
    Properties: {
      IamInstanceProfile: cf.ref('TaskingManagerEC2InstanceProfile'),
      ImageId: cf.ref('TaskingManagerBackendAMI'),
      InstanceType: cf.ref('TaskingManagerBackendInstanceType'),
      SecurityGroups: [cf.importValue(cf.join('-', ['hotosm-network-production', cf.ref('NetworkEnvironment'), 'ec2s-security-group', cf.region]))],
      UserData: cf.userData([
        '#!/bin/bash',
        'set -x',
        'sleep 10',
        'export DEBIAN_FRONTEND=noninteractive',
        'export LC_ALL="en_US.UTF-8"',
        'export LC_CTYPE="en_US.UTF-8"',
        'dpkg-reconfigure --frontend=noninteractive locales',
        'sudo apt-get -q -y update',
        'sudo DEBIAN_FRONTEND=noninteractive apt-get -q -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" dist-upgrade',
        'sudo apt-get -q -y install awscli curl git gnupg ruby wget',
        'sudo apt-get -q -y install python3.9 python3-pip python3-psycopg2 python-is-python3',
        'sudo apt-get -q -y install postgresql-client postgis libpq-dev',
        'sudo apt-get -q -y install libxml2 libxml2-dev',
        'sudo apt-get -q -y install libgeos-3.9.0 libgeos-dev',
        'sudo apt-get -q -y install libproj19 libproj-dev',
        'sudo apt-get -q -y install libjson-c-dev',
        'git clone --recursive https://github.com/hotosm/tasking-manager.git /opt/tasking-manager',
        'cd /opt/tasking-manager/',
        cf.sub('git reset --hard ${GitSha}'),
        'pip install --quiet --upgrade pip pdm',
        'wget --quiet https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-py3-latest.tar.gz -O /tmp/aws-cfn-bootstrap-py3-latest.tar.gz',
        'pip install /tmp/aws-cfn-bootstrap-py3-latest.tar.gz',
        'pdm install',
        'eval "$(pdm venv activate)"',
        'echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf',
        'export LC_ALL=C',
        'wget --quiet https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -O /tmp/amazon-cloudwatch-agent.deb',
        'dpkg -i /tmp/amazon-cloudwatch-agent.deb',
        'echo "Exporting environment variables:"',
        cf.sub('export NEW_RELIC_LICENSE=${NewRelicLicense}'),
        cf.join('', ['export POSTGRES_ENDPOINT=', cf.getAtt('TaskingManagerRDS','Endpoint.Address')]),
        cf.sub('export POSTGRES_DB=${PostgresDB}'),
        cf.sub('export POSTGRES_PASSWORD="${PostgresPassword}"'),
        cf.sub('export POSTGRES_USER="${PostgresUser}"'),
        cf.sub('export TM_APP_BASE_URL="${TaskingManagerAppBaseUrl}"'),
        cf.sub('export TM_ENVIRONMENT="${AWS::StackName}"'),
        cf.sub('export TM_CLIENT_ID="${TaskingManagerOAuthClientID}"'),
        cf.sub('export TM_CLIENT_SECRET="${TaskingManagerOAuthClientSecret}"'),
        cf.sub('export TM_REDIRECT_URI="${TaskingManagerAppBaseUrl}/authorized"'),
        'export TM_SCOPE="read_prefs write_api"',
        cf.sub('export TM_SECRET="${TaskingManagerSecret}"'),
        cf.sub('export TM_SMTP_HOST="${TaskingManagerSMTPHost}"'),
        cf.sub('export TM_SMTP_PASSWORD="${TaskingManagerSMTPPassword}"'),
        cf.sub('export TM_SMTP_PORT="${TaskingManagerSMTPPort}"'),
        cf.sub('export TM_SMTP_USER="${TaskingManagerSMTPUser}"'),
        cf.sub('export TM_SMTP_USE_SSL="${TaskingManagerSMTPSSL}"'),
        cf.sub('export TM_SMTP_USE_TLS="${TaskingManagerSMTPTLS}"'),
        cf.sub('export TM_DEFAULT_CHANGESET_COMMENT="${TaskingManagerDefaultChangesetComment}"'),
        cf.sub('export TM_EMAIL_FROM_ADDRESS="${TaskingManagerEmailFromAddress}"'),
        cf.sub('export TM_EMAIL_CONTACT_ADDRESS="${TaskingManagerEmailContactAddress}"'),
        cf.sub('export TM_LOG_LEVEL="${TaskingManagerLogLevel}"'),
        cf.sub('export TM_LOG_DIR="${TaskingManagerLogDirectory}"'),
        cf.sub('export TM_ORG_NAME="${TaskingManagerOrgName}"'),
        cf.sub('export TM_ORG_CODE="${TaskingManagerOrgCode}"'),
        cf.sub('export TM_ORG_LOGO="${TaskingManagerLogo}"'),
        cf.sub('export TM_IMAGE_UPLOAD_API_URL="${TaskingManagerImageUploadAPIURL}"'),
        cf.sub('export TM_IMAGE_UPLOAD_API_KEY="${TaskingManagerImageUploadAPIKey}"'),
        'psql "host=$POSTGRES_ENDPOINT dbname=$POSTGRES_DB user=$POSTGRES_USER password=$POSTGRES_PASSWORD" -c "CREATE EXTENSION IF NOT EXISTS postgis"',
        cf.if('DatabaseDumpFileGiven', cf.sub('aws s3 cp ${DatabaseDump} dump.sql; sudo -u postgres psql "postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_ENDPOINT/$POSTGRES_DB" < dump.sql'), ''),
        'pdm run flask db upgrade',
        'echo "------------------------------------------------------------"',
        cf.sub('export NEW_RELIC_LICENSE_KEY="${NewRelicLicense}"'),
        cf.sub('export TM_SENTRY_BACKEND_DSN="${SentryBackendDSN}"'),
        'export NEW_RELIC_ENVIRONMENT=$TM_ENVIRONMENT',
        cf.sub('NEW_RELIC_CONFIG_FILE=./scripts/aws/cloudformation/newrelic.ini newrelic-admin run-program gunicorn -b 0.0.0.0:8000 --worker-class gevent --workers 5 --timeout 179 --access-logfile ${TaskingManagerLogDirectory}/gunicorn-access.log --access-logformat \'%(h)s %(l)s %(u)s %(t)s \"%(r)s\" %(s)s %(b)s %(T)s \"%(f)s\" \"%(a)s\"\' manage:application &'),
        cf.sub('sudo /usr/local/bin/cfn-init -v --stack ${AWS::StackName} --resource TaskingManagerLaunchConfiguration --region ${AWS::Region} --configsets default'),
        cf.sub('/usr/local/bin/cfn-signal --exit-code $? --region ${AWS::Region} --resource TaskingManagerASG --stack ${AWS::StackName}')
      ]),
      KeyName: 'mbtiles'
    }
  },
  TaskingManagerEC2Role: {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: {
             Service: [ "ec2.amazonaws.com" ]
          },
          Action: [ "sts:AssumeRole" ]
        }]
      },
      ManagedPolicyArns: [
          'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
          'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      ],
      Policies: [{
        PolicyName: "RDSPolicy",
        PolicyDocument: {
          Version: "2012-10-17",
          Statement:[{
            Action: ['rds:DescribeDBInstances'],
            Effect: 'Allow',
            Resource: ['arn:aws:rds:*']
          }]
        }
      }, {
        PolicyName: "CloudFormationPermissions",
        PolicyDocument: {
          Version: "2012-10-17",
          Statement:[{
            Action: [
              'cloudformation:SignalResource',
              'cloudformation:DescribeStackResource'
            ],
            Effect: 'Allow',
            Resource: ['arn:aws:cloudformation:*']
          }]
        }
      }
      ],
      RoleName: cf.join('-', [cf.stackName, 'ec2', 'role'])
    }
  },
  TaskingManagerDatabaseDumpAccessRole: {
    Condition: 'DatabaseDumpFileGiven',
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: {
             Service: [ "ec2.amazonaws.com" ]
          },
          Action: [ "sts:AssumeRole" ]
        }]
      },
      Policies: [{
        PolicyName: "RDSPolicy",
        PolicyDocument: {
          Version: "2012-10-17",
          Statement:[{
            Action: ['rds:DescribeDBInstances'],
            Effect: 'Allow',
            Resource: ['arn:aws:rds:*']
          }]
        }
      }, {
        PolicyName: "CloudFormationPermissions",
        PolicyDocument: {
          Version: "2012-10-17",
          Statement:[{
            Action: [
              'cloudformation:SignalResource',
              'cloudformation:DescribeStackResource'
            ],
            Effect: 'Allow',
            Resource: ['arn:aws:cloudformation:*']
          }]
        }
      }, {
        PolicyName: "AccessToDatabaseDump",
        PolicyDocument: {
          Version: "2012-10-17",
          Statement:[{
            Action: [ 's3:ListBucket'],
            Effect: 'Allow',
            Resource: [ cf.join('',
              ['arn:aws:s3:::',
                cf.select(0,
                  cf.split('/',
                    cf.select(1,
                      cf.split('s3://', cf.ref('DatabaseDump'))
                    )
                  )
                )
              ]
            )]
          }, {
            Action: [
              's3:GetObject',
              's3:GetObjectAcl',
              's3:ListObjects',
              's3:ListBucket'
            ],
            Effect: 'Allow',
            Resource: [cf.join('',
              ['arn:aws:s3:::',
                cf.select(1,
                  cf.split('s3://', cf.ref('DatabaseDump'))
              )]
            )]
          }]
        }
      }],
      RoleName: cf.join('-', [cf.stackName, 'ec2', 'database-dump-access', 'role'])
    }
  },
  TaskingManagerEC2InstanceProfile: {
     Type: "AWS::IAM::InstanceProfile",
     Properties: {
        Roles: cf.if('DatabaseDumpFileGiven', [cf.ref('TaskingManagerDatabaseDumpAccessRole')], [cf.ref('TaskingManagerEC2Role')]),
        InstanceProfileName: cf.join('-', [cf.stackName, 'ec2', 'instance', 'profile'])
     }
  },
  TaskingManagerLoadBalancer: {
    Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
    Properties: {
      Name: cf.stackName,
      SecurityGroups: [cf.importValue(cf.join('-', ['hotosm-network-production', cf.ref('NetworkEnvironment'), 'elbs-security-group', cf.region]))],
      Subnets: cf.ref('ELBSubnets'),
      Type: 'application',
      IpAddressType: 'dualstack',
      Tags: [ { "Key": "stack_name", "Value": cf.stackName } ]
    }
  },
  TaskingManagerLoadBalancerRoute53: {
    Type: 'AWS::Route53::RecordSet',
    Properties: {
      Name: cf.join('-', [cf.stackName, 'api.hotosm.org']),
      Type: 'A',
      AliasTarget: {
        DNSName: cf.getAtt('TaskingManagerLoadBalancer', 'DNSName'),
        HostedZoneId: cf.getAtt('TaskingManagerLoadBalancer', 'CanonicalHostedZoneID')
      },
      HostedZoneId: 'Z2O929GW6VWG99',
    }
  },
  TaskingManagerTargetGroup: {
    Type: 'AWS::ElasticLoadBalancingV2::TargetGroup',
    Properties: {
      HealthCheckIntervalSeconds: 60,
      HealthCheckPort: 8000,
      HealthCheckProtocol: 'HTTP',
      HealthCheckTimeoutSeconds: 10,
      HealthyThresholdCount: 3,
      UnhealthyThresholdCount: 3,
      HealthCheckPath: '/api/v2/system/heartbeat/',
      Port: 8000,
      Protocol: 'HTTP',
      VpcId: cf.importValue(cf.join('-', ['hotosm-network-production', 'default-vpc', cf.region])),
      Tags: [ { "Key": "stack_name", "Value": cf.stackName } ],
      Matcher: {
        HttpCode: '200,202,302,304'
      }
    }
  },
  TaskingManagerLoadBalancerHTTPSListener: {
    Type: 'AWS::ElasticLoadBalancingV2::Listener',
    Properties: {
      Certificates: [ {
        CertificateArn: cf.arn('acm', cf.ref('SSLCertificateIdentifier'))
      }],
      DefaultActions: [{
        Type: 'forward',
        TargetGroupArn: cf.ref('TaskingManagerTargetGroup')
      }],
      LoadBalancerArn: cf.ref('TaskingManagerLoadBalancer'),
      Port: 443,
      Protocol: 'HTTPS',
      SslPolicy: 'ELBSecurityPolicy-TLS13-1-2-2021-06'
    }
  },
  TaskingManagerLoadBalancerHTTPListener: {
    Type: 'AWS::ElasticLoadBalancingV2::Listener',
    Properties: {
      DefaultActions: [{
        Type: 'redirect',
        RedirectConfig: {
          Protocol: 'HTTPS',
          Port: '443',
          Host: '#{host}',
          Path: '/#{path}',
          Query: '#{query}',
          StatusCode: 'HTTP_301'
        }
      }],
      LoadBalancerArn: cf.ref('TaskingManagerLoadBalancer'),
      Port: 80,
      Protocol: 'HTTP'
    }
  },
  TaskingManagerRDS: {
    Type: 'AWS::RDS::DBInstance',
    Metadata: {
      Todo: 'Spin out database components into its own cloudformation template'
    },
    Properties: {
        Engine: 'postgres',
	AllowMajorVersionUpgrade: true,
        DBName: cf.if('UseASnapshot', cf.noValue, cf.ref('PostgresDB')),
        EngineVersion: cf.ref('DatabaseEngineVersion'),
        MasterUsername: cf.if('UseASnapshot', cf.noValue, cf.ref('PostgresUser')),
        MasterUserPassword: cf.if('UseASnapshot', cf.noValue, cf.ref('PostgresPassword')),
        AllocatedStorage: cf.ref('DatabaseDiskSize'),
        BackupRetentionPeriod: cf.ref('DatabaseSnapshotRetentionPeriod'),
        StorageType: 'gp2',
        DBParameterGroupName: cf.ref('DatabaseParameterGroupName'),
        EnableCloudwatchLogsExports: ['postgresql'],
        DBInstanceClass: cf.ref('DatabaseInstanceType'),
        DBSnapshotIdentifier: cf.if('UseASnapshot', cf.ref('DBSnapshot'), cf.noValue),
        VPCSecurityGroups: [cf.importValue(cf.join('-', ['hotosm-network-production', cf.ref('NetworkEnvironment'), 'ec2s-security-group', cf.region]))],
	PubliclyAccessible: false
    }
  },
  TaskingManagerReactBucket: {
    Type: 'AWS::S3::Bucket',
    Properties: {
      BucketName: cf.join('-', [cf.stackName, 'react-app']),
      WebsiteConfiguration: {
        ErrorDocument: 'index.html',
        IndexDocument: 'index.html'
      },
      AccessControl: "Private"
    }
  },
  TaskingManagerReactBucketPolicy: {
    Type: 'AWS::S3::BucketPolicy',
    Metadata: {
      TODO: "Condition: { StringEquals: { AWS:SourceArn: arn:aws:cloudfront::6000000:distribution/EH2ANTHENTH } }"
    },
    Properties: {
      Bucket : cf.ref('TaskingManagerReactBucket'),
      PolicyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: [ "s3:GetObject" ],
            Effect: 'Allow',
            Principal: "*",
            Resource: [
              cf.join("/", [
                  cf.getAtt("TaskingManagerReactBucket", "Arn"),
                  "*"
              ])
            ],
            Sid: "PublicGetObject"
          },
          {
            Action: [ "s3:ListBucket" ],
            Effect: "Allow",
            Principal: "*",
            Resource: [
              cf.getAtt("TaskingManagerReactBucket", "Arn")
            ],
            Sid: "PublicListBucket"
          }
        ]
      }
    }
  },
  TaskingManagerReactCloudfront: {
    Type: "AWS::CloudFront::Distribution",
    Properties: {
      DistributionConfig: {
        Comment: cf.join(" ", [ "Frontend CDN for Tasking Manager", cf.ref("NetworkEnvironment") ] ),
        DefaultRootObject: 'index.html',
        Aliases: [ cf.ref('TaskingManagerURL') ],
        Enabled: true,
        HttpVersion: "http2",
        IPV6Enabled: true,
        Origins: [
          {
            Id: cf.join('-', [cf.stackName, 'react-app']),
            DomainName: cf.getAtt('TaskingManagerReactBucket', 'DomainName'), // NOTE: Can also be WebsiteURL
            CustomOriginConfig: {
              OriginProtocolPolicy: "https-only",
              OriginSSLProtocols: [ "TLSv1.2" ]
            }
          }
        ],
        CustomErrorResponses: [{
          ErrorCachingMinTTL : 0,
          ErrorCode: 403,
          ResponseCode: 200,
          ResponsePagePath: '/index.html'
        },{
          ErrorCachingMinTTL : 0,
          ErrorCode: 404,
          ResponseCode: 200,
          ResponsePagePath: '/index.html'
        }],
        DefaultCacheBehavior: {
          AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          CachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          ForwardedValues: {
            QueryString: true,
            Cookies: {
              Forward: 'all'
            },
            Headers: ['Accept', 'Referer']
          },
          Compress: true,
          TargetOriginId: cf.join('-', [cf.stackName, 'react-app']),
          ViewerProtocolPolicy: "redirect-to-https"
        },
        ViewerCertificate: {
          AcmCertificateArn: cf.arn('acm', cf.ref('SSLCertificateIdentifier')),
          MinimumProtocolVersion: 'TLSv1.2_2021',
          SslSupportMethod: 'sni-only'
        }
      }
    }
  },
  TaskingManagerRoute53: {
    Type: 'AWS::Route53::RecordSet',
    Condition: 'IsHOTOSMUrl',
    Properties: {
      Name: 't0.hotosm.org',
      Type: 'A',
      AliasTarget: {
        DNSName: cf.getAtt('TaskingManagerReactCloudfront', 'DomainName'),
        HostedZoneId: 'Z2FDTNDATAQYW2'
      },
      HostedZoneId: 'Z2O929GW6VWG99',
    }
  },
  TaskingManagerDNSEntries: {
    Type: "AWS::Route53::RecordSetGroup",
    Condition: "IsHOTOSMUrl",
    Properties: {
      Comment: "DNS records pointing to CDN Frontend",
      HostedZoneId: 'Z2O929GW6VWG99', // This is hotosm.org hosted Zone ID on Route53
      RecordSets: [
        {
          Name: cf.ref('TaskingManagerURL'),
          Type: 'A',
          AliasTarget: {
            DNSName: cf.getAtt('TaskingManagerReactCloudfront', 'DomainName'),
            HostedZoneId: 'Z2FDTNDATAQYW2' // TODO: This is defined in the AWS Documentation
          }
        },
        {
          Name: cf.ref('TaskingManagerURL'),
          Type: 'AAAA',
          AliasTarget: {
            DNSName: cf.getAtt('TaskingManagerReactCloudfront', 'DomainName'),
            HostedZoneId: 'Z2FDTNDATAQYW2' // TODO: This is defined in the AWS Documentation
          },
        }
      ]
    }
  }
};

const Outputs = {
  CloudfrontDistributionID: {
    Value: cf.ref('TaskingManagerReactCloudfront'),
    Export: {
      Name: cf.join('-', [cf.stackName, 'cloudfront-id', cf.region])
    }
  }
}

module.exports = { Parameters, Resources, Conditions, Outputs }
