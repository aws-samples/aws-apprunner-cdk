import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { TagStatus } from "aws-cdk-lib/aws-ecr";
import { Duration, Stack, StackProps } from "aws-cdk-lib";

export interface CdkECRStackProps extends StackProps{
  readonly appName?:string
}

export class CdkECRStack extends Stack {
  private appName:string
  constructor(scope: Construct, id: string, props?: CdkECRStackProps) {
    super(scope, id, props);
    if(props && props.appName){
      this.appName = props.appName
    }else{
      const appNameCtx = this.node.tryGetContext("app-name");
      //Generates Random ID in case context doesn't have app-name
      this.appName = appNameCtx ? appNameCtx : "ecr-app-name" + (Math.random() + 1).toString(36).substring(7);;
    }


    /************************************************************************/
    /************************* Create ECR Repo ******************************/
    /************************************************************************/
    const repository = new ecr.Repository(this, `${this.stackName}-build`, {
      repositoryName: this.appName,
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /************************************************************************/
    /************************* Add Lifecycle Rules **************************/
    /************************************************************************/
    repository.addLifecycleRule({
      tagStatus: TagStatus.ANY,
      maxImageCount: 10
    });
    repository.addLifecycleRule({
      tagStatus: TagStatus.UNTAGGED,
      maxImageAge: Duration.days(1),
    });
  }
}
