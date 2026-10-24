# AWS Cloud Setup Guide & Credential Configuration

This guide provides step-by-step instructions on where and how to configure your AWS credentials so that DevOpsible communicates directly with your AWS cloud resources (AWS ECS Fargate, ECR, EKS, and Jenkins Controllers).

---

## 1. Where to Put Your AWS Credentials

There are three primary places to configure credentials depending on your environment:

### Option A: Supabase Production Secrets (Recommended for Cloud Deployments)
When deploying your Supabase Edge Functions (`/functions/sandbox`):
```bash
supabase secrets set AWS_ACCESS_KEY_ID="AKIAxxxxxxxxxxxxxxxx" \
                     AWS_SECRET_ACCESS_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
                     AWS_REGION="us-east-1"
```
*(If you are using temporary session credentials from AWS Academy, AWS Learner Labs, or AWS STS, also set `AWS_SESSION_TOKEN`)*:
```bash
supabase secrets set AWS_SESSION_TOKEN="IQoJb3JpZ2luX2VjE..."
```

---

### Option B: Local Supabase Edge Function Environment (`supabase/functions/.env`)
When testing the backend Edge Functions locally with `supabase functions serve`:
1. Create or edit `supabase/functions/.env`
2. Add your AWS credentials and Jenkins host:
```env
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
# AWS_SESSION_TOKEN=optional_temporary_session_token

# Optional custom Jenkins controller (ECS or remote IP):
JENKINS_URL=http://localhost:8080
```

---

### Option C: Root Environment (`.env` or `.env.local`)
In the root directory of your project:
1. Open `.env`
2. Add or update:
```env
VITE_SANDBOX_MODE=remote
AWS_REGION=us-east-1
```
*(Security Note: Client-side browser code should never embed secret access keys directly into client bundles. The Supabase Edge Function `sandbox` acts as the secure intermediary with AWS SigV4 signed requests).*

---

## 2. Required AWS IAM Permissions

To enable all Git, Jenkins, Docker, and Kubernetes workflows, your IAM User or Role should have the following policies:

1. **AmazonECS_FullAccess** — For managing disposable AWS ECS Fargate tasks and Jenkins controller containers.
2. **AmazonEC2ContainerRegistryPowerUser** — For building, pushing, and pulling images with AWS ECR (`nexa-web`).
3. **AmazonEKSClusterPolicy** & **AmazonEKSServicePolicy** — For querying and interacting with Amazon EKS cluster control planes.
4. **CloudWatchLogsReadOnlyAccess** — For streaming container and Jenkins build logs back to the DevOpsible terminal.

---

## 3. Running Genuine Jenkins Locally with Docker Compose

If you are running Jenkins locally, DevOpsible includes a pre-configured `docker-compose.jenkins.yml`:

```bash
# 1. Spin up the genuine Jenkins LTS container
docker compose -f docker-compose.jenkins.yml up -d

# 2. Check health status
docker compose -f docker-compose.jenkins.yml ps
```

The genuine Jenkins instance will be accessible at:
- **URL**: `http://localhost:8080`
- **Default User**: `student`
- **Default Password**: `devopsible`

DevOpsible's UI will automatically detect the running instance at `http://localhost:8080`, allowing you to run pipelines, inspect jobs, and validate mission objectives.

---

## 4. How the Cloud Sandbox Workflow Operates

```
[ DevOpsible UI ]
       │
       ▼ (invokes supabase function 'sandbox')
[ Supabase Edge Function: /functions/sandbox ]
       │
       ├── Reads AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY
       │
       ├── JENKINS WORKFLOW ───► AWS ECS Fargate / EC2 or Local Docker
       │                         - Genuine Jenkins LTS controller
       │                         - REST API inspection (/api/json, /job/<name>)
       │                         - Live build logs & stage tracking
       │
       ├── DOCKER WORKFLOW ────► AWS ECS Fargate & AWS ECR
       │                         - Spins up isolated task containers
       │                         - Validates exposed ports (e.g. 8080)
       │                         - Captures live stdout/stderr
       │
       └── KUBERNETES WORKFLOW ─► Amazon EKS Cluster
                                 - Communicates via AWS SigV4
                                 - Reconciles Deployments, Pods, Services
                                 - Verifies cluster state against lab objectives
```

If AWS credentials are not yet configured or you are offline, DevOpsible gracefully runs in **High-Fidelity Local Simulator mode**, maintaining full objective verification, terminal interaction, code editing, and XP tracking.
