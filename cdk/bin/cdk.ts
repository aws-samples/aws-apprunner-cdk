#!/usr/bin/env node
import "source-map-support/register";
import { App, Aspects } from 'aws-cdk-lib';
import * as cdk from "aws-cdk-lib";
import { CdkPipelineStack } from "../lib/cdk-pipeline-stack";
import { AwsSolutionsChecks } from 'cdk-nag';
import { NagSuppressions } from 'cdk-nag';

const app = new cdk.App();
const stack = new CdkPipelineStack(app, "CdkPipelineStack", {
  stackName: "petclinic",
  description: "Petclinic Application",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
Aspects.of(app).add(new AwsSolutionsChecks());
NagSuppressions.addStackSuppressions(stack, [
  { id: 'AwsSolutions-S1', reason: 'CDK construct does not provide a way to enable logging for S3 Bucket managed by Code Pipeline: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines.CodePipeline.html' },
  { id: 'AwsSolutions-IAM5', reason: '1/Default policies for code pipeline and these are resourced to s3 bucket, account and CDK limits to customize the default policies: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines.CodePipeline.html, 2/ecr:GetAuthorizationToken does not allow to scope to resource' },
  { id: 'AwsSolutions-KMS5', reason: 'CDK construct does not provide a way to enable KMS rotation: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines.CodePipeline.html' },  
]);