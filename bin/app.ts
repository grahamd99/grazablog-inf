import * as cdk from "aws-cdk-lib";
import "dotenv/config";
import { WebsiteStack } from "../lib/website-stack";

const app = new cdk.App();

/**
 * Global tags – applied to *everything* in this CDK app
 */
// Read from .env
const tagUser = process.env.CDK_TAG_USER ?? "UNKNOWN";
const bucketName = process.env.BUCKET_NAME;
const stackName = process.env.STACK_NAME;
const cfRole = process.env.CF_ROLE;
if (!bucketName) {
  throw new Error('BUCKET_NAME must be set in .env');
}
if (!stackName) {
  throw new Error('STACK_NAME must be set in .env');
}
if (!cfRole) {
  throw new Error('CF_ROLE must be set in .env');
}

// Apply tag
cdk.Tags.of(app).add("User", tagUser);

new WebsiteStack(app, "PrivateS3CloudFrontWebsiteStack", {
  stackName,
  bucketName,
  cfRole,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
