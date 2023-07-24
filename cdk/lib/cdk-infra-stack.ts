import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as apprunner from "aws-cdk-lib/aws-apprunner";
import { Stack, StackProps, Duration } from "aws-cdk-lib";
import * as secrets from "aws-cdk-lib/aws-secretsmanager";

export interface CdkInfraStackProps extends StackProps{
  readonly appName?:string;
}

export class CdkInfraStack extends Stack {
  private readonly appName:string;
  constructor(scope: Construct, id: string, props?: CdkInfraStackProps) {
    super(scope, id, props);
    if(props && props.appName){
      this.appName = props.appName;
    }else{
      const appNameCtx = this.node.tryGetContext("app-name");
      //Generates Random ID in case context doesn't have app-name
      this.appName =  appNameCtx ? appNameCtx : "infra-app-name" + (Math.random() + 1).toString(36).substring(7);
    }

    /************************************************************************/
    /****************************** VPC  ************************************/
    /************************************************************************/
    const vpc = new ec2.Vpc(this, `${this.stackName}-vpc`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/26'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 28,
          name: "private",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    /************************************************************************/
    /***************************** MYSQLDB SG *******************************/
    /************************************************************************/
    const dbServerSG = new ec2.SecurityGroup(this, `${this.stackName}-rds-sg`, {
      vpc,
      allowAllOutbound: true,
      description: "Ingress for MySQL Server",
    });
    dbServerSG.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(3306)
    );

    /************************************************************************/
    /****************************** MYSQL DB ********************************/
    /************************************************************************/
    const mysql = new rds.DatabaseInstance(
      this,
      `${this.stackName}-mysql-rds`,
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_5_7,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.SMALL
        ),
        credentials: rds.Credentials.fromGeneratedSecret(this.appName, {
          secretName: `rds/dev/${this.appName}/mysql`,
        }),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        autoMinorVersionUpgrade: false,
        allowMajorVersionUpgrade: false,
        securityGroups: [dbServerSG],
        multiAz: true,
        backupRetention: Duration.days(5),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        storageEncrypted: true,
      }
    );

    /************************************************************************/
    /************************ APPRUNNER Role and Service ********************/
    /************************************************************************/
    const appRunnerRole = new iam.Role(
      this,
      `${this.stackName}-apprunner-role`,
      {
        assumedBy: new iam.ServicePrincipal("build.apprunner.amazonaws.com"),
        description: `${this.stackName}-apprunner-role`,
        inlinePolicies: {
          "petclinic-apprunner-policy": new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["ecr:GetAuthorizationToken"],
                resources: ["*"],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  "ecr:BatchCheckLayerAvailability",
                  "ecr:GetDownloadUrlForLayer",
                  "ecr:GetRepositoryPolicy",
                  "ecr:DescribeRepositories",
                  "ecr:ListImages",
                  "ecr:DescribeImages",
                  "ecr:BatchGetImage",
                  "ecr:GetLifecyclePolicy",
                  "ecr:GetLifecyclePolicyPreview",
                  "ecr:ListTagsForResource",
                  "ecr:DescribeImageScanFindings",
                ],
                resources: [
                  "arn:aws:ecr:" +
                    this.region +
                    ":" +
                    this.account +
                    ":repository/petclinic",
                ],
              }),
            ],
          }),
        },
      }
    );

    /************************************************************************/
    /************************ APPRUNNER VPCConnector ************************/
    /************************************************************************/
    const vpcConnector = new apprunner.CfnVpcConnector(this, "vpcConnector", {
      subnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      }).subnetIds,
      securityGroups: [dbServerSG.securityGroupId]
    });

    /************************************************************************/
    /************************ APPRUNNER Service *****************************/
    /************************************************************************/
    const appRunnerService = new apprunner.CfnService(
      this,
      `${this.stackName}-apprunner-service`,
      {
        serviceName: this.appName,
        sourceConfiguration: {
          authenticationConfiguration: {
            accessRoleArn: appRunnerRole.roleArn,
          },
          autoDeploymentsEnabled: true,
          imageRepository: {
            imageIdentifier: `${this.account}.dkr.ecr.${this.region}.amazonaws.com/${this.appName}:latest`,
            imageRepositoryType: "ECR",
            imageConfiguration: {
              port: "80",
              runtimeEnvironmentVariables: [
                {
                  name: "MYSQL_USER",
                  value: this.appName,
                },
                {
                  name: "MYSQL_PASS",
                  value: mysql.secret
                    ? mysql.secret.secretValueFromJson("password").toString()
                    : "password",
                },
                {
                  name: "MYSQL_URL",
                  value: `jdbc:mysql://${mysql.instanceEndpoint.hostname}/${this.appName}?createDatabaseIfNotExist=true`,
                },
              ],
            },
          },
        },
        instanceConfiguration: {
          cpu: "2048",
          memory: "4096",
        },
        healthCheckConfiguration: {
          path: "/actuator/health",
        },
        networkConfiguration: {
          egressConfiguration: {
            egressType: "VPC",
            vpcConnectorArn: vpcConnector.attrVpcConnectorArn,
          },
        },
      }
    );

    /************************************************************************/
    /************************** APPRUNNER Service URL ***********************/
    /************************************************************************/
    new cdk.CfnOutput(this, "serviceUrl", {
      value: appRunnerService.attrServiceUrl,
      exportName: "serviceUrl",
    });
  }
}
