# AWS CDK – Private S3 Bucket + CloudFront Website

This repository deploys a **private Amazon S3 bucket** fronted by **Amazon CloudFront**, using **AWS CDK (TypeScript)**.

It is intended for hosting static website content securely, with:
- no public access to S3
- CloudFront as the only public entry point
- S3 object **versioning enabled**, retaining all historical versions

---

## Prerequisites

You must have the following installed and configured:

- **Node.js** (LTS recommended)
- **AWS CLI** (authenticated against the target account)
- **AWS CDK v2**

Verify installations:

```bash
node --version
aws --version
npx cdk --version
```

If required, configure AWS credentials:

```bash
aws configure
```

---

## Initial Setup (once per clone)

From the repository root:

```bash
npm install
```

Create your local environment configuration file:

```bash
cp .env.example .env
```

Edit `.env` if required (e.g. to specify a bucket name).
The `.env` file is ignored by Git and not committed.

---

## CDK Bootstrap (once per AWS account + region)

AWS CDK requires a one‑time bootstrap per account and region:

```bash
npx cdk bootstrap
```

This creates the CDK toolkit resources (deployment roles, asset bucket, etc).

You only need to do this **once** per account/region.

---

## Deploy the Infrastructure

This command will:

- Create a **private, versioned S3 bucket**
- Create a **CloudFront distribution** in front of it
- Upload the contents of the `./site` folder to S3 using `BucketDeployment`
- Invalidate CloudFront so changes are visible immediately

Run:

```bash
npx cdk deploy
```

You will be shown a change summary and asked to confirm. Type `y` to proceed.

---

## Deployment Outputs

After a successful deployment, CDK will output values including:

- **BucketName** – the S3 bucket name
- **CloudFrontDomainName** – the CloudFront distribution domain
- **CloudFrontURL** – the public HTTPS URL for the website

Example:

```
https://d123example456.cloudfront.net
```

Use this URL to access the site.

---

## Updating Website Content

1. Edit files in the `./site` directory (e.g. `site/index.html`)
2. Re-run the deploy command:

```bash
npx cdk deploy
```

This will:
- Upload updated content
- Create new S3 object versions
- Invalidate CloudFront (`/*`)

---

## Verifying Object Version History (Optional)

To confirm that S3 object history is being retained:

```bash
aws s3api list-object-versions   --bucket <BucketName>   --prefix index.html
```

No lifecycle rules are defined, so **non‑current versions are retained indefinitely**.

---

## Removing All Resources (Destroy)

⚠️ **Warning**: This removes CloudFront and CDK-managed infrastructure.

Run:

```bash
npx cdk destroy
```

Confirm when prompted.

### S3 bucket behaviour on destroy

This depends on your `.env` configuration:

- `REMOVAL_POLICY=RETAIN`  
  → The S3 bucket and its data are preserved

- `REMOVAL_POLICY=DESTROY` and `AUTO_DELETE_OBJECTS=true`  
  → The bucket and all objects (all versions) are deleted

- `REMOVAL_POLICY=DESTROY` and `AUTO_DELETE_OBJECTS=false`  
  → Destroy will **fail** if the bucket is not empty

**Recommended default:** `REMOVAL_POLICY=RETAIN`

---

## Summary of Key Commands

```bash
npm install
cp .env.example .env
npx cdk bootstrap
npx cdk deploy
npx cdk destroy
```

---

End of README.
