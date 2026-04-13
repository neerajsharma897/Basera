# AWS Deployment Implementation Guide (EC2 + S3 + IAM Role + CloudWatch)

## 1. Goal
Migrate this project from Cloudinary uploads to AWS S3, deploy on AWS EC2, use IAM Role (no hardcoded AWS keys), and stream logs to CloudWatch.

Target AWS services:
1. EC2 (application hosting)
2. S3 (image storage)
3. IAM Role (secure access to S3 and CloudWatch)
4. CloudWatch (application logs + alarms)

---

## 2. Current Project Status
Cloudinary has been removed from runtime code and replaced with AWS S3-compatible upload handling.

Migration completed in:
1. cloudConfig.js (S3 storage backend)
2. controllers/listing.js (multer-s3 file fields mapping + presigned display URLs)
3. app.js + utils/logger.js (CloudWatch-capable logging)
4. README.md (AWS environment documentation)

Dependencies already updated in package.json:
1. Added: @aws-sdk/client-s3, @aws-sdk/lib-storage, @aws-sdk/s3-request-presigner, multer-s3, winston, winston-cloudwatch
2. Removed: cloudinary, multer-storage-cloudinary

---

## 3. Prerequisites Checklist
Complete this checklist before deployment:
1. AWS account with billing enabled
2. AWS region selected (example: ap-south-1 or us-east-1)
3. MongoDB Atlas connection string ready
4. GitHub repo access from EC2
5. Domain name optional (recommended for HTTPS)

---

## 4. AWS Setup: Step-by-Step (Console Click Path)

## 4.1 Create S3 Bucket for Listing Images

1. Sign in to AWS Console.
2. In top search bar, type S3.
3. Click S3.
4. Click Create bucket.
5. Bucket name: choose globally unique name, example basera-images-prod-2026.
6. Region: choose same region as EC2 instance.
7. Object Ownership:
   - Keep ACLs disabled (recommended default).
8. Block Public Access settings:
  - Keep all blocks enabled.
  - This makes the bucket private so only IAM-authorized requests can access it.
9. Bucket Versioning:
   - Click Enable (recommended).
10. Default encryption:
   - Keep SSE-S3 enabled.
11. Click Create bucket.

### 4.1.1 No Public Bucket Policy
Do not add a public-read bucket policy.
Do not make objects public.

If you need browser display for private images, the app must use presigned URLs or CloudFront.

### 4.1.2 Optional CORS for Browser Direct Uploads
Not required for current server-side upload flow. Skip for now.

---

## 4.2 Create IAM Policy for EC2 App Access

We will grant minimum required permissions to S3 and CloudWatch.
This single IAM policy is enough for the EC2 app to upload, read, and delete S3 objects.

