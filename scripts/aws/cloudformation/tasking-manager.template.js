const cf = require('@mapbox/cloudfriend');

const Parameters = {
  CloudformationVPCStackName: {
    Type: 'String',
    Description: 'Name of VPC Cloudformation Stack'
  },
  ApplicationPort: {
    Description: 'Port on which the application listens',
    Type: 'Number',
    Default: 5000,
  },
  DeploymentEnvironment: {
    Type: 'String',
    AllowedValues: ['development', 'demo', 'production'],
    Description: "development: min 1, max 1 instance; demo: min 1 max 3 instances; production: min 2 max 9 instances"
  },
  SSLCertificateIdentifier: {
    Type: 'String',
    Description: 'SSL certificate for HTTPS protocol',
    Default: 'ex: certificate/bb59df0a-ff8d-416c-bfb2-cc3a2e97c8ec'
  },
  TaskingManagerConsumerKey: {
    Description: 'TM_CONSUMER_KEY',
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
  TaskingManagerImageUploadAPIURL: {
    Description: 'URL for image upload service',
    Type: 'String'
  },
  TaskingManagerSMTPHost: {
    Description: 'TM_SMTP_HOST environment variable',
    Type: 'String'
  },
  TaskingManagerSMTPUser: {
    Description: 'TM_SMTP_USER environment variable',
    Type: 'String'
  },
  TaskingManagerSMTPPort: {
    Description: 'TM_SMTP_PORT environment variable',
    Type: 'String',
    Default: '587'
  },
  TaskingManagerDefaultChangesetComment: { // TODO: What happened to this variable?
    Description: 'TM_DEFAULT_CHANGESET_COMMENT environment variable',
    Type: 'String',
    Default: '#hotosm-project'
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
  },
  SMTPPassword: {
    Description: "Secrets Manager entry for SMTP Password",
    Type: "String"
  },
  OAuth2ConsumerSecret: {
    Description: "Secrets Manager entry for OAuth2 Consumer Secret",
    Type: "String"
  },
  NewRelicLicenseKey: {
    Description: "Secrets Manager entry for NewRelic License Key",
    Type: "String"
  },
  ImageUploadAPIKey: {
    Description: "Secrets Manager entry for Image Upload API Key",
    Type: "String"
  },
  TaskingManagerManagedSecret: {
    Description: "Secrets Manager entry for Tasking Manager Secret",
    Type: "String"
  },
};

const Conditions = {
  IsTaskingManagerProduction: cf.equals(cf.ref('DeploymentEnvironment'), 'production'),
  IsTaskingManagerDemo: cf.equals(cf.ref('DeploymentEnvironment'), 'demo'),
  IsHOTOSMUrl: cf.equals(
    cf.select('1', cf.split('.', cf.ref('TaskingManagerURL')))
    , 'hotosm')
};

/*
 * Resources
 *
 * ECS Cluster, ECS Definition, ECS Service
 * Secrets Policy :- Secrets Manager Secrets
 * ECSTaskRole :-
 * ECSTaskExecutionRole
 * TaskingManagerASG, TaskingManagerASGPolicy
 * TaskingManager Load Balancer
 * Load Balancer Route 53
 * Target Group
 * ALB HTTPS Listener, ALB HTTP Listener
 * RDS Managed Password
 * RDS Instance
 * RDS Secret attachment
 * React Bucket S3
 * React Bucket Policy
 * React CloudFront
 * Route 53
 *
 */
const Resources = {
  ECSCluster: {
    Type: 'AWS::ECS::Cluster',
    Properties: {
      CapacityProviders: [
        'FARGATE',
        'FARGATE_SPOT'
      ],
      ClusterName: cf.stackName, // TODO: Change this
      ClusterSettings: [{
        Name: 'containerInsights',
        Value: 'enabled'
      }],
      Tags: [
        {
          Key: 'Name',
          Value: cf.stackName
        },
        {
          Key: 'Project',
          Value: 'TaskingManager'
        }
      ]
    }
  },
  ECSTaskDefinition: { // cf.ref returns ARN with version
    Type: 'AWS::ECS::TaskDefinition',
    Properties: {
      RequiresCompatibilities: ['FARGATE'],
      ContainerDefinitions: [{
        Name: 'Backend_Service',
        // Command: ['/bin/sh', '-c', 'echo $POSTGRES_ENDPOINT'],
        Environment: [
          { Name: 'POSTGRES_ENDPOINT', Value: cf.importValue(cf.join('-', ['TaskingManager', cf.ref('DeploymentEnvironment'), 'database-endpoint-address'] )) },
          { Name: 'TM_APP_BASE_URL', Value: cf.ref('TaskingManagerAppBaseUrl') },
          { Name: 'TM_CONSUMER_KEY', Value: cf.ref('TaskingManagerConsumerKey') },
          { Name: 'TM_SMTP_HOST', Value: cf.ref('TaskingManagerSMTPHost') },
          { Name: 'TM_SMTP_PORT', Value: cf.ref('TaskingManagerSMTPPort') },
          { Name: 'TM_SMTP_USER', Value: cf.ref('TaskingManagerSMTPUser') },
          { Name: 'TM_EMAIL_FROM_ADDRESS', Value: cf.ref('TaskingManagerEmailFromAddress') },
          { Name: 'TM_EMAIL_CONTACT_ADDRESS', Value: cf.ref('TaskingManagerEmailContactAddress') },
          { Name: 'TM_ORG_NAME', Value: cf.ref('TaskingManagerOrgName') },
          { Name: 'TM_ORG_CODE', Value: cf.ref('TaskingManagerOrgCode') },
          { Name: 'TM_ORG_LOGO', Value: cf.ref('TaskingManagerLogo') },
          { Name: 'TM_IMAGE_UPLOAD_API_URL', Value: cf.ref('TaskingManagerImageUploadAPIURL') },
          { Name: 'TM_SENTRY_BACKEND_DSN', Value: cf.ref('SentryBackendDSN') },
          { Name: 'TM_DEFAULT_CHANGESET_COMMENT', Value: cf.ref('TaskingManagerDefaultChangesetComment') },
          {
            Name: 'POSTGRES_DB',
            Value: cf.join(':', [
              '{{resolve:secretsmanager',
              cf.importValue(cf.join('-', ['TaskingManager', cf.ref('DeploymentEnvironment'), 'database-password-arn'])),
              'SecretString:dbname}}'])
          },
          {
            Name: 'POSTGRES_USER',
            Value: cf.join(':', [
              '{{resolve:secretsmanager',
              cf.importValue(cf.join('-', ['TaskingManager', cf.ref('DeploymentEnvironment'), 'database-password-arn'])),
              'SecretString:username}}'])
          },
        ],
        Secrets: [
          { 
            Name: 'POSTGRES_PASSWORD',
            ValueFrom: cf.importValue(cf.join('-', ['TaskingManager', cf.ref('DeploymentEnvironment'), 'database-password-arn']))
          },
          { 
            Name: 'TM_SMTP_PASSWORD',
            ValueFrom: cf.join(':', ['arn:aws:secretsmanager', cf.region, cf.accountId, 'secret', cf.ref('SMTPPassword') ] )
          },
          { 
            Name: 'TM_SECRET',
            ValueFrom: cf.join(':', ['arn:aws:secretsmanager', cf.region, cf.accountId, 'secret', cf.ref('TaskingManagerManagedSecret') ] )
          },
          { 
            Name: 'TM_CONSUMER_SECRET',
            ValueFrom: cf.join(':', ['arn:aws:secretsmanager', cf.region, cf.accountId, 'secret', cf.ref('OAuth2ConsumerSecret') ] )
          },
          { 
            Name: 'NEW_RELIC_LICENSE_KEY',
            ValueFrom: cf.join(':', ['arn:aws:secretsmanager', cf.region, cf.accountId, 'secret', cf.ref('NewRelicLicenseKey') ] )
          },
          { 
            Name: 'TM_IMAGE_UPLOAD_API_KEY',
            ValueFrom: cf.join(':', ['arn:aws:secretsmanager', cf.region, cf.accountId, 'secret', cf.ref('ImageUploadAPIKey') ] )
          }
        ],
        Essential: true,
        //HealthCheck: {
        //  Command: ['/bin/sh', '-c', "echo $POSTGRES_ENDPOINT || exit 1"],
        //  Interval: 10,
        //  Retries: 3
        //},
        Image: 'quay.io/hotosm/tasking-manager:feature_containerize-backend-cfn', //configure this properly
        // Image: cf.join('', [cf.accountId, '.dkr.ecr.', cf.region, '.amazonaws.com/taskingmanager:latest']),
        // RepositoryCredentials: {
        //   CredentialsParameter: 'arn:aws:secretsmanager:us-east-1:670261699094:secret:prod/tasking-manager/quay-image-pull-access-WdfayD'
        // },
        PortMappings: [
          {
            ContainerPort: cf.ref('ApplicationPort'),
            HostPort: cf.ref('ApplicationPort'),
            Protocol: 'tcp'
          },
        ],
        LogConfiguration: {
          LogDriver: 'awslogs',
          Options: { // TODO: Figure out expiry
            'awslogs-create-group': true,
            'awslogs-region': cf.region,
            'awslogs-group': cf.join('', ['/', cf.ref('DeploymentEnvironment'), '/', 'tasking-manager/backend']),
            'awslogs-stream-prefix': 'tasking-manager'
          }
        },
      }],
      Cpu: '1024', 
      ExecutionRoleArn: cf.getAtt('ECSTaskExecutionRole', 'Arn'),
      Family: 'Tasking_Manager',
      Memory: '4096',
      NetworkMode: 'awsvpc',
      RequiresCompatibilities: ['FARGATE'],
      Tags: [
        { Key: 'Tool', Value: 'TaskingManager' },
        { Key: 'Name', Value: cf.stackName },
        { Key: 'Deployment_Environment', Value: cf.ref('DeploymentEnvironment') }
      ],
      TaskRoleArn: cf.getAtt('ECSTaskRole', 'Arn'), // s3 bucket access, secrets manager 
    }
  },
  ECSService: {
    Type: 'AWS::ECS::Service',
    DependsOn: ['LoadBalancerHTTPSListener', 'LoadBalancerHTTPListener'],
    Properties: {
      Cluster: cf.ref('ECSCluster'),
      DeploymentConfiguration: {
      //  DeploymentCircuitBreaker: {
      //    Enable: true,
      //    Rollback: true,
      //  },
        MaximumPercent: 200,
        MinimumHealthyPercent: 50
      },
      DeploymentController: {
        'Type': 'ECS'
      },
      DesiredCount: cf.if('IsTaskingManagerProduction', 3, 2),
      EnableECSManagedTags: true,
      HealthCheckGracePeriodSeconds: 300,
      LaunchType: 'FARGATE',
      LoadBalancers: [{
        ContainerName: 'Backend_Service',
        ContainerPort: cf.ref('ApplicationPort'),
        TargetGroupArn: cf.ref('ELBTargetGroup')
      }],
      NetworkConfiguration: {
        AwsvpcConfiguration: {
          AssignPublicIp: 'DISABLED', // ENABLED or DISABLED
          SecurityGroups: [ 
            cf.importValue(cf.join('-', [cf.ref('CloudformationVPCStackName'), 'backend-firewall'])),
            cf.importValue(cf.join('-', [cf.ref('CloudformationVPCStackName'), 'load-balancer-firewall']))
          ],
          Subnets: cf.split(',', cf.importValue(cf.join('-', [cf.ref('CloudformationVPCStackName'), 'private-subnets'])))
        }
      },
      PlatformVersion: '1.4.0',
      PropagateTags: 'SERVICE',
      SchedulingStrategy: 'REPLICA',
      ServiceName: cf.stackName,
      Tags: [
        { Key: 'Tool', Value: 'TaskingManager' }, 
        { Key: 'Name', Value: cf.stackName },
        { Key: 'Deployment_Environment', Value: cf.ref('DeploymentEnvironment') }
      ],
      TaskDefinition: cf.ref('ECSTaskDefinition') // !!! WILL NOT STABILIZE UNLESS version is specified
    }
  },
  ECSTaskRole: {  //  grants processes in the containers permission to call AWS APIs - s3
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: {
             Service: [ "ecs-tasks.amazonaws.com" ]
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
      Tags: [
        { Key: 'Tool', Value: 'TaskingManager' },
        { Key: 'Deployment_Environment', Value: cf.ref('DeploymentEnvironment') }
      ],
      RoleName: 'task-role',
      Path: cf.join('', ['/', cf.ref('DeploymentEnvironment'), '/tasking-manager/'])
    }
  }, 
  ECSTaskExecutionRole: { // Grants access to AWS services for the ECS agent 
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: {
             Service: [ "ecs-tasks.amazonaws.com" ]
          },
          Action: [ "sts:AssumeRole" ]
        }]
      },
      ManagedPolicyArns: [
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
      ],
      Policies: [
        {
          PolicyName: 'AutoCreateLogGroup',
          PolicyDocument: {
           Version: "2012-10-17",
           Statement: [
             {
               Effect: "Allow",
               Action: [
                 "logs:CreateLogStream",
                 "logs:DescribeLogStreams",
                 "logs:CreateLogGroup",
                 "logs:PutLogEvents"
               ],
               Resource: "*"
             }
           ]
          }
        },
        {
          PolicyName: 'SecretsPolicy',
          PolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: "secretsmanager:GetSecretValue",
                Resource: [
                  cf.importValue(cf.join('-', ['TaskingManager', cf.ref('DeploymentEnvironment'), 'database-password-arn'])),
                  cf.join(':', ['arn:aws:secretsmanager', cf.region, cf.accountId, 'secret', cf.ref('SMTPPassword')]),
                  cf.join(':', ['arn:aws:secretsmanager', cf.region, cf.accountId, 'secret', cf.ref('OAuth2ConsumerSecret')]),
                  cf.join(':', ['arn:aws:secretsmanager', cf.region, cf.accountId, 'secret', cf.ref('NewRelicLicenseKey')]),
                  cf.join(':', ['arn:aws:secretsmanager', cf.region, cf.accountId, 'secret', cf.ref('ImageUploadAPIKey')]),
                  cf.join(':', ['arn:aws:secretsmanager', cf.region, cf.accountId, 'secret', cf.ref('TaskingManagerManagedSecret')]),
                ]
              },
              {
                Effect: "Allow",
                Action: "secretsmanager:ListSecrets",
                Resource: "*"
              }
            ]
          }
        }    
      ],
      Tags: [
        { Key: 'Tool', Value: 'TaskingManager' },
        { Key: 'Deployment_Environment', Value: cf.ref('DeploymentEnvironment') }
      ],
      RoleName: 'task-execution-role',
      Path: cf.join('', ['/', cf.ref('DeploymentEnvironment'), '/tasking-manager/'])
    }
      // grants the Amazon ECS container agent permission to make AWS API calls - cloudwatch logs, secrets
  }, 
  TaskingManagerASG: {
    Type: 'AWS::ApplicationAutoScaling::ScalableTarget',
    Properties: {
      MinCapacity: cf.if('IsTaskingManagerProduction', 3, 1),
      MaxCapacity: cf.if('IsTaskingManagerProduction', 9, cf.if('IsTaskingManagerDemo', 3, 1)),
      ResourceId: cf.join('/', ['service', cf.ref('ECSCluster'), cf.getAtt('ECSService', 'Name')]),
      RoleARN: cf.join('', ['arn:aws:iam::', cf.accountId, ':role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService']),
      ScalableDimension: 'ecs:service:DesiredCount',
      ServiceNamespace: 'ecs'
    }
  },
  TaskingManagerASGPolicy: {
    Type: 'AWS::ApplicationAutoScaling::ScalingPolicy',
    Properties: {
      PolicyName: cf.stackName,
      PolicyType: 'TargetTrackingScaling',
      ScalingTargetId: cf.ref('TaskingManagerASG'),
      TargetTrackingScalingPolicyConfiguration: {
        DisableScaleIn: false,
        PredefinedMetricSpecification: {
          PredefinedMetricType: 'ALBRequestCountPerTarget',
          ResourceLabel: cf.join('/', [
            cf.getAtt('LoadBalancer', 'LoadBalancerFullName'),
            cf.getAtt('ELBTargetGroup', 'TargetGroupFullName')
            ])
        },
        ScaleInCooldown: 300,
        ScaleOutCooldown: 300,
        TargetValue: 1000
      }
    }
  },
  LoadBalancer: {
    Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
    Properties: {
      Name: cf.stackName,
      SecurityGroups: [
        cf.importValue(cf.join('-', [cf.ref('CloudformationVPCStackName'), 'load-balancer-firewall']))
      ],
      Subnets: cf.split(',', cf.importValue(cf.join('-', [cf.ref('CloudformationVPCStackName'), 'public-subnets']))), // The load balancer sits on this public subnet
      Type: 'application',
      Tags: [
        { Key: 'Tool', Value: 'TaskingManager' },
        { Key: 'Deployment_Environment', Value: cf.ref('DeploymentEnvironment') }
      ]
    }
  },
  LoadBalancerRoute53: {
    Type: 'AWS::Route53::RecordSet',
    Properties: {
      Name: cf.join('-', [cf.stackName, 'api.hotosm.org']),
      Type: 'A',
      AliasTarget: {
        DNSName: cf.getAtt('LoadBalancer', 'DNSName'),
        HostedZoneId: cf.getAtt('LoadBalancer', 'CanonicalHostedZoneID')
      },
      HostedZoneId: 'Z2O929GW6VWG99',
    }
  },
  ELBTargetGroup: {
    Type: 'AWS::ElasticLoadBalancingV2::TargetGroup',
    Properties: {
      Name: cf.join('-', ['tm4', cf.ref('DeploymentEnvironment') ]),
      HealthCheckIntervalSeconds: 60,
      HealthCheckPort: cf.ref('ApplicationPort'),
      HealthCheckProtocol: 'HTTP',
      HealthCheckTimeoutSeconds: 10,
      HealthyThresholdCount: 3,
      UnhealthyThresholdCount: 3,
      HealthCheckPath: '/api/v2/system/heartbeat/',
      Port: cf.ref('ApplicationPort'),
      Protocol: 'HTTP',
      TargetType: 'ip', //what else might this change?
      VpcId: cf.importValue(cf.join('-', [cf.ref('CloudformationVPCStackName'), 'vpc-id'])),
      Tags: [ 
        { Key: 'stack_name', Value: cf.stackName }, 
        { Key: 'Tool', Value: 'TaskingManager' },
        { Key: 'Deployment_Environment', Value: cf.ref('DeploymentEnvironment') },
      ],
      Matcher: {
        HttpCode: '200,202,302,304'
      }
    }
  },
  LoadBalancerHTTPSListener: {
    Type: 'AWS::ElasticLoadBalancingV2::Listener',
    Properties: {
      Certificates: [ {
        CertificateArn: cf.arn('acm', cf.ref('SSLCertificateIdentifier'))
      }],
      DefaultActions: [{
        Type: 'forward',
        TargetGroupArn: cf.ref('ELBTargetGroup')
      }],
      LoadBalancerArn: cf.ref('LoadBalancer'),
      Port: 443,
      Protocol: 'HTTPS',
      SslPolicy: 'ELBSecurityPolicy-FS-1-2-Res-2020-10'
    }
  },
  LoadBalancerHTTPListener: {
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
      LoadBalancerArn: cf.ref('LoadBalancer'),
      Port: 80,
      Protocol: 'HTTP'
    }
  },
  FrontEndS3Bucket: {
    Type: 'AWS::S3::Bucket',
    Properties: {
      BucketName: cf.join('-', ['tasking-manager', cf.ref('DeploymentEnvironment'), 'frontend-app']),
      // BucketName: cf.join('-', [cf.stackName, 'react-app']), // TODO: Remove
      AccessControl: "PublicRead",
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        BlockPublicPolicy: false,
        IgnorePublicAcls: false,
        RestrictPublicBuckets: false
      },
      WebsiteConfiguration: {
        ErrorDocument: 'index.html',
        IndexDocument: 'index.html'
      },
      Tags: [
        { Key: 'Tool', Value: 'TaskingManager' },
        { Key: 'Deployment_Environment', Value: cf.ref('DeploymentEnvironment') }
      ]
    }
  },
  FrontEndS3BucketPolicy: {
    Type: 'AWS::S3::BucketPolicy',
    Properties: {
      Bucket : cf.ref('FrontEndS3Bucket'),
      PolicyDocument: {
        Version: "2012-10-17",
        Statement:[{
          Action: [ 's3:GetObject'],
          Effect: 'Allow',
          Principal: '*',
          Resource: [ cf.join('',
            [
              cf.getAtt('FrontEndS3Bucket', 'Arn'), 
              '/*'
            ]
          )],
          Sid: 'AddPerm'
        }]
      }
    }
  },
  FrontEndCDN: {
    Type: "AWS::CloudFront::Distribution",
    Properties: {
      DistributionConfig: {
        DefaultRootObject: 'index.html',
        Aliases: [
          cf.ref('TaskingManagerURL')
        ],
        Enabled: true,
        Origins: [{
          Id: cf.join('-', [cf.stackName, 'react-app']),
          DomainName: cf.getAtt('FrontEndS3Bucket', 'DomainName'),
          CustomOriginConfig: {
            OriginProtocolPolicy: 'https-only',
            OriginSSLProtocols: [ 'TLSv1.2' ]
          }
        }],
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
          MinimumProtocolVersion: 'TLSv1.2_2019',
          SslSupportMethod: 'sni-only'
        },
        HttpVersion: 'http2'
      },
      Tags: [
        { Key: 'Tool', Value: 'TaskingManager' },
        { Key: 'Deployment_Environment', Value: cf.ref('DeploymentEnvironment') }
      ]
    }
  },
  DNSRecord: {
    Type: 'AWS::Route53::RecordSet',
    Condition: 'IsHOTOSMUrl',
    Properties: {
      Name: cf.ref('TaskingManagerURL'),
      Type: 'A',
      AliasTarget: {
        DNSName: cf.getAtt('FrontEndCDN', 'DomainName'),
        HostedZoneId: 'Z2FDTNDATAQYW2'
      },
      HostedZoneId: 'Z2O929GW6VWG99',
    }
  }
};

const Outputs = {
  CloudfrontDistributionID: {
    Description: "Distribution ID for Cloudfront",
    Value: cf.ref('FrontEndCDN'),
    Export: {
      // Name: cf.join('-', ['tasking-manager', cf.stackName, 'cloudfront-id']) // TODO: Remove
      Name: cf.join('-', ['tasking-manager', cf.ref('DeploymentEnvironment'), 'cloudfront-id'])
    },
  },
  TaskingManagerECSClusterName: {
    Description: "Name of the Tasking Manager ECS Cluster",
    Value: cf.stackName,
    Export: {
      Name: cf.join('-', ['TaskingManager', cf.ref('DeploymentEnvironment'), 'ecs-cluster'])
    }
  },
  TaskingManagerECSServiceName: {
    Description: "Name of the Tasking Manager ECS Service",
    Value: cf.stackName,
    Export: {
      Name: cf.join('-', ['TaskingManager', cf.ref('DeploymentEnvironment'), 'ecs-service'])
    }
  },
}

module.exports = { Parameters, Resources, Conditions, Outputs }
