import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as CdkInfraStage from "../lib/cdk-infra-stack";

test("CDK Infra Stage", () => {
    const stackName = 'infra-stage'
    const app = new cdk.App();

    // WHEN
    const stack = new CdkInfraStage.CdkInfraStack(app, stackName);

    // THEN
    const template = Template.fromStack(stack);

    // Assert VPC and Subnets
    template.resourceCountIs("AWS::EC2::VPC", 1);
    template.hasResourceProperties("AWS::EC2::VPC", {
        CidrBlock: "10.0.0.0/26",
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
    });
    template.resourceCountIs("AWS::EC2::Subnet", 2);
    template.hasResourceProperties("AWS::EC2::Subnet", {
        CidrBlock: "10.0.0.0/28",
        MapPublicIpOnLaunch: false,
    });

    // Assert DBInstance and Properties
    template.resourceCountIs("AWS::RDS::DBInstance", 1);
    template.hasResourceProperties("AWS::RDS::DBInstance", {
        DBInstanceClass: "db.t3.small",
        AllocatedStorage: "100",
        AllowMajorVersionUpgrade: false,
        AutoMinorVersionUpgrade: false,
        BackupRetentionPeriod: 5,
        Engine: "mysql",
        EngineVersion: "5.7",
        MultiAZ: true,
        PubliclyAccessible: false,
        StorageEncrypted: true,
        StorageType: "gp2",
    });

    // Assert DB Security Group
    template.resourceCountIs("AWS::EC2::SecurityGroup", 1);
    template.hasResourceProperties("AWS::EC2::SecurityGroup", {
        SecurityGroupEgress: [{
            CidrIp: "0.0.0.0/0",
        }],
        SecurityGroupIngress: [{
            FromPort: 3306,
            IpProtocol: "tcp",
            ToPort: 3306
        }]
    });

    // Assert AppRunner Service and VpcConnector
    template.resourceCountIs("AWS::AppRunner::Service", 1);
    template.hasResourceProperties("AWS::AppRunner::Service", {
        HealthCheckConfiguration: {
            Path: "/actuator/health"
        }
    });
    template.resourceCountIs("AWS::AppRunner::VpcConnector", 1);

});
