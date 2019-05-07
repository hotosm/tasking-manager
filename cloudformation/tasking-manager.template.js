const cf = require('@mapbox/cloudfriend');

const Parameters = {
  GitSha: {
    Type: 'String'
  },
  Environment: {
    Type :'String',
    AllowedValues: ['staging', 'production']
  },
  DBSnapshot: {
    Type: 'String',
    Description: 'Specify an RDS snapshot ID, if you want to create the DB from a snapshot.',
    Default: ''
  },
  DatabaseDump: {
    Type: 'String',
    Description: 'Path to database dump on S3'
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
  TaskingManagerAppBaseUrl: {
    Type: 'String',
    Description: 'TM_APP_BASE_URL'
  },
  TaskingManagerConsumerKey: {
    Description: 'TM_CONSUMER_KEY',
    Type: 'String'
  },
  TaskingManagerConsumerSecret: {
      Description: 'TM_CONSUMER_SECRET',
      Type: 'String'
  },
  TaskingManagerSecret: {
    Description: 'TM_SECRET',
    Type: 'String'
  },
  TaskingManagerEmailFromAddress: {
    Description: 'TM_EMAIL_FROM_ADDRESS',
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
  TaskingManagerLogDirectory: {
    Description: 'TM_LOG_DIR environment variable',
    Type: 'String'
  },
  DatabaseSize: {
    Description: 'Database size in GB',
    Type: 'String',
    Default: '100'
  },
  ELBSubnets: {
    Description: 'ELB subnets',
    Type: 'String'
  },
  SSLCertificateIdentifier: {
    Type: 'String',
    Description: 'SSL certificate for HTTPS protocol'
  }
};

const Conditions = {
  UseASnapshot: cf.notEquals(cf.ref('DBSnapshot'), ''),
  DatabaseDumpFileGiven: cf.notEquals(cf.ref('DatabaseDump'), '')
};

const Resources = {
  TaskingManagerASG: {
    DependsOn: 'TaskingManagerLaunchConfiguration',
    Type: 'AWS::AutoScaling::AutoScalingGroup',
    Properties: {
      AutoScalingGroupName: cf.stackName,
      Cooldown: 300,
      MinSize: 1,
      DesiredCapacity: 1,
      MaxSize: 1,
      HealthCheckGracePeriod: 300,
      LaunchConfigurationName: cf.ref('TaskingManagerLaunchConfiguration'),
      TargetGroupARNs: [ cf.ref('TaskingManagerTargetGroup') ],
      HealthCheckType: 'EC2',
      AvailabilityZones: cf.getAzs(cf.region)
    },
    UpdatePolicy: {
      AutoScalingRollingUpdate: {
        PauseTime: 'PT60M',
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
          TargetValue: 85,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization'
          }
        },
        Cooldown: 300
      }
  },
  TaskingManagerLaunchConfiguration: {
    Type: 'AWS::AutoScaling::LaunchConfiguration',
    Properties: {
      IamInstanceProfile: cf.ref('TaskingManagerEC2InstanceProfile'),
      ImageId: 'ami-04910d30961dda246',
      InstanceType: 'c5d.large',
      SecurityGroups: [cf.importValue(cf.join('-', ['hotosm-network-production', cf.ref('Environment'), 'ec2s-security-group', cf.region]))],
      UserData: cf.userData([
        '#!/bin/bash',
        'cd tasking-manager/',
        cf.sub('git reset --hard ${GitSha}'),
        'python3.6 -m venv ./venv',
        '. ./venv/bin/activate',
        'pip install --upgrade pip',
        'pip install -r requirements.txt',
        'echo "Exporting environment variables:"',
        cf.sub('export NEW_RELIC_LICENSE=${NewRelicLicense}'),
        cf.join('', ['export POSTGRES_ENDPOINT=', cf.getAtt('TaskingManagerRDS','Endpoint.Address')]),
        cf.sub('export POSTGRES_DB=${PostgresDB}'),
        cf.sub('export POSTGRES_PASSWORD="${PostgresPassword}"'),
        cf.sub('export POSTGRES_USER="${PostgresUser}"'),
        cf.sub('export TM_APP_BASE_URL="${TaskingManagerAppBaseUrl}"'),
        cf.sub('export TM_CONSUMER_KEY="${TaskingManagerConsumerKey}"'),
        cf.sub('export TM_CONSUMER_SECRET="${TaskingManagerConsumerSecret}"'),
        cf.sub('export TM_EMAIL_FROM_ADDRESS="${TaskingManagerEmailFromAddress}"'),
        cf.sub('export TM_LOG_DIR="${TaskingManagerLogDirectory}"'),
        cf.sub('export TM_SECRET="${TaskingManagerSecret}"'),
        cf.sub('export TM_SMTP_HOST="${TaskingManagerSMTPHost}"'),
        cf.sub('export TM_SMTP_PASSWORD="${TaskingManagerSMTPPassword}"'),
        cf.sub('export TM_SMTP_PORT="${TaskingManagerSMTPPort}"'),
        cf.sub('export TM_SMTP_USER="${TaskingManagerSMTPUser}"'),
        cf.if('DatabaseDumpFileGiven', cf.sub('aws s3 cp ${DatabaseDump} dump.sql; psql "postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_ENDPOINT/$POSTGRES_DB" -f dump.sql'), ''),
        './venv/bin/python3.6 manage.py db upgrade',
        'cd client/',
        'npm install',
        'gulp build',
        'cd ../',
        'echo "------------------------------------------------------------"',
        'gunicorn -b 0.0.0.0:8000 --worker-class gevent --workers 3 --threads 3 --timeout 179 manage:application &',
        "export LC_ALL=C",
        "wget https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-latest.tar.gz",
        "pip2 install aws-cfn-bootstrap-latest.tar.gz",
        cf.sub('cfn-signal --exit-code $? --region ${AWS::Region} --resource TaskingManagerASG --stack ${AWS::StackName}')
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
      }],
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
      SecurityGroups: [cf.importValue(cf.join('-', ['hotosm-network-production', cf.ref('Environment'), 'elbs-security-group', cf.region]))],
      Subnets: cf.split(',', cf.ref('ELBSubnets')),
      Type: 'application'
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
      Port: 8000,
      Protocol: 'HTTP',
      VpcId: cf.importValue(cf.join('-', ['hotosm-network-production', 'default-vpc', cf.region])),
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
      Protocol: 'HTTPS'
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
    Properties: {
        Engine: 'postgres',
        DBName: cf.if('UseASnapshot', cf.noValue, cf.ref('PostgresDB')),
        EngineVersion: '9.5.15',
        MasterUsername: cf.if('UseASnapshot', cf.noValue, cf.ref('PostgresUser')),
        MasterUserPassword: cf.if('UseASnapshot', cf.noValue, cf.ref('PostgresPassword')),
        AllocatedStorage: cf.ref('DatabaseSize'),
        StorageType: 'gp2',
        DBInstanceClass: 'db.m3.large', //rethink here
        DBSnapshotIdentifier: cf.if('UseASnapshot', cf.ref('DBSnapshot'), cf.noValue),
        VPCSecurityGroups: [cf.importValue(cf.join('-', ['hotosm-network-production', cf.ref('Environment'), 'ec2s-security-group', cf.region]))],
    }
  }
};

module.exports = { Parameters, Resources, Conditions }
