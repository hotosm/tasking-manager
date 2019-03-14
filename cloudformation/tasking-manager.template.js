const cf = require('@mapbox/cloudfriend');

const Parameters = {
  GitSha: {
    Type: 'String'
  },
  DBSnapshot: {
    Type: 'String',
    Description: 'Specify an RDS snapshot ID, if you want to create the DB from a snapshot.',
    Default: ''
  },
  MasterUsername: {
    Description: 'RDS Username',
    Type: 'String'
  },
  MasterPassword: {
    Description: 'RDS Password',
    Type: 'String'
  },
  OSMConsumerKey: {
    Description: 'TM_CONSUMER_KEY',
    Type: 'String'
  },
  OSMConsumerSecret: {
      Description: 'TM_CONSUMER_SECRET',
      Type: 'String'
  },
  TaskingManagerSecret: {
    Description: 'TM_SECRET',
    Type: 'String'
  },
  TaskingManagerEnv: {
    Description: 'TASKING_MANAGER_ENV/TM_ENV',
    Type: 'String',
    Default: 'Demo'
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
  Storage: {
    Description: 'Storage in GB',
    Type: 'String',
    Default: '100'
  },
  ELBSecurityGroup: {
    Description: 'Security Group for the ELB',
    Type: 'String'
  },
  ELBSubnets: {
    Description: 'ELB subnets',
    Type: 'String'
  },
  RDSSecurityGroup: {
    Description: 'Security Group for the RDS',
    Type: 'String'
  },
  RDSUrl: {
    Description: 'Remote RDS URL',
    Type: 'String'
  }
};

const Conditions = {
  UseASnapshot: cf.notEquals(cf.ref('DBSnapshot'), '')
};

const Resources = {
  TaskingManagerASG: {
    DependsOn: 'TaskingManagerLaunchConfiguration',
    Type: 'AWS::AutoScaling::AutoScalingGroup',
    Properties: {
      AutoScalingGroupName: cf.stackName,
      Cooldown: 300,
      MinSize: 0,
      DesiredCapacity: 1,
      MaxSize: 1,
      HealthCheckGracePeriod: 300,
      LaunchConfigurationName: cf.ref('TaskingManagerLaunchConfiguration'),
      LoadBalancerNames: [ cf.ref('TaskingManagerLoadBalancer') ],
      HealthCheckType: 'EC2',
      AvailabilityZones: cf.getAzs(cf.region)
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
        ImageId: 'ami-0565af6e282977273',
        InstanceType: 't2.large',
        SecurityGroups: [cf.ref('RDSSecurityGroup')],
        UserData: cf.userData([
          'set -x',
          'export DEBIAN_FRONTEND=noninteractive',
          'export LC_ALL="en_US.UTF-8"',
          'export LC_CTYPE="en_US.UTF-8"',
          'dpkg-reconfigure --frontend=noninteractive locales',
          cf.sub('sudo apt-get update && sudo apt-get -y upgrade && sudo add-apt-repository ppa:jonathonf/python-3.6 && sudo apt-get update && sudo apt-get -y install python3.6 && sudo apt-get -y install python3.6-dev && sudo apt-get -y install python3.6-venv && sudo apt-get -y install curl && curl -sL https://deb.nodesource.com/setup_6.x > install-node6.sh && sudo chmod +x install-node6.sh && sudo ./install-node6.sh && sudo apt-get -y install nodejs && sudo npm install gulp -g && npm i browser-sync --save && sudo apt-get -y install postgresql-9.5 && sudo apt-get -y install libpq-dev && sudo apt-get -y install postgresql-server-dev-9.5 && sudo apt-get -y install libxml2 && sudo apt-get -y install libxml2-dev && sudo apt-get -y install libgeos-3.5.0 && sudo apt-get -y install libgeos-dev && sudo apt-get -y install libproj9 && sudo apt-get -y install libproj-dev && sudo apt-get -y install libgdal1-dev && sudo apt-get -y install libjson-c-dev && sudo apt-get -y install git && git clone --recursive https://github.com/hotosm/tasking-manager.git && cd tasking-manager/ && git reset --hard ${GitSha} && python3.6 -m venv ./venv && . ./venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt'),
          'echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf',
          cf.join('', [cf.sub('export TM_DB="postgresql://${MasterUsername}:${MasterPassword}@'), cf.if('UseASnapshot', cf.getAtt('TaskingManagerRDS', 'Endpoint.Address'), cf.ref('RDSUrl')) , '/tm3"']),
          cf.sub('export TM_CONSUMER_KEY=${OSMConsumerKey} && export TM_CONSUMER_SECRET=${OSMConsumerSecret} && export TM_ENV=${TaskingManagerEnv} && export TM_SECRET=${TaskingManagerSecret} && ./venv/bin/python3.6 manage.py db upgrade && cd client/ && npm install && gulp build && cd ../ && echo "done"'),
          'gunicorn -b 0.0.0.0:8000 --worker-class gevent --workers 3 --threads 2 --timeout 179 manage:application'
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
      }],
      RoleName: cf.join('-', [cf.stackName, 'ec2', 'role'])
    }
  },
  TaskingManagerEC2InstanceProfile: {
     Type: "AWS::IAM::InstanceProfile",
     Properties: {
        Roles: [cf.ref('TaskingManagerEC2Role')],
        InstanceProfileName: cf.join('-', [cf.stackName, 'ec2', 'instance', 'profile'])
     }
  },
  TaskingManagerLoadBalancer: {
    Type: 'AWS::ElasticLoadBalancing::LoadBalancer',
    Properties: {
      CrossZone: true,
      Listeners: [{
        InstancePort: 8000,
        InstanceProtocol: 'HTTP',
        LoadBalancerPort: 80,
        Protocol: 'HTTP',
        PolicyNames: [ cf.sub('${AWS::StackName}-stickiness') ]
      }],
      LBCookieStickinessPolicy: [{
        PolicyName: cf.sub('${AWS::StackName}-stickiness')
      }],
      LoadBalancerName: cf.stackName,
      Scheme: 'internet-facing',
      SecurityGroups: [cf.ref('ELBSecurityGroup')],
      Subnets: cf.split(',', cf.ref('ELBSubnets'))
   }
 },
  TaskingManagerRDS: {
    Type: 'AWS::RDS::DBInstance',
    Condition: 'UseASnapshot',
    Properties: {
        Engine: 'postgres',
        EngineVersion: '9.5.10',
        MasterUsername: cf.if('UseASnapshot', cf.noValue, cf.ref('MasterUsername')),
        MasterUserPassword: cf.if('UseASnapshot', cf.noValue, cf.ref('MasterPassword')),
        AllocatedStorage: cf.ref('Storage'),
        StorageType: 'gp2',
        DBInstanceClass: 'db.m3.large', //rethink here
        DBSnapshotIdentifier: cf.if('UseASnapshot', cf.ref('DBSnapshot'), cf.noValue),
        VPCSecurityGroups: [cf.ref('RDSSecurityGroup')]
    }
  }
};

module.exports = { Parameters, Resources, Conditions }
