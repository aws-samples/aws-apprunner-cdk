import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { pipelines } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from "aws-cdk-lib/pipelines";
import { CdkApp } from "./cdk-app";
import { CdkPipelineECRStage } from "./cdk-pipeline-ecr-stage";
import { CdkPipelineInfraStage } from "./cdk-pipeline-infra-stage";

export class CdkPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /************************************************************************/
    /************************* Code Commit Repo *****************************/
    /************************************************************************/
    const repo = new codecommit.Repository(this, `${this.stackName}-repo`, {
      repositoryName: this.stackName,
    });

    /************************************************************************/
    /************************* Code Pipeline  *******************************/
    /************************************************************************/
    const pipeline = new CodePipeline(this, `${this.stackName}-pipeline`, {
      pipelineName: `${this.stackName}-pipeline`,
      selfMutation: false,
      crossAccountKeys: true,
      synth: new CodeBuildStep(`${this.stackName}-synth`, {
        projectName: `${this.stackName}-synth`,
        input: CodePipelineSource.codeCommit(repo, "main"),
        installCommands: ["npm install -g aws-cdk"],
        commands: ["cd cdk", "npm ci", "npm run build", "npx cdk synth"],
        primaryOutputDirectory: "cdk/cdk.out",
        buildEnvironment: {
          computeType: codebuild.ComputeType.MEDIUM,
        },
      }),
    });

    /************************************************************************/
    /************************* Code Build Role  *****************************/
    /************************************************************************/
    const buildRole = new iam.Role(this, `${this.stackName}-build-role`, {
      assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
      description: `${this.stackName}-build-role`,
      inlinePolicies: {
        "petclinic-code-build-policy": new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "secretsmanager:GetSecretValue"
              ],
              resources: [
                `arn:${this.partition}:secretsmanager:${this.region}:${this.account}:secret:dockerhub_credentials`
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "ecr:GetAuthorizationToken",
              ],
              resources: ["*"]
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
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage"
              ],
              resources: [
                `arn:${this.partition}:ecr:${this.region}:${this.account}:repository/petclinic`
              ],
            }),
          ]
        })
      }
    });

    /************************************************************************/
    /************************* Code Build Stage  ****************************/
    /************************************************************************/
    const app = new CdkApp(this);
    const build = new CdkPipelineECRStage(this, `${this.stackName}-build`);
    pipeline.addStage(build, {
      post: [
        new pipelines.CodeBuildStep(`${this.stackName}-build`, {
          projectName: `${this.stackName}-build`,
          partialBuildSpec: codebuild.BuildSpec.fromObject(app.getBuildSpec()),
          commands: ["echo building app"],
          buildEnvironment: {
            buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
            computeType: codebuild.ComputeType.MEDIUM,
            privileged: true,
            environmentVariables: app.getBuildEnvironment(),
          },
          role: buildRole,
        }),
      ],
    });

    /************************************************************************/
    /************************* Code Deploy Stage  ***************************/
    /************************************************************************/
    const deploy = new CdkPipelineInfraStage(this, `${this.stackName}-deploy`);
    pipeline.addStage(deploy);
  }
}
