import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as CdkPipeline from "../lib/cdk-pipeline-stack";

test("CDK Pipeline Stack", () => {
    const stackName = 'petclinic'
    const app = new cdk.App();

    // WHEN
    const stack = new CdkPipeline.CdkPipelineStack(app, stackName);

    // THEN
    const template = Template.fromStack(stack);

    // Assert Code Commit Repo
    template.resourceCountIs("AWS::CodeCommit::Repository", 1);
    template.hasResourceProperties("AWS::CodeCommit::Repository", {
        RepositoryName: stackName,
    });

    // Assert Code Pipeline
    template.resourceCountIs("AWS::CodePipeline::Pipeline", 1);
    template.hasResourceProperties("AWS::CodePipeline::Pipeline", {
        Name: `${stackName}-pipeline`,
    });

    // Assert Code Build Project
    template.resourceCountIs("AWS::CodeBuild::Project", 2);
    template.hasResourceProperties("AWS::CodeBuild::Project", {
        "Environment": {
            "ComputeType": "BUILD_GENERAL1_MEDIUM",
            "PrivilegedMode": false,
            "Type": "LINUX_CONTAINER"
        },
    });

});
