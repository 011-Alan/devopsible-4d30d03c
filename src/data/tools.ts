import { GitBranch, Boxes, Container, Ship, Settings2, Layers } from "lucide-react";

export type ToolSection = { heading: string; body: string; code?: string };

export type DevOpsTool = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  icon: typeof GitBranch;
  accent: string;
  intro: string;
  sections: ToolSection[];
  resources: { label: string; href: string }[];
};

export const tools: DevOpsTool[] = [
  {
    slug: "git",
    name: "Git",
    tagline: "Version control",
    category: "Source",
    icon: GitBranch,
    accent: "hsl(14 80% 55%)",
    intro:
      "Git is a distributed version control system. Every developer has a full copy of the history, which makes branching, merging and rolling back cheap and safe.",
    sections: [
      {
        heading: "Core concepts",
        body: "A repository stores snapshots called commits. Branches are movable pointers to commits, and merging combines histories. The three areas to understand are the working directory, the staging area (index), and the repository itself.",
      },
      {
        heading: "Everyday commands",
        body: "These cover roughly 90% of daily work.",
        code: `git init                 # start a repo
git clone <url>          # copy a remote repo
git status               # see what changed
git add .                # stage changes
git commit -m "message"  # record a snapshot
git push origin main     # publish
git pull --rebase        # sync with remote`,
      },
      {
        heading: "Branching workflow",
        body: "Create a branch per change, open a pull request, review, then merge. Keep branches short-lived to avoid painful merges.",
        code: `git switch -c feature/login
git commit -am "Add login form"
git push -u origin feature/login`,
      },
      {
        heading: "Practice task",
        body: "Create a repo, make three commits on a branch, rebase it onto main, and resolve one intentional conflict.",
      },
    ],
    resources: [
      { label: "Official Git docs", href: "https://git-scm.com/doc" },
      { label: "Learn Git Branching (interactive)", href: "https://learngitbranching.js.org" },
    ],
  },
  {
    slug: "jenkins",
    name: "Jenkins",
    tagline: "CI/CD automation",
    category: "Pipelines",
    icon: Settings2,
    accent: "hsl(207 55% 50%)",
    intro:
      "Jenkins is an extensible automation server used to build, test and deploy software continuously. Pipelines are defined as code in a Jenkinsfile stored next to your source.",
    sections: [
      {
        heading: "Core concepts",
        body: "A job (or pipeline) runs on a controller and delegates work to agents. Stages group steps; steps invoke shell commands or plugins. Credentials, triggers and artifacts are first-class citizens.",
      },
      {
        heading: "A declarative pipeline",
        body: "Declarative syntax is the recommended way to write pipelines.",
        code: `pipeline {
  agent any
  stages {
    stage('Build')  { steps { sh 'npm ci && npm run build' } }
    stage('Test')   { steps { sh 'npm test' } }
    stage('Deploy') {
      when { branch 'main' }
      steps { sh './deploy.sh' }
    }
  }
  post { failure { echo 'Pipeline failed' } }
}`,
      },
      {
        heading: "Good practice",
        body: "Keep the Jenkinsfile in version control, make builds reproducible, fail fast on tests, and never store secrets in the pipeline — use the credentials store.",
      },
      {
        heading: "Practice task",
        body: "Run Jenkins locally in Docker, connect a Git repo, and create a pipeline that builds and tests on every push.",
      },
    ],
    resources: [
      { label: "Jenkins user handbook", href: "https://www.jenkins.io/doc/book/" },
      { label: "Pipeline syntax reference", href: "https://www.jenkins.io/doc/book/pipeline/syntax/" },
    ],
  },
  {
    slug: "docker",
    name: "Docker",
    tagline: "Containers",
    category: "Runtime",
    icon: Container,
    accent: "hsl(203 70% 52%)",
    intro:
      "Docker packages an application together with its dependencies into a portable image. The same image runs identically on a laptop, in CI, and in production.",
    sections: [
      {
        heading: "Core concepts",
        body: "A Dockerfile describes how to build an image. An image is an immutable layered filesystem. A container is a running instance of an image. Volumes persist data, and networks let containers talk to each other.",
      },
      {
        heading: "A small Dockerfile",
        body: "Multi-stage builds keep production images lean.",
        code: `FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html`,
      },
      {
        heading: "Everyday commands",
        body: "Build, run, inspect and clean up.",
        code: `docker build -t myapp:1.0 .
docker run -p 8080:80 myapp:1.0
docker ps
docker logs -f <container>
docker compose up -d`,
      },
      {
        heading: "Practice task",
        body: "Containerise a small web app, expose it on a port, then add a database with Docker Compose.",
      },
    ],
    resources: [
      { label: "Docker documentation", href: "https://docs.docker.com" },
      { label: "Dockerfile best practices", href: "https://docs.docker.com/build/building/best-practices/" },
    ],
  },
  {
    slug: "kubernetes",
    name: "Kubernetes",
    tagline: "Orchestration",
    category: "Runtime",
    icon: Ship,
    accent: "hsl(220 62% 55%)",
    intro:
      "Kubernetes schedules and manages containers across a cluster of machines. You declare the desired state and the control plane continuously works to match it.",
    sections: [
      {
        heading: "Core objects",
        body: "Pods are the smallest deployable unit. Deployments manage replica sets of pods and handle rolling updates. Services give pods a stable network identity, and Ingress exposes them outside the cluster. ConfigMaps and Secrets hold configuration.",
      },
      {
        heading: "A Deployment manifest",
        body: "Everything is declarative YAML applied with kubectl.",
        code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: web
          image: myapp:1.0
          ports: [{ containerPort: 80 }]`,
      },
      {
        heading: "Everyday commands",
        body: "kubectl is the primary interface to the cluster.",
        code: `kubectl apply -f deployment.yaml
kubectl get pods -w
kubectl describe pod <name>
kubectl logs -f <pod>
kubectl rollout undo deployment/web`,
      },
      {
        heading: "Practice task",
        body: "Spin up a local cluster with kind or minikube, deploy an app with 3 replicas, expose it with a Service, and perform a rolling update.",
      },
    ],
    resources: [
      { label: "Kubernetes docs", href: "https://kubernetes.io/docs/home/" },
      { label: "Interactive tutorials", href: "https://kubernetes.io/docs/tutorials/" },
    ],
  },
  {
    slug: "ansible",
    name: "Ansible",
    tagline: "Configuration management",
    category: "Automation",
    icon: Layers,
    accent: "hsl(0 0% 45%)",
    intro:
      "Ansible automates configuration and deployment over SSH — no agent required. Playbooks are YAML descriptions of the state you want your servers to be in.",
    sections: [
      {
        heading: "Core concepts",
        body: "An inventory lists your hosts. A playbook contains plays, each targeting hosts and running tasks built from modules. Roles package reusable tasks, templates and variables. Tasks should be idempotent — running twice changes nothing the second time.",
      },
      {
        heading: "A simple playbook",
        body: "Install and start a web server on all hosts in a group.",
        code: `- name: Configure web servers
  hosts: web
  become: true
  tasks:
    - name: Install nginx
      apt: { name: nginx, state: present, update_cache: true }
    - name: Ensure nginx is running
      service: { name: nginx, state: started, enabled: true }`,
      },
      {
        heading: "Everyday commands",
        body: "Run ad-hoc commands or full playbooks.",
        code: `ansible all -i inventory.ini -m ping
ansible-playbook -i inventory.ini site.yml
ansible-playbook site.yml --check --diff`,
      },
      {
        heading: "Practice task",
        body: "Provision two VMs, write a role that installs nginx and deploys a templated index page, then run it against both.",
      },
    ],
    resources: [
      { label: "Ansible documentation", href: "https://docs.ansible.com" },
      { label: "Ansible Galaxy roles", href: "https://galaxy.ansible.com" },
    ],
  },
  {
    slug: "terraform",
    name: "Terraform",
    tagline: "Infrastructure as code",
    category: "Provisioning",
    icon: Boxes,
    accent: "hsl(258 60% 60%)",
    intro:
      "Terraform provisions cloud infrastructure from declarative configuration. It builds a dependency graph, computes a plan, and applies only the changes needed.",
    sections: [
      {
        heading: "Core concepts",
        body: "Providers talk to cloud APIs. Resources describe infrastructure. State records what Terraform created so it can compute diffs — keep it remote and locked for teams. Modules package reusable configuration.",
      },
      {
        heading: "A minimal configuration",
        body: "Declare a provider and a resource, then plan and apply.",
        code: `terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" { region = "us-east-1" }

resource "aws_s3_bucket" "assets" {
  bucket = "my-app-assets"
  tags   = { Environment = "dev" }
}`,
      },
      {
        heading: "The workflow",
        body: "Init, plan, apply, destroy — always read the plan before applying.",
        code: `terraform init
terraform fmt && terraform validate
terraform plan -out=tfplan
terraform apply tfplan
terraform destroy`,
      },
      {
        heading: "Practice task",
        body: "Create a bucket and a virtual machine in one configuration, move them into a module, and store state remotely.",
      },
    ],
    resources: [
      { label: "Terraform docs", href: "https://developer.hashicorp.com/terraform/docs" },
      { label: "Registry of providers & modules", href: "https://registry.terraform.io" },
    ],
  },
];

export const getTool = (slug?: string) => tools.find((t) => t.slug === slug);
