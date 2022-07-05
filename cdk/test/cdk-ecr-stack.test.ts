import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as CdkECRStage from "../lib/cdk-ecr-stack";

test("CDK ECR Stage", () => {
    const stackName = 'ecr-app-stage'
    const app = new cdk.App();

    // WHEN
    const stack = new CdkECRStage.CdkECRStack(app, stackName);

    // THEN
    const template = Template.fromStack(stack);

    // ASSERT
    template.resourceCountIs("AWS::ECR::Repository", 1);
    template.hasResourceProperties("AWS::ECR::Repository", {
        ImageScanningConfiguration: {
            "ScanOnPush": true
        },
        LifecyclePolicy: {
            "LifecyclePolicyText": "{\"rules\":[{\"rulePriority\":1,\"selection\":{\"tagStatus\":\"untagged\",\"countType\":\"sinceImagePushed\",\"countNumber\":1,\"countUnit\":\"days\"},\"action\":{\"type\":\"expire\"}},{\"rulePriority\":2,\"selection\":{\"tagStatus\":\"any\",\"countType\":\"imageCountMoreThan\",\"countNumber\":10},\"action\":{\"type\":\"expire\"}}]}"
        }
    });

});
