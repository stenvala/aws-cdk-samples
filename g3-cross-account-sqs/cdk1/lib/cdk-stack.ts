import * as apigw from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import * as iam from "@aws-cdk/aws-iam";
import * as fs from "fs";

const PREFIX = "Lambda2LambdaSQS-API-";

// Get url of second lambda
function getQueueUrl() {
  try {
    const data = fs.readFileSync("../cdk2/stack-data.json", "utf8");
    return JSON.parse(data)["Lambda2LambdaSQS-SQSLambda-Stack"]["queueUrl"];
  } catch (error) {
    return "NOT_AVAILABLE";
  }
}

function getRoleArn() {
  try {
    const data = fs.readFileSync("../cdk2/stack-data.json", "utf8");
    return JSON.parse(data)["Lambda2LambdaSQS-SQSLambda-Stack"]["roleArn"];
  } catch (error) {
    return "NOT_AVAILABLE";
  }
}

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, PREFIX + id, props);

    const roleArn = getRoleArn();

    const fun = new lambda.Function(this, PREFIX + "Lambda", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset("../dist1"),
      handler: "app.lambdaHandler",
      environment: {
        QUEUE_URL: getQueueUrl(),
        ROLE_ARN: roleArn,
      },
    });

    const gw = new apigw.LambdaRestApi(this, PREFIX + "ApiGw", {
      handler: fun,
      proxy: true,
    });

    const policyStatement = new iam.PolicyStatement({
      resources: [roleArn],
      effect: iam.Effect.ALLOW,
      actions: ["sts:AssumeRole"],
    });

    fun.addToRolePolicy(policyStatement);

    // Save these outputs
    new cdk.CfnOutput(this, "url", { value: gw.url });
  }
}
