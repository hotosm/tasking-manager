const cloudfriend = require('@mapbox/cloudfriend');
const Parameters = {
  GitSha: {
    Type: 'String',
    Description: 'GitSha for this stack'
  },
  OAuthToken: {
    Type: 'String',
    Description: 'OAuthToken with permissions to clone hot-qa-tiles'
  }
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
            InstanceType: 't2.large'
          }, {
            InstanceType: 't3.large'
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
          '#!/bin/bash',
          'while [ ! -e /dev/xvdc ]; do echo waiting for /dev/xvdc to attach; sleep 10; done',
          'while [ ! -e /dev/xvdb ]; do echo waiting for /dev/xvdb to attach; sleep 10; done',
          'sudo mkfs -t ext3 /dev/xvdb',
          'sudo mount /dev/xvdb /tmp',
          'sudo yum update -y && yum upgrade -y && yum install -y libgeos-dev',
          'curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash',
          'export NVM_DIR="$HOME/.nvm"',
          '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"',
          '[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"',
          'nvm install v9',
          'npm install gulp -g',
          'mkdir -p /usr/local/app && chmod 775 /usr/local/app/ && cd /usr/local/app',
          'git clone https://github.com/hotosm/tasking-manager.git && cd tasking-manager.git',
          '',
        )
        ]),
        InstanceInitiatedShutdownBehavior: 'terminate',
        IamInstanceProfile: {
          Name: cf.ref('TaskingManagerEC2InstanceProfile')
        },
        KeyName: 'mbtiles',
        ImageId: 'ami-f6ed648c'
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
  }
};
