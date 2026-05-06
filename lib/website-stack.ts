import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as iam from "aws-cdk-lib/aws-iam";

interface WebsiteStackProps extends cdk.StackProps {
  bucketName: string;
  stackName: string;
  cfRole: string;
}

export class WebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebsiteStackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: props.bucketName,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true
    });

    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');
    bucket.grantRead(oai);

    const cfFunction = new cloudfront.Function(this, 'ViewerRequestFunction', {
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith('/')) {
    request.uri += 'index.html';
  } else if (!uri.includes('.')) {
    request.uri += '/index.html';
  }

  return request;
}
      `),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessIdentity(bucket, {
  originAccessIdentity: oai,
}),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [{
          function: cfFunction,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        }],
      }
    });

    // Create IAM Role for CloudFront invalidation
    const cfRoleResource = new iam.Role(this, 'CloudFrontRole', {
      roleName: props.cfRole,
      assumedBy: new iam.AccountPrincipal(this.account),
    });

    // Attach AmazonS3FullAccess managed policy
    cfRoleResource.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));

    // Create inline policy for CloudFront CreateInvalidation
    const cfInvalidationPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          sid: 'VisualEditor0',
          effect: iam.Effect.ALLOW,
          actions: ['cloudfront:CreateInvalidation'],
          resources: [`arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`],
        }),
      ],
    });

    // Attach the inline policy to the role
    cfRoleResource.attachInlinePolicy(new iam.Policy(this, 'CloudFrontInvalidationPolicy', {
      document: cfInvalidationPolicy,
    }));

    new s3deploy.BucketDeployment(this, 'DeploySite', {
      sources: [s3deploy.Source.asset('./site')],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*']
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: 'https://' + distribution.domainName
    });
  }
}
