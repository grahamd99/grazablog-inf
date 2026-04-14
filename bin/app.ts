import * as cdk from "aws-cdk-lib";
import "dotenv/config";
import { WebsiteStack } from "../lib/website-stack";

const app = new cdk.App();

/**
 * Global tags – applied to *everything* in this CDK app
 */
// Read from .env
const tagUser = process.env.CDK_TAG_USER ?? "UNKNOWN";
const bucketName = `${props.tagUser}-PrivateS3CloudFrontWebsiteStack`.toLowerCase();

// Apply tag
cdk.Tags.of(app).add("user", tagUser);

new WebsiteStack(app, "PrivateS3CloudFrontWebsiteStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