1. In AWS Console search bar, type IAM.
2. Click IAM.
3. Left sidebar: click Policies.
4. Click Create policy.
5. Click JSON tab.
6. Paste this policy (replace REGION, ACCOUNT_ID, BUCKET_NAME, LOG_GROUP_NAME):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ImageAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::BUCKET_NAME",
        "arn:aws:s3:::BUCKET_NAME/*"
      ]
    },
    {
      "Sid": "CloudWatchLogsAccess",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:DescribeLogStreams",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:REGION:ACCOUNT_ID:log-group:LOG_GROUP_NAME*"
      ]
    }
  ]
}
```

7. Click Next.
8. Policy name: BaseraEc2S3CloudWatchPolicy.
9. Click Create policy.

---

## 4.3 Create IAM Role for EC2

1. In IAM sidebar, click Roles.
2. Click Create role.
3. Trusted entity type: AWS service.
4. Use case: EC2.
5. Click Next.
6. Search and select policy BaseraEc2S3CloudWatchPolicy.
7. Click Next.
8. Role name: BaseraEc2AppRole.
9. Click Create role.

---

## 4.4 Launch EC2 and Attach IAM Role

1. In AWS Console search EC2.
2. Click EC2.
3. Click Launch instance.
4. Name: basera-prod-instance.
5. AMI: Ubuntu Server 22.04 LTS.
6. Instance type: t3.small (or t2.micro for low traffic test).
7. Key pair: create/select key pair.
8. Network settings:
   - Allow SSH (22) from your IP only.
   - Allow HTTP (80) from anywhere.
   - Allow HTTPS (443) from anywhere.
9. Advanced details:
   - IAM instance profile: BaseraEc2AppRole.
10. Click Launch instance.

If already launched without role:
1. EC2 -> Instances -> select instance.
2. Actions -> Security -> Modify IAM role.
3. Choose BaseraEc2AppRole.
4. Click Update IAM role.

---

## 4.5 Create CloudWatch Log Group

1. Search CloudWatch in AWS Console.
2. Click CloudWatch.
3. Left sidebar: Logs -> Log groups.
4. Click Create log group.
5. Name: /basera/app
6. Retention setting: 14 days or 30 days.
7. Click Create.

---

## 5. Code Implementation Plan (What Will Be Changed)

## 5.1 Replace Cloudinary with S3 Upload Storage

Files to update:
1. cloudConfig.js
2. routes/listing.js
3. controllers/listing.js

Implementation details:
1. cloudConfig.js
   - Remove cloudinary and multer-storage-cloudinary usage.
   - Configure S3Client from @aws-sdk/client-s3.
   - Configure multer-s3 storage with bucket, content type auto, and object key naming.

2. routes/listing.js
   - Keep multer upload middleware pattern same.
   - Use S3-backed storage from cloudConfig.js.

3. controllers/listing.js
   - Current code uses req.file.path and req.file.filename.
   - With multer-s3 use:
     - req.file.location as URL
     - req.file.key as filename/object key
   - Save listing.image = { url: req.file.location, filename: req.file.key }.

## 5.2 Add CloudWatch Logging

Files to add/update:
1. Add utils/logger.js
2. Update app.js

Implementation details:
1. Create winston logger with:
   - Console transport
   - CloudWatch transport (winston-cloudwatch)
2. Log startup events and errors.
3. Replace console.log in critical paths with logger.info/logger.error.

## 5.3 Update Environment Variables

Add to environment (EC2 and local dev if testing AWS path):
1. ATLASDB_URL
2. SECRET
3. AWS_REGION
4. S3_BUCKET_NAME
5. AWS_CLOUDWATCH_LOG_GROUP
6. PORT (optional, default 8080)
7. NODE_ENV=production for EC2

Important:
- Do not set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY on EC2 when using IAM Role.
- If the bucket stays private, the app must use presigned URLs or CloudFront to render images in the browser.

---

## 6. EC2 Deployment Steps (Command by Command)

## 6.1 Connect to EC2
From your local machine terminal:

```bash
ssh -i /path/to/your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

## 6.2 Install Node.js, Git, Nginx

```bash
sudo apt update
sudo apt install -y git nginx
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install --lts
node -v
npm -v
```

## 6.3 Clone and Install App

```bash
git clone <YOUR_REPO_URL> basera
cd basera
npm install
```

## 6.4 Create Production Environment File

```bash
nano .env
```

Paste values:

```env
NODE_ENV=production
PORT=8080
ATLASDB_URL=your_mongodb_atlas_connection
SECRET=your_session_secret
AWS_REGION=your_region
S3_BUCKET_NAME=your_bucket_name
AWS_CLOUDWATCH_LOG_GROUP=/basera/app
```

Save and exit.

## 6.5 Run App with PM2

```bash
sudo npm install -g pm2
pm2 start app.js --name basera-app
pm2 save
pm2 startup systemd
```

Run the printed command from pm2 startup output.

