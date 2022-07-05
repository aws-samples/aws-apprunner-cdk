## Build and Deploy Spring Petclinic Application to AWS App Runner using AWS CDK.

## Overview
Leverage AWS services AWS App Runner, Amazon RDS, Amazon Elastic Container Registry, AWS CodePipeline, AWS CodeCommit, AWS CodeBuild, AWS CodeDeploy and AWS CDK to deploy infrastructure as code and build out a CI/CD pipeline. We will use Spring Boot Petclinic application as a sample app to demonstrate the CI/CD pipeline. Petclinic is an MVC application built using Spring framework and leverages a relational database to persist the data.

## Architecture
![Architecture](assets/architecture.png)

## Repository Structure
- petclinic - Spring Boot application code. This is a clone of the spring petclinic repo. Modification includes addition of the Dockerfile. For more details review the [README](petclinic/readme.md)
- cdk - AWS CDK Project for Building and Deploying Petclinic App. For more details review the [README](cdk/README.md)

## Configure Development Environment
- Follow the steps in the Cloud9 Environment Setup guide - [Create-Cloud9-Environment](CLOUD9-SETUP.md)

## Environment Setup and Local Testing

1. Setup and Install AWS CDK, Typescript:
    ```bash
    npm install -g typescript
    export CDK_DEFAULT_ACCOUNT="AWS ACCOUNT TO DEPLOY"
    export CDK_DEFAULT_REGION="AWS REGION TO DEPLOY"
    ```

2. Bootstrap AWS CDK:
    ```bash
    cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION
    ```

3. Clone the source code repository from aws-samples:
    ```bash
    cd ~/environment
    git clone https://github.com/aws-samples/aws-apprunner-cdk.git
    ```

4. Setup Git User:
    ```
    git config --global user.name "workshop-admin"
    git config --global user.email "workshop-admin@example.com"
    ```

5. Init AWS CDK environment:
    ```
    cd ~/environment/aws-apprunner-cdk/cdk
    npm install @types/node
    ```

6. Package the application using Apache Maven Wrapper
    ```bash
    cd ~/environment/aws-apprunner-cdk/petclinic
    ./mvnw package -Dmaven.test.skip=true
    ```

7. Run Petclinic application locally and run the following inside the Cloud9 terminal:
    ```bash
    ./mvnw spring-boot:run
    ```

8. Validate the launched application and preview the application running locally:
    ![Petclinic Launch](assets/10-petclinic-preview-launch.png)

    This will run the application on port 8080. Click Preview from the top menu and then click “Preview Running Application.” It will open a browser displaying the Spring Petclinic application.

    ![Petclinic Preview](assets/11-petclinic-preview.png)

    Press Ctrl+C to stop the running application.


## Build the infrastructure and pipeline using AWS CDK and validate the application and pipeline.

**Note:** This workshop will create chargeable resources in your account. When finished, please make sure you clean up resources as instructed at the end.

1. Set up DockerHub Credentials in Secrets Manager for Docker Login credentials. Please provide your personal docker credentials. Note this step demonstrates the use of Docker Hub and provides an example on how to leverage the private registries to be included in the pipeline using Secrets Manager. 
    ```bash
    aws secretsmanager create-secret \
        --name dockerhub_credentials \
        --description "DockerHub Credentials" \
        --secret-string "{\"username\":\"dockerhub_username\",\"password\":\"dockerhub_password\"}" \
        --region=$CDK_DEFAULT_REGION
    ```

2. Deploy Step Phase 1: Create Code Commit Repo
    - Setup the Code Commit Repo. 
        ```bash
        cd ~/environment/aws-apprunner-cdk/cdk
        cdk deploy
        ```
    - When asked whether you want to proceed with the actions, enter `yes`.
        ![CDK Deploy](assets/12-c9-cdk-deploy.png)
    - Wait for AWS CDK to complete the deployment before proceeding. It will take few minutes to complete “cdk deploy”. Pipeline will fail since the code is not available in code commit repo.

3. Deploy Step Phase 2: Enable CI/CD Pipeline and deploy infrastructure and application.
    - Commit the code and set the origin to the code commit repo that was created.
        ```bash
        git remote rename origin upstream
        git remote add origin "provide codecommit repo HTTPS URL created in above step"
        git push origin main
        ```
    - Code Commit changes will invoke the Code Pipeline. It will take 15 to 20 minutes to complete the deployment. 
    - Initial deployment will take longer since this includes setting up the infrastructure that includes Networking, RDS and other core components.

4. Validate the Deployment.
    - Once the deploy is complete, you can review the repo in App Runner service using the AWS console. 
    - View the App Runner service using the [AWS App Runner console](https://console.aws.amazon.com/apprunner/)

5. Validate the CI/CD Pipeline.
    - Make a source code change in the petclinic application. Make the change to messages.properties under `petclinic/src/main/resources/messages/messages.properties`. Change the welcome value to `Welcome to CI/CD using AWS CDK`.
    - Commit the change and push the change to the code commit repo.
        ```bash
        git commit -am `updated the title`
        git push origin main
        ```
    - Review that the commit started the code pipeline build. It will take 5 t0 10 minutes to deploy the change.
    - Once the deploy is complete, you can refresh the application home page.

6. Cleaning Up.
    - Delete the AWS CDK stack.
        ```
        cd ~/environment/aws-apprunner-cdk/cdk
        cdk destroy
        ```
    - When asked whether you want to proceed with the actions, enter `yes`. Wait for AWS CDK to complete the destroy.
    - Delete the images in the AWS ECR `petclinic` repo.
    - Delete the AWS CloudFormation `petclinic-*` stacks from the AWS CloudFormation Console.
    - Delete the AWS Cloud9 environment.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

