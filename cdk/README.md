# CDK Project for Building and Deploying Petclinic App

The `cdk.json` file tells the CDK Toolkit how to execute your app. Context variable for `app-name` is configured in this file.

### Prerequisites
Setup typescript and Install CDK:
```bash
npm install -g typescript
npm install -g aws-cdk
```

## Project Structure

|Class Type | Files  |
|--------------------------|---|
|Main Class | bin/cdk.ts |
|Pipeline Main Class | lib/cdk-pipeline-stack.ts |
|Pipeline Stages | lib/cdk-pipeline-ecr-stage.ts, lib/cdk-pipeline-infra-stage.ts |
|Stack Classes | lib/cdk-ecr-stack.ts, lib/cdk-infra-stack.ts |
|App Class | lib/cdk-app.ts |

## Useful commands

 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template


 ## CDK Limitations
 - Limited CDK support for AppRunner. Leveraging L1 Construct.
 - Limited CDK support for using exported variables.
 - Limited CDK support for exchanging dynamic variables in the context.
 - Limited CDK support for levearging externalized `buildspec.yaml`.
 - Limited CDK support for building and deploying image using assets.
