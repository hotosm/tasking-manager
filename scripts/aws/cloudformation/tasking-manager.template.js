// Running:
// cfn-config update tm4-production tasking-manager.template.js -c hot-cfn-config -t hot-cfn-config -r us-east-1 -n tasking-manager
// TODO: Explore Mappings
// TODO: Mixed instance types for AutoScalingGroup
// TODO: ARM Architecture instances
const cf = require('@mapbox/cloudfriend');

const Parameters = {
  BackendAMI: {
    Type: "AWS::EC2::Image::Id",
    Default: "ami-0574da719dca65348",
    Description: "AMI ID of the Backend instance"
  },
  BackendInstanceType: {
    Type: "String",
    Default: "t3.small",
    Description: "Instance Type for the Backend. ARM instance type later?"
  },
  BackendAvailabilityZones: {
    Type: "CommaDelimitedList",
    Default: "us-east-1a, us-east-1b, us-east-1c, us-east-1d, us-east-1e, us-east-1f",
    Description: "AZ in which to place the backend instances"
  },
  LoadBalancerTLSPolicy: {
    Type: "String",
    Default: "ELBSecurityPolicy-FS-1-2-Res-2020-10",
    Description: "TLS Policy for the SSL Listener in the Load Balancer"
  },
  DNSZoneID: {
    Type: "AWS::Route53::HostedZone::Id",
    Default: "Z2O929GW6VWG99",
    Description: "Zone ID of hotosm.org hosted zone in AWS Route53"
  },
  DatabaseCredentials: {
    Type: "String",
    Default: "staging/tasking-manager/database-rBN2Q4",
    Description: "SecretsManager Secret containing database credentials; JsonKeys: host,port,username,password,dbname,dbInstanceIdentifier"
  },
  SMTPCredentials: {
    Type: "String",
    Default: "staging/tasking-manager/smtp-xXBHVH",
    Description: "SecretsManager Secret containing SMTP credentials; JsonKeys: host,port,user,password"
  },
  TaskingManagerSecret: {
    Type: 'String',
    Default: "staging/tasking-manager/secret-EbZzgG",
    Description: "SecretsManager Secret containing Tasking Manager Secret string; JsonKey: secret",
  },
  OSMOAuth2Credentials: {
    Type: 'String',
    Default: "staging/tasking-manager/osm-app-client-JBKOWM",
    Description: "SecretsManager Secret containing OSM OAuth2 App credentials; JsonKey: OAuth2_Client_Id, OAuth2_Client_Secret",
  },
  GitSha: {
    Type: 'String',
    AllowedPattern: '[a-fA-F0-9]{40}',
  },
  NetworkEnvironment: {
    Type :'String',
    AllowedValues: ['staging', 'production']
  },
  DeploymentEnvironment: {
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
  DatabaseEngineVersion: {
    Description: 'AWS PostgreSQL Engine version',
    Type: 'String',
    Default: '13.7'
  },
  DatabaseParameterGroupFamily: {
    Type: "String",
    Default: "postgres13",
    Description: "Parameter Group Family"
  },
  DatabaseInstanceType: {
    Description: 'Database instance type',
    Type: 'String',
    Default: 'db.t4g.xlarge'
  },
  DatabaseDiskSize: {
    Description: 'Database size in GB',
    Type: 'String',
    Default: '100'
  },
  DatabaseSnapshotRetentionPeriod: {
    Description: 'Retention period for automatic (scheduled) snapshots in days',
    Type: 'Number',
    Default: 10
  },
  PublicSubnets: {
    Description: 'List of public subnets for load balancer',
    Type: 'CommaDelimitedList' // Type: List<AWS::EC2::Subnet::Id>
  },
  PrivateSubnets: {
    Description: 'List of public subnets for load balancer',
    Type: 'CommaDelimitedList' // Type: List<AWS::EC2::Subnet::Id>
  },
  SSLCertificateIdentifier: {
    Type: 'String',
    Description: 'SSL certificate for HTTPS protocol'
  },
  TaskingManagerLogDirectory: {
    Description: 'TM_LOG_DIR environment variable',
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
  IsProduction: cf.equals(cf.ref('DeploymentEnvironment'), 'production'),
  IsDemo: cf.equals(cf.ref('DeploymentEnvironment'), 'Demo (max 3)'),
  IsHOTOSMUrl: cf.equals(
    cf.select('1', cf.split('.', cf.ref('TaskingManagerURL')))
    , 'hotosm')
};

const Resources = {
  TaskingManagerASG: {
    DependsOn: 'BackendLaunchTemplate',
    Type: 'AWS::AutoScaling::AutoScalingGroup',
    Metadata: {
      TODO: "Add Mixed Instance type with spot instances in the mix"
    },
    Properties: {
      AutoScalingGroupName: "TM-Backend-Scaling",
      Cooldown: 300,
      MinSize: cf.if('IsProduction', 3, 1),
      DesiredCapacity: cf.if('IsProduction', 3, 1),
      MaxSize: cf.if('IsProduction', 9, cf.if('IsDemo', 3, 1)),
      HealthCheckGracePeriod: 600,
      LaunchTemplate: {
        LaunchTemplateId: cf.ref("BackendLaunchTemplate"),
        Version: cf.getAtt("BackendLaunchTemplate", "LatestVersionNumber")
      },
      TargetGroupARNs: [ cf.ref('TaskingManagerTargetGroup') ],
      HealthCheckType: 'EC2',
      AvailabilityZones: cf.ref("BackendAvailabilityZones"),
      // VPCZoneIdentifier: cf.ref("PublicSubnets"),
      Tags: [
  {
          Key: 'Name',
          PropagateAtLaunch: true,
          Value: cf.stackName
        }
      ]
    },
    UpdatePolicy: {
      AutoScalingRollingUpdate: {
        PauseTime: 'PT60M',
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
  BackendLaunchTemplate: {
    Type: "AWS::EC2::LaunchTemplate",
    Metadata: {
      TODO: "Use instance type criteria rather than hard-coding it",
      TODO2: "Add agents for JumpCloud, CloudWatch, NewRelic, Systems Manager",
      "AWS::CloudFormation::Init": {
        configSets: {
          default: [
            "01_install_packages",
            "01_setup_CfnHup",
            "02_config_cloudwatch_agent",
            "03_restart_cloudwatch_agent"
          ],
          UpdateEnvironment: [
            "02_config_cloudwatch_agent",
            "03_restart_cloudwatch_agent"
            ]
        },
        "01_install_packages": {
          "apt": {
            "awscli": [],
            "curl": [],
            "git": [],
            "libgdal-dev": [],
            "libpq-dev": [],
            "python3-pip": [],
            "python3-psycopg2": [],
            "python3-venv": [],
            "ruby": [],
            "wget": [],
            "postgresql-14": [],
            "postgresql-14-postgis-3": [],
            "postgresql-14-postgis-3-scripts": [],
            "postgis": [],
            "libpq-dev": [],
            "libxml2": [],
            "libxml2-dev": [],
            "libgeos3.10.2": [],
            "libgeos-dev": [],
            "libproj22": [],
            "libproj-dev": [],
            "libjson-c-dev": [],
          }
        },
        // Definition of json configuration of AmazonCloudWatchAgent, you can change the configuration below.
        "02_config_cloudwatch_agent": {
          "files": {
            '/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json': {
              content: cf.join("\n", [
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
        "03_restart_cloudwatch_agent": {
          commands: {
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
        "01_setup_CfnHup": {
          files: {
            "/etc/cfn/cfn-hup.conf": {
              content: cf.join('\n', [
                "[main]",
                cf.sub("stack=${!AWS::StackName}"),
                cf.sub("region=${!AWS::Region}"),
                "interval=1"
              ]),
              mode: "000400",
              owner: "root",
              group: "root"
            },
            "/etc/cfn/hooks.d/amazon-cloudwatch-agent-auto-reloader.conf": {
              content: cf.join('\n', [
                "[cfn-auto-reloader-hook]",
                "triggers=post.update",
                "path=Resources.EC2Instance.Metadata.AWS::CloudFormation::Init.02_config-amazon-cloudwatch-agent",
                cf.sub("action=cfn-init -v --stack ${AWS::StackName} --resource BackendLaunchTemplate --region ${AWS::Region} --configsets UpdateEnvironment"),
                "runas=root"
              ]),
              mode: "000400",
              owner: "root",
              group: "root"
            },
            "/lib/systemd/system/cfn-hup.service": {
              content: cf.join('\n', [
                "[Unit]",
                "Description=cfn-hup daemon",
                "[Service]",
                "Type=simple",
                "ExecStart=/opt/aws/bin/cfn-hup",
                "Restart=always",
                "[Install]",
                "WantedBy=multi-user.target"
                ])
            }
          },
          services: {
            systemd: {
              "cfn-hup": {
                enabled: true,
                ensureRunning: true,
                files: [
                  "/etc/cfn/cfn-hup.conf",
                ]
              }
            }
          }
        }
      }
    },
    Properties: {
      LaunchTemplateName: "TM-Backend-Instances",
      VersionDescription: "Tasking Manager Backend EC2 Instances",
      LaunchTemplateData: {
        EbsOptimized: true,
        IamInstanceProfile: {
          Name: cf.ref('TaskingManagerEC2InstanceProfile'),
        },
        ImageId: cf.ref("BackendAMI"),
        InstanceType: cf.ref("BackendInstanceType"),
        KeyName: "mbtiles",
        SecurityGroupIds: [ cf.importValue(cf.join('-', ['hotosm-network-production', cf.ref('NetworkEnvironment'), 'ec2s-security-group', cf.region])) ],
        TagSpecifications: [
          {
            ResourceType: "instance",
            Tags: [
              { Key: "PatchGroup", Value: "Production" },
              { Key: "Name", Value: "TM Backend" },
              { Key: "Role", Value: "Backend" },
              { Key: "App", Value: "Tasking-Manager" },
            ],
          }
        ],
        UserData: cf.userData([
          '#!/bin/bash -xe',
          'sleep 60',
          'export DEBIAN_FRONTEND=noninteractive',
          'export LC_ALL="en_US.UTF-8"',
          'export LC_CTYPE="en_US.UTF-8"',
          'dpkg-reconfigure --frontend=noninteractive locales',
          'apt-get -y update',
          'DEBIAN_FRONTEND=noninteractive apt-get -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" upgrade',
	  'apt-get -y install python3-pip python3-venv',
          'git clone --recursive https://github.com/hotosm/tasking-manager.git',
          'cd tasking-manager/',
          cf.sub('git reset --hard ${GitSha}'),
          'python3 -m venv ./venv',
          '. ./venv/bin/activate',
          'pip install --upgrade pip',
          'pip install -r requirements.txt',
          'echo fs.inotify.max_user_watches=524288 | tee -a /etc/sysctl.conf',
          'export LC_ALL=C',
          'wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -O /tmp/amazon-cloudwatch-agent.deb',
          'dpkg -i /tmp/amazon-cloudwatch-agent.deb',
          'wget https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-py3-latest.tar.gz',
          'python3 -m easy_install --script-dir /opt/aws/bin aws-cfn-bootstrap-py3-latest.tar.gz',
          'echo "Exporting environment variables:"',
          cf.sub('export NEW_RELIC_LICENSE=${NewRelicLicense}'),
          cf.sub('export TM_APP_BASE_URL="${TaskingManagerAppBaseUrl}"'),
          cf.sub('export TM_ENVIRONMENT="${AWS::StackName}"'),
          cf.sub('export TM_REDIRECT_URI="${TaskingManagerAppBaseUrl}/authorized"'),
          'export TM_SCOPE="read_prefs write_api"',
          cf.join('', ['export POSTGRES_ENDPOINT=', cf.getAtt('TaskingManagerRDS','Endpoint.Address')]),
          cf.join('', ["export POSTGRES_DB={{resolve:secretsmanager:arn:aws:secretsmanager:us-east-1:670261699094:secret:", cf.ref("DatabaseCredentials"), ":SecretString:dbname"]),
          cf.join('', ["export POSTGRES_USER={{resolve:secretsmanager:arn:aws:secretsmanager:us-east-1:670261699094:secret:", cf.ref("DatabaseCredentials"), ":SecretString:username"]),
          cf.join('', ["export POSTGRES_PASSWORD={{resolve:secretsmanager:arn:aws:secretsmanager:us-east-1:670261699094:secret:", cf.ref("DatabaseCredentials"), ":SecretString:password"]),
          cf.join('', ["export TM_CLIENT_ID={{resolve:secretsmanager:arn:aws:secretsmanager:us-east-1:670261699094:secret:", cf.ref("OSMOAuth2Credentials"), ":SecretString:OAuth2_Client_Id"]),
          cf.join('', ["export TM_CLIENT_SECRET={{resolve:secretsmanager:arn:aws:secretsmanager:us-east-1:670261699094:secret:", cf.ref("OSMOAuth2Credentials"), ":SecretString:OAuth2_Client_Secret"]),
          cf.join('', ["export TM_SECRET={{resolve:secretsmanager:arn:aws:secretsmanager:us-east-1:670261699094:secret:", cf.ref("TaskingManagerSecret"), ":SecretString:secret"]),
          cf.join('', ["export TM_SMTP_HOST={{resolve:secretsmanager:arn:aws:secretsmanager:us-east-1:670261699094:secret:", cf.ref("SMTPCredentials"), ":SecretString:host"]),
          cf.join('', ["export TM_SMTP_PORT={{resolve:secretsmanager:arn:aws:secretsmanager:us-east-1:670261699094:secret:", cf.ref("SMTPCredentials"), ":SecretString:port"]),
          cf.join('', ["export TM_SMTP_USER={{resolve:secretsmanager:arn:aws:secretsmanager:us-east-1:670261699094:secret:", cf.ref("SMTPCredentials"), ":SecretString:user"]),
          cf.join('', ["export TM_SMTP_PASSWORD={{resolve:secretsmanager:arn:aws:secretsmanager:us-east-1:670261699094:secret:", cf.ref("SMTPCredentials"), ":SecretString:password"]),
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
          './venv/bin/python3 manage.py db upgrade',
          'echo "------------------------------------------------------------"',
          'pushd /home/ubuntu',
          'wget https://aws-codedeploy-us-east-1.s3.us-east-1.amazonaws.com/latest/install',
          'chmod +x ./install && ./install auto',
          'systemctl start codedeploy-agent',
          'popd',
          cf.sub('export NEW_RELIC_LICENSE_KEY="${NewRelicLicense}"'),
          cf.sub('export TM_SENTRY_BACKEND_DSN="${SentryBackendDSN}"'),
          'export NEW_RELIC_ENVIRONMENT=$TM_ENVIRONMENT',
          cf.sub('NEW_RELIC_CONFIG_FILE=./scripts/aws/cloudformation/newrelic.ini newrelic-admin run-program gunicorn -b 0.0.0.0:8000 --worker-class gevent --workers 5 --timeout 179 --access-logfile ${TaskingManagerLogDirectory}/gunicorn-access.log --access-logformat \'%(h)s %(l)s %(u)s %(t)s \"%(r)s\" %(s)s %(b)s %(T)s \"%(f)s\" \"%(a)s\"\' manage:application &'),
          cf.sub('/opt/aws/bin/cfn-init -v --stack ${AWS::StackName} --resource BackendLaunchTemplate --region ${AWS::Region} --configsets default'),
          cf.sub('/opt/aws/bin/cfn-signal --exit-code $? --region ${AWS::Region} --resource TaskingManagerASG --stack ${AWS::StackName}')
      ]),
      },
      TagSpecifications: [ 
        {
          ResourceType: "launch-template",
          Tags: [
            { Key: "Name", Value: "TaskingManager-Backend-Template" },
          ]
        },
      ],
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
          'arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforAWSCodeDeploy',
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
      Subnets: cf.ref('PublicSubnets'),
      Type: 'application'
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
      SslPolicy: cf.ref('LoadBalancerTLSPolicy')
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
  DatabaseParameterGroup: {
    Type: "AWS::RDS::DBParameterGroup",
    Properties: {
      DBParameterGroupName: cf.join("-", ["tm", cf.ref("DeploymentEnvironment"), cf.ref("DatabaseParameterGroupFamily")]),
      Family: cf.ref("DatabaseParameterGroupFamily"),
      Description: "Database Parameter Group for Tasking Manager Database"
    }
  },
  TaskingManagerRDS: {
    Type: 'AWS::RDS::DBInstance',
    Metadata: {
      TODO: "Spin out database components into its own cloudformation template",
      TODO2: "gp3 volume type. But only for disks larger than 400GB"
    },
    Properties: {
        Engine: 'postgres',
        EngineVersion: cf.ref('DatabaseEngineVersion'),
  DBInstanceIdentifier: cf.join("-", ["tasking-manager", cf.ref("DeploymentEnvironment")]),
        DBName: cf.if('UseASnapshot', cf.noValue, cf.join(
          ':',
          [
            "{{resolve:secretsmanager:arn:aws:secretsmanager:us-east-1:670261699094:secret",
            cf.ref("DatabaseCredentials"),
            "SecretString:dbname}}"
          ]
        )),
        MasterUsername: cf.if('UseASnapshot', cf.noValue, cf.join(
          ':',
          [
            "{{resolve:secretsmanager:arn:aws:secretsmanager:us-east-1:670261699094:secret",
            cf.ref("DatabaseCredentials"),
            "SecretString:username}}"
          ]
        )),
        MasterUserPassword: cf.if('UseASnapshot', cf.noValue, cf.join(
          ':',
          [
            "{{resolve:secretsmanager:arn:aws:secretsmanager:us-east-1:670261699094:secret",
            cf.ref("DatabaseCredentials"),
            "SecretString:password}}"
          ]
        )),
        AllocatedStorage: cf.if('IsProduction', cf.ref('DatabaseDiskSize'), 30),
        BackupRetentionPeriod: cf.if('IsProduction', cf.ref("DatabaseSnapshotRetentionPeriod"), 1),
        StorageType: 'gp2',
  // StorageThroughput: 125,
        DBParameterGroupName: cf.ref('DatabaseParameterGroup'),
        EnableCloudwatchLogsExports: ['postgresql'],
        DBInstanceClass: cf.if('IsProduction', cf.ref('DatabaseInstanceType'), "db.t4g.small"),
        DBSnapshotIdentifier: cf.if('UseASnapshot', cf.ref('DBSnapshot'), cf.noValue),
        VPCSecurityGroups: [cf.importValue(cf.join('-', ['hotosm-network-production', cf.ref('NetworkEnvironment'), 'ec2s-security-group', cf.region]))],
    }
  },
  TaskingManagerReactBucket: {
    Type: 'AWS::S3::Bucket',
    Properties: {
      BucketName: cf.join('-', [cf.stackName, 'react-app']),
      AccessControl: "Private",
      WebsiteConfiguration: {
        ErrorDocument: 'index.html',
        IndexDocument: 'index.html'
      }
    }
  },
  FrontendBucketReadOnlyPolicy: {
    Type: "AWS::S3::BucketPolicy",
    Metadata: {
      TODO: "Condition: { StringEquals: { AWS:SourceArn: arn:aws:cloudfront::6000000:distribution/EH2ANTHENTH } }"
    },
    Properties: {
      Bucket: cf.ref("TaskingManagerReactBucket"),
      PolicyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: [ "s3:GetObject" ],
            Effect: "Allow",
            Principal: {
        "Service": [ "cloudfront.amazonaws.com" ]
      },
            Resource: [
              cf.join("/", 
                [
                  cf.getAtt("TaskingManagerReactBucket", "Arn"),
                  "*"
                ])
            ],
            Sid: "AllowCloudFrontServicePrincipalReadOnly"
          }
        ]
      }
    }
  },
  TaskingManagerCachePolicy: {
    Type: "AWS::CloudFront::CachePolicy",
    Properties: {
      CachePolicyConfig: {
        Name: "TaskingManagerFrontendCaching",
        DefaultTTL: "86400",
        MinTTL: "300",
        MaxTTL: "31536000",
        Comment: "Tasking Manager Frontend CDN Cache Policy",
        ParametersInCacheKeyAndForwardedToOrigin: {
          CookiesConfig: {
            CookieBehavior: "all"
          },
          EnableAcceptEncodingBrotli: true,
          EnableAcceptEncodingGzip: true,
          HeadersConfig: {
            HeaderBehavior: "whitelist",
            Headers: ["Accept", "Authorization", "Referer", "x-api-key"]
          },
          QueryStringsConfig: {
            QueryStringBehavior: "all"
          }
        }
      }
    }
  },
  TaskingManagerReactCloudfront: {
    Type: "AWS::CloudFront::Distribution",
    Metadata: {
      TODO: "Fix Internal error"
    },
    Properties: {
      DistributionConfig: {
        Enabled: true,
        DefaultRootObject: 'index.html',
        Aliases: [ cf.ref('TaskingManagerURL') ],
        HttpVersion: "http2",
        IPV6Enabled: true,
        Origins: [
          {
            Id: cf.join('-', [cf.stackName, 'react-app']),
            DomainName: cf.getAtt('TaskingManagerReactBucket', 'DomainName'),
            CustomOriginConfig: {
              OriginProtocolPolicy: 'https-only',
            },
          }
        ],
        CustomErrorResponses: [
          {
            ErrorCachingMinTTL : 0,
            ErrorCode: 403,
            ResponseCode: 200,
            ResponsePagePath: '/index.html'
          },
          {
            ErrorCachingMinTTL : 0,
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: '/index.html'
          }
        ],
        DefaultCacheBehavior: {
          AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          CachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          Compress: true,
          TargetOriginId: cf.join('-', [cf.stackName, 'react-app']),
          ViewerProtocolPolicy: "redirect-to-https",
          CachePolicyId: cf.ref("TaskingManagerCachePolicy"),
          OriginRequestPolicyId: "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf", // Managed-CORS-S3Origin
          ResponseHeadersPolicyId: "67f7725c-6f97-4210-82d7-5512b31e9d03" // Managed-SecurityHeadersPolicy
        },
        ViewerCertificate: {
          AcmCertificateArn: cf.arn('acm', cf.ref('SSLCertificateIdentifier')),
          MinimumProtocolVersion: 'TLSv1.2_2021',
          SslSupportMethod: 'sni-only'
        }
      }
    }
  },
  TaskingManagerDNSEntries: {
    Type: "AWS::Route53::RecordSetGroup",
    Condition: "IsHOTOSMUrl",
    Properties: {
      Comment: "DNS records pointing to CDN Frontend",
      HostedZoneId: cf.ref("DNSZoneID"),
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

