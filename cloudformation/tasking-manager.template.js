const cf = require('@mapbox/cloudfriend');

const Parameters = {
  GitSha: {
    Type: 'String',
    Description: 'GitSha for this stack'
  },
  OAuthToken: {
    Type: 'String',
    Description: 'OAuthToken with permissions to clone hot-qa-tiles'
  },
  IsStaging: {
    Type: 'String',
    Description: 'Is this a staging stack?',
    AllowedValues: ['Yes', 'No']
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
    Description: 'OSM Consumer Key',
    Type: 'String'
  },
  OSMConsumerSecret: {
      Description: 'OSM Consumer Secret',
      Type: 'String'
  },
  TaskingManagerSecret: {
    Description: 'TM_SECRET env variable',
    Type: 'String'
  },
  TaskingManagerEnv: {
    Description: 'TASKING_MANAGER_ENV/TM_ENV environment variable',
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
  ELBsSecurityGroup: {
    Description: 'Security Group for the ELB',
    Type: 'String'
  },
  RDSSecurityGroup: {
    Description: 'Security Group for the RDS',
    Type: 'String'
  }
};

const Conditions = {
  IsStaging: cf.equals(cf.ref('IsStaging'), 'Yes'),
  UseASnapshot: cf.notEquals(cf.ref('DBSnapshot'), '')
};

const Resources = {
  TaskingManagerASG: {
    Type: 'AWS::AutoScaling::AutoScalingGroup',
    Properties: {
      AutoScalingGroupName: cf.stackName,
      Cooldown: 300,
      MinSize: 0,
      DesiredCapacity: 1,
      MaxSize: 1,
      HealthCheckGracePeriod: 300,
      HealthCheckType: 'EC2',
      AvailabilityZones: cf.getAzs(cf.region),
      MixedInstancesPolicy: {
        LaunchTemplate: {
          LaunchTemplateSpecification: {
            LaunchTemplateId: cf.ref('TaskingManagerEC2LaunchTemplate'),
            Version: 1
          },
          Overrides: [{
            InstanceType: 'c3.large'
          }, {
            InstanceType: 'c3.large'
          }]
        },
        InstancesDistribution: {
          OnDemandAllocationStrategy: 'prioritized',
          OnDemandBaseCapacity: 0,
          OnDemandPercentageAboveBaseCapacity: 50,
          SpotAllocationStrategy: 'lowest-price',
          SpotInstancePools: 2
        }
      }
    }
  },
  TaskingManagerEC2LaunchTemplate: {
    Type: 'AWS::EC2::LaunchTemplate',
    Properties: {
      LaunchTemplateName: cf.join('-', [cf.stackName, 'ec2', 'launch', 'template']),
      LaunchTemplateData: {
        UserData: cf.userData([
          'sudo apt-get update &&',
          'sudo apt-get -y upgrade &&',
          'sudo add-apt-repository ppa:jonathonf/python-3.6 &&',
          'sudo apt-get update &&',
          'sudo apt-get -y install python3.6 &&',
          'sudo apt-get -y install python3.6-dev &&',
          'sudo apt-get -y install python3.6-venv &&',
          'sudo apt-get -y install curl &&',
          'curl -sL https://deb.nodesource.com/setup_6.x > install-node6.sh &&',
          'sudo chmod +x install-node6.sh &&',
          'sudo ./install-node6.sh &&',
          'sudo apt-get -y install nodejs &&',
          'sudo npm install gulp -g &&',
          'npm i browser-sync --save &&',
          'sudo apt-get -y install postgresql-9.5 &&',
          'sudo apt-get -y install libpq-dev &&',
          'sudo apt-get -y install postgresql-server-dev-9.5 &&',
          'wget http://postgis.net/stuff/postgis-2.2.4dev.tar.gz &&',
          'tar -xvzf postgis-2.2.4dev.tar.gz &&',
          'sudo apt-get -y install libxml2 &&',
          'sudo apt-get -y install libxml2-dev &&',
          'sudo apt-get -y install libgeos-3.5.0 &&',
          'sudo apt-get -y install libgeos-dev &&',
          'sudo apt-get -y install libproj9 &&',
          'sudo apt-get -y install libproj-dev &&',
          'sudo apt-get -y install libgdal1-dev &&',
          'sudo apt-get -y install libjson-c-dev &&',
          'cd postgis-2.2.4dev &&',
          './configure &&',
          'make &&',
          'sudo make install &&',
          'cd .. &&',
          'sudo apt-get -y install git &&',
          'git clone --recursive https://github.com/hotosm/tasking-manager.git &&',
          'cd tasking-manager/ &&',
          'python3.6 -m venv ./venv &&',
          '. ./venv/bin/activate &&',
          'pip install --upgrade pip &&',
          'pip install -r requirements.txt &&',
          'echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p &&',
          'sudo -u postgres psql -c "CREATE USER hottm WITH PASSWORD 'hottm';" &&',
          'sudo -u postgres createdb -T template0 tasking-manager -E UTF8 -O hottm &&',
          'sudo -u postgres psql -d tasking-manager -c "CREATE EXTENSION postgis;" &&',
          'export TM_DB="postgresql://hottm:hottm@localhost/tasking-manager" &&',
          'export TM_CONSUMER_KEY="VLm4AmuigZODSZQSEEdarv8LhFi4NFodc9JbvvEl" &&',
          'export TM_CONSUMER_SECRET="hkS6CwbTJjpwPeIuVJemj4Y5H2WoXYYpiSUBVlhO" &&',
          'export TM_ENV="Dev" &&',
          'export TM_SECRET="45dfHJJ456dRh378gGFergeqrgtDFGerterRte" &&',
          './venv/bin/python3.6 manage.py db upgrade &&',
          'cd client/ &&',
          'npm install &&',
          'gulp build &&',
          'cd ../ &&',
          'venv/bin/python manage.py runserver -d'
        ]),
        InstanceInitiatedShutdownBehavior: 'terminate',
        IamInstanceProfile: {
          Name: cf.ref('TaskingManagerEC2InstanceProfile')
        },
        KeyName: 'mbtiles',
        ImageId: 'ami-0e4372c1860d7426c'
      }
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
        PolicyName: "S3Policy",
        PolicyDocument: {
          Version: "2012-10-17",
          Statement:[]
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
    Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
    Properties: {
      Name: cf.stackName,
      SecurityGroups:cf.ref('ELBsSecurityGroup')
    }
  },
  TaskingManagerRDS: {
    Type: 'AWS::RDS::DBInstance',
    Properties: {
        Engine: 'postgres',
        EngineVersion: '9.5.4',
        MasterUsername: cf.if('UseASnapshot', cf.noValue, cf.ref('MasterUsername')),
        MasterUserPassword: cf.if('UseASnapshot', cf.noValue, cf.ref('MasterPassword')),
        AllocatedStorage: cf.ref('Storage'),
        StorageType: 'gp2',
        DBInstanceClass: 'db.t2', //rethink here
        DBSnapshotIdentifier: cf.if('UseASnapshot', cf.ref('DBSnapshot'), cf.noValue),
        VPCSecurityGroups: cf.ref('RDSSecurityGroup')
    }
  }
};

module.exports = { Parameters, Resources }
