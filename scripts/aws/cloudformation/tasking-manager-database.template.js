const cf = require('@mapbox/cloudfriend');

const Parameters = {
  CloudformationVPCStackName: {
    Type: 'String',
    Description: 'Name of the VPC Cloudformation stack'
  },
  ProjectName: {
    Type: 'String',
    Description: 'Name of the project'
  },
  DeploymentEnvironment: {
    Type: 'String',
    AllowedValues: ['development', 'demo', 'production'],
    Description: ""
  },
  // DatabaseDump: {
  //   Type: 'String',
  //   Description: 'Path to database dump on S3; Ex: s3://my-bkt/tm.sql'
  // },
  DatabaseName: {
    Type: 'String',
    Description: 'Database Name'
  },
  DatabaseSize: {
    Description: 'Database disk size in GB',
    Type: 'String',
    Default: '100'
  },
};

const Conditions = {
  // DatabaseDumpFileGiven: cf.notEquals(cf.ref('DatabaseDump'), ''),
  IsProduction: cf.equals(cf.ref('DeploymentEnvironment'), 'production'),
};

/*
 * Resources
 *
 * RDS Managed Password
 * RDS Instance
 * RDS Secret attachment
 *
 */
const Resources = {
  DatabaseFirewall: {
    Type: 'AWS::EC2::SecurityGroup',
    Properties: {
      GroupName: cf.join('', ['/', cf.ref('DeploymentEnvironment'), '/tasking-manager/database']),
      VpcId: cf.importValue(cf.join('-', [cf.ref('CloudformationVPCStackName'), 'vpc-id'])),
      GroupDescription: 'Firewall for RDS Database Instance',
      SecurityGroupIngress: [
        {
          Description: 'Allow Backend to access database',
          SourceSecurityGroupId: cf.importValue(cf.join('-', [cf.ref('CloudformationVPCStackName'), 'backend-firewall'])),
          FromPort: 5432,
          ToPort: 5432,
          IpProtocol: 'tcp'
        },
        { // ADD Bastion / Workspace instance security group here
          Description: 'Allow Bastion / Workspace to access database',
          SourceSecurityGroupId: cf.importValue(cf.join('-', [cf.ref('CloudformationVPCStackName'), 'bastion-firewall'])),
          FromPort: 5432,
          ToPort: 5432,
          IpProtocol: 'tcp'
        },
      ],
      Tags: [
        { Key: 'Tool', Value: 'ProjectName' },
        { Key: 'Deployment_Environment', Value: cf.ref('DeploymentEnvironment') },
        { Key: 'Name', Value: cf.join('', [ '/', cf.ref('DeploymentEnvironment'), '/tasking-manager/database' ]) },
      ]
    }
  },
  DatabaseSubnetGroup: {
    Type: 'AWS::RDS::DBSubnetGroup',
    Properties: {
      DBSubnetGroupDescription: "Subnet group for Database",
      DBSubnetGroupName: cf.join('-', [cf.ref('DeploymentEnvironment'), cf.ref('ProjectName')]),
      SubnetIds: cf.split(',', cf.importValue(cf.join('-', [cf.ref('CloudformationVPCStackName'), 'private-subnets']))),
      Tags: [
        { Key: 'Tool', Value: cf.ref('ProjectName') },
        { Key: 'Deployment_Environment', Value: cf.ref('DeploymentEnvironment') }
      ]
    }
  },
  DatabaseInstanceManagedPassword: {
    Type: 'AWS::SecretsManager::Secret',
    Properties: {
      Description: 'Experiment to create a secret via template',
      Name: cf.join('/', [cf.ref('DeploymentEnvironment'), 'taskingmanager-backend/database']),
      GenerateSecretString: {
        PasswordLength: 32,
        ExcludePunctuation: true,
        SecretStringTemplate: '{"username": "taskingmanager", "engine": "postgres", "port": 5432}',
        GenerateStringKey: 'password'
      },
      Tags: [
        { Key: 'Tool', Value: cf.ref('ProjectName') },
        { Key: 'Deployment_Environment', Value: cf.ref('DeploymentEnvironment') },
      ]
    }
  },
  // DatabaseClusterManagedPassword: {
  //   Type: 'AWS::SecretsManager::Secret',
  //   Properties: {
  //     Description: 'Experiment to create a secret via template',
  //     Name: cf.join('/', [cf.ref('DeploymentEnvironment'), 'taskingmanager-backend/database-cluster']),
  //     GenerateSecretString: {
  //       PasswordLength: 32,
  //       ExcludePunctuation: true,
  //       SecretStringTemplate: '{"username": "taskingmanager", "engine": "postgres", "port": 5432}',
  //       GenerateStringKey: 'password'
  //     },
  //     Tags: [
  //       { Key: 'Tool', Value: cf.ref('ProjectName') },
  //       { Key: 'Deployment_Environment', Value: cf.ref('DeploymentEnvironment') },
  //     ]
  //   }
  // },
  // DatabaseCluster: {
  //   Type: 'AWS::RDS::DBCluster',
  //   Properties: {
  //     // AssociatedRoles: [],
  //     BackupRetentionPeriod: 7, // in days
  //     DatabaseName: cf.ref('DatabaseName'),
  //     DBClusterIdentifier: cf.join('-', ['TM4', cf.ref('DeploymentEnvironment'), 'cluster']),
  //     DBSubnetGroupName: cf.ref('DatabaseSubnetGroup'),
  //     DeletionProtection: cf.if('IsProduction', true, false),
  //     EnableCloudwatchLogsExports: ['postgresql'],
  //     // EnableCloudwatchLogsExports: ['postgresql', 'upgrade'], // Doc wrong: upgrade not allowed
  //     EnableHttpEndpoint: false,
  //     Engine: 'aurora-postgresql',
  //     EngineMode: 'provisioned', // or 'serverless'
  //     EngineVersion: '11.9',
  //     MasterUsername: cf.join(':', ['{{resolve:secretsmanager', cf.ref('DatabaseClusterManagedPassword'), 'SecretString:username}}']),
  //     MasterUserPassword: cf.join(':', ['{{resolve:secretsmanager', cf.ref('DatabaseClusterManagedPassword'), 'SecretString:password}}']),
  //     Port: 5432, // Specify explicitly or 3306 is set,
  //     VpcSecurityGroupIds: [cf.ref('DatabaseFirewall')],
  //     Tags: [
  //       { Key: 'Tool', Value: cf.ref('ProjectName') },
  //       { Key: 'Deployment_Environment', Value: cf.ref('DeploymentEnvironment') }
  //     ]
  //   }
  // },
  // DatabaseClusterInstance: {
  //   Type: 'AWS::RDS::DBInstance',
  //   Properties: {
  //     DBInstanceIdentifier: cf.join('-', ['TM4', cf.ref('DeploymentEnvironment'), 'cluster-instance']), // NOTE: This prevents instance from getting replaced; see doc.
  //     DBName: cf.ref('DatabaseName'),
  //     Engine: 'aurora-postgresql',
  //     MasterUsername: cf.join(':', ['{{resolve:secretsmanager', cf.ref('DatabaseInstanceManagedPassword'), 'SecretString:username}}']),
  //     MasterUserPassword: cf.join(':', ['{{resolve:secretsmanager', cf.ref('DatabaseInstanceManagedPassword'), 'SecretString:password}}']),
  //     AllocatedStorage: cf.ref('DatabaseSize'),
  //     DBInstanceClass: cf.if('IsProduction', 'db.t3.xlarge', 'db.t3.small'),
  //     DBSubnetGroupName: cf.ref('DatabaseSubnetGroup'),
  //     MonitoringInterval: cf.if('IsProduction', 60, 0),
  //     PubliclyAccessible: false,
  //     Tags: [
  //       { Key: 'Tool', Value: cf.ref('ProjectName') },
  //       { Key: 'Deployment_Environment', Value: cf.ref('DeploymentEnvironment') }
  //     ]
  //   }
  // },
  DatabaseInstance: {
    Type: 'AWS::RDS::DBInstance',
    Properties: {
      DBInstanceIdentifier: cf.join('-', ['TM4', cf.ref('DeploymentEnvironment')]), // NOTE: This prevents instance from getting replaced; see doc.
      DBName: cf.ref('DatabaseName'),
      Engine: 'postgres',
      EngineVersion: '11.10',
      MasterUsername: cf.join(':', ['{{resolve:secretsmanager', cf.ref('DatabaseInstanceManagedPassword'), 'SecretString:username}}']),
      MasterUserPassword: cf.join(':', ['{{resolve:secretsmanager', cf.ref('DatabaseInstanceManagedPassword'), 'SecretString:password}}']),
      AllocatedStorage: cf.ref('DatabaseSize'),
      BackupRetentionPeriod: 10,
      StorageType: 'gp2',
      EnableCloudwatchLogsExports: ['postgresql'],
      DBInstanceClass: cf.if('IsProduction', 'db.t3.xlarge', 'db.t3.small'),
      DBSubnetGroupName: cf.ref('DatabaseSubnetGroup'),
      VPCSecurityGroups: [cf.ref('DatabaseFirewall')],
      MonitoringInterval: cf.if('IsProduction', 60, 0),
      PubliclyAccessible: false,
      Tags: [
        { Key: 'Tool', Value: cf.ref('ProjectName') },
        { Key: 'Deployment_Environment', Value: cf.ref('DeploymentEnvironment') }
      ]
    }
  },
  SecretRDSInstanceAttachment: {
    Type: 'AWS::SecretsManager::SecretTargetAttachment',
    Properties: {
      SecretId: cf.ref('DatabaseInstanceManagedPassword'),
      TargetId: cf.ref('DatabaseInstance'),
      TargetType: 'AWS::RDS::DBInstance'
    }
  },
  // SecretRDSClusterInstanceAttachment: {
  //   Type: 'AWS::SecretsManager::SecretTargetAttachment',
  //   Properties: {
  //     SecretId: cf.ref('DatabaseClusterManagedPassword'),
  //     TargetId: cf.ref('DatabaseCluster'),
  //     TargetType: 'AWS::RDS::DBCluster'
  //   }
  // },
};

const Outputs = {
  DatabaseManagedPasswordArn: {
    Value: cf.ref('DatabaseInstanceManagedPassword'),
    Description: 'ARN of Secrets Manager entry for DB credentials; used to provide access via IAM roles',
    Export: {
      Name: cf.join('-', ['TaskingManager', cf.ref('DeploymentEnvironment'), 'database-password-arn'])
    }
  },
  DatabaseEndpointAddress: {
    Value: cf.getAtt('DatabaseInstance', 'Endpoint.Address'),
    Description: "Database hostname to connect to",
    Export: {
      Name: cf.join('-', ['TaskingManager', cf.ref('DeploymentEnvironment'), 'database-endpoint-address'])
    }
  }
}

module.exports = { Parameters, Resources, Conditions, Outputs }