## 6.6 Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/basera
```

Paste:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/basera /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Open app in browser:
- http://<EC2_PUBLIC_IP>

---

## 7. Verification Checklist

## 7.1 S3 Verification
1. Create new listing with image upload.
2. Check bucket -> Objects -> confirm image appears.
3. Open saved image URL in browser.

## 7.2 App Verification
1. Listing create/update/delete works.
2. Login/signup works.
3. Reviews still work.

## 7.3 CloudWatch Verification
1. Open CloudWatch -> Log groups -> /basera/app.
2. Confirm new log stream and app log events.
3. Trigger one controlled error and verify it appears.

---

## 8. Troubleshooting Guide

## 8.1 S3 AccessDenied on Upload
Symptoms:
- Upload fails with AccessDenied.

Checks:
1. IAM role attached to EC2 instance.
2. Policy includes s3:PutObject for arn:aws:s3:::BUCKET_NAME/*.
3. Bucket name in env matches actual bucket.
4. Region in env matches bucket region.

Fix:
1. Update IAM policy.
2. Reattach role if needed.
3. Restart app: pm2 restart basera-app.

## 8.2 Credential Errors (No credentials found)
Symptoms:
- SDK error: could not load credentials.

Checks:
1. EC2 has IAM instance profile attached.
2. App running on EC2 and not local machine unexpectedly.

Fix:
1. Attach BaseraEc2AppRole.
2. Restart app.

## 8.3 SignatureDoesNotMatch
Symptoms:
- Upload fails with signature mismatch.

Checks:
1. AWS_REGION equals bucket region.
2. System time on EC2 is correct.

Fix:
1. Correct AWS_REGION in env.
2. Restart app.

## 8.4 CloudWatch Logs Not Appearing
Symptoms:
- App runs, but no log stream in CloudWatch.

Checks:
1. AWS_CLOUDWATCH_LOG_GROUP value correct.
2. IAM policy has logs:CreateLogStream and logs:PutLogEvents.
3. Region match between app and log group.

Fix:
1. Correct env values.
2. Expand IAM logs permissions.
3. Restart app.

## 8.5 Nginx 502 Bad Gateway
Symptoms:
- Browser shows 502.

Checks:
1. pm2 status (is app online).
2. App listening on 8080.
3. Nginx config proxy_pass target is 127.0.0.1:8080.

Fix:
1. pm2 restart basera-app.
2. Check app logs: pm2 logs basera-app.
3. Retest nginx config: sudo nginx -t and restart nginx.

## 8.6 File Upload Works Locally But Fails on EC2
Possible causes:
1. Missing env on EC2.
2. IAM role missing permissions.
3. Different Node version.

Fix:
1. Validate .env on EC2.
2. Validate role policy.
3. Use Node LTS and reinstall dependencies.

---

## 9. Security Recommendations
1. Prefer private bucket + signed URLs for production.
2. Restrict SSH source to your IP only.
3. Use HTTPS (ALB + ACM recommended) instead of plain HTTP.
4. Set log retention and avoid logging secrets.
5. Use least-privilege IAM policy.

---

## 10. Rollback Plan
If migration causes blocking issues:
1. Keep pre-migration branch as backup.
2. Revert to Cloudinary code branch.
3. Deploy previous PM2 release.
4. Preserve DB data as image schema remains compatible (url + filename).

---

## 11. Execution Order for This Project
Follow this exact order:
1. Create S3 bucket.
2. Create IAM policy.
3. Create IAM role and attach to EC2.
4. Create CloudWatch log group.
5. Apply code changes (Cloudinary -> S3, add logger, add presigned URLs).
6. Install/update dependencies locally.
7. Deploy app to EC2 with env vars.
8. Verify upload, listing flows, presigned image display, and logs.
9. Add CloudWatch alarms.

---

## 12. Optional CloudWatch Alarms (Recommended)
1. CloudWatch -> Alarms -> Create alarm.
2. Select metric -> EC2 -> Per-Instance Metrics -> CPUUtilization.
3. Condition: static threshold > 80 for 5 minutes.
4. Add notification via SNS topic (email).
5. Name alarm and create.

Create additional alarms for:
1. StatusCheckFailed
2. Disk utilization (requires CloudWatch agent)
3. Memory utilization (requires CloudWatch agent)

---

## 13. Notes for Manual AWS Console Work
1. Keep one browser tab for EC2, one for IAM, one for S3, one for CloudWatch.
2. After every IAM change, wait 30-60 seconds for permission propagation.
3. Keep all resources in same region to avoid common failures.
4. Document final values used:
   - Bucket name
   - Region
   - IAM role name
   - Log group name
   - EC2 instance ID

This record will speed up debugging later.
