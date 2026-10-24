import type { LabLevel } from "@/lib/sandbox";
import { emptyDocker, type DockerState } from "./engine";

const running = (s: DockerState, pred: (c: DockerState["containers"][number]) => boolean) =>
  s.containers.some((c) => c.status === "running" && pred(c));

const DOCKERFILE_LEVEL_2 = `FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;

const HTML_LEVEL_2 = `<!DOCTYPE html>
<html>
<head><title>Nexa Container App</title></head>
<body><h1>Nexa Container Cloud v1.0</h1></body>
</html>`;

const COMPOSE_LEVEL_6 = `services:
  api:
    image: nexa-api:1.0
    ports: ["3000:3000"]
# TODO: add a cache service using redis:7
`;

const MULTI_STAGE_DOCKERFILE = `# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;

export const dockerLevels: LabLevel<DockerState>[] = [
  {
    id: 1,
    title: "The Container Recruit",
    badge: "Container Recruit",
    story:
      '"The application works on my machine, but I have no way to run it anywhere else." Your first job at the company: get its web service running in a container, the same way on every machine, without installing anything on your own laptop.',
    concepts: [
      { term: "Image", meaning: "A read-only template containing the app and all runtime dependencies." },
      { term: "Container", meaning: "A running or stopped isolated instance of an image." },
      { term: "-p 8080:80", meaning: "Maps host port 8080 to container port 80." },
    ],
    setup: () => emptyDocker({
      files: {
        "README.md": "# Mission 01\nRun an Nginx web server inside a container named web-lab and publish port 8080.",
      },
    }),
    missions: [
      {
        id: "d1",
        title: "The Container Recruit",
        objective: "Run an Nginx web server inside a container and prove it answers on port 8080.",
        xp: 100,
        briefing:
          '"The application works on my machine, but I have no way to run it anywhere else." Your first job at the company: get its web service running in a container, the same way on every machine, without installing anything on your own laptop.',
        hints: [
          "Check existing images with `docker images`.",
          "Run detached with `-d`, set name with `--name web-lab`, and map ports with `-p 8080:80`.",
          "Run: `docker run -d --name web-lab -p 8080:80 nginx`",
        ],
        suggested: ["docker images", "docker run -d --name web-lab -p 8080:80 nginx", "curl localhost:8080"],
        checks: [
          {
            label: "The nginx image is available on this host",
            test: (s) => s.images.some((i) => i.startsWith("nginx")),
          },
          {
            label: "A container named web-lab is running",
            test: (s) => running(s, (c) => c.name === "web-lab"),
          },
          {
            label: "It publishes host port 8080 to container port 80",
            test: (s) =>
              running(s, (c) => c.name === "web-lab" && c.ports.some((p) => p.startsWith("8080:80") || p.includes("8080:80"))),
          },
          {
            label: "The application answers on port 8080",
            test: (s) =>
              running(s, (c) => c.name === "web-lab" && c.ports.some((p) => p.startsWith("8080:80") || p.includes("8080:80"))),
          },
        ],
        check: (s) =>
          s.images.some((i) => i.startsWith("nginx")) &&
          running(s, (c) => c.name === "web-lab" && c.ports.some((p) => p.startsWith("8080:80") || p.includes("8080:80"))),
      },
    ],
  },
  {
    id: 2,
    title: "Image Architect",
    badge: "Image Architect",
    story: "Package your own web page into an image and run it from the image you built.",
    concepts: [
      { term: "Dockerfile", meaning: "A declarative recipe for building container images layer by layer." },
      { term: "docker build", meaning: "Compiles a Dockerfile into an immutable tagged image." },
    ],
    setup: () =>
      emptyDocker({
        files: {
          Dockerfile: DOCKERFILE_LEVEL_2,
          "index.html": HTML_LEVEL_2,
        },
      }),
    missions: [
      {
        id: "d2",
        title: "Image Architect",
        objective: "Build an image named `my-web-app:1.0` from Dockerfile and start container `custom-web` on port 3000.",
        xp: 150,
        briefing:
          "Pre-packaged images are great, but now it is time to build our company application. Create a custom image from the local Dockerfile and deploy it.",
        hints: [
          "Check the Dockerfile in the Files tab.",
          "Build using `docker build -t my-web-app:1.0 .`",
          "Run using `docker run -d --name custom-web -p 3000:80 my-web-app:1.0`",
        ],
        suggested: ["docker build -t my-web-app:1.0 .", "docker run -d --name custom-web -p 3000:80 my-web-app:1.0"],
        checks: [
          {
            label: "Dockerfile has FROM and COPY instructions",
            test: (s) => /^FROM\s+/m.test(s.files["Dockerfile"] || "") && /^COPY\s+/m.test(s.files["Dockerfile"] || ""),
          },
          {
            label: "Image my-web-app:1.0 is built and listed",
            test: (s) => s.images.some((i) => i.startsWith("my-web-app:1.0")),
          },
          {
            label: "Container custom-web is running on port 3000",
            test: (s) =>
              running(s, (c) => c.name === "custom-web" && c.image.startsWith("my-web-app") && c.ports.some((p) => p.startsWith("3000:"))),
          },
        ],
        check: (s) =>
          s.images.some((i) => i.startsWith("my-web-app:1.0")) &&
          running(s, (c) => c.name === "custom-web" && c.ports.some((p) => p.startsWith("3000:"))),
      },
    ],
  },
  {
    id: 3,
    title: "The Broken Container",
    badge: "Troubleshooter",
    story: "A crashing container is filling the logs. Diagnose the error using docker logs, fix the environment variable, and get it running.",
    concepts: [
      { term: "docker logs", meaning: "Fetches stdout and stderr from a container for debugging." },
      { term: "-e KEY=VALUE", meaning: "Injects runtime environment variables into the container." },
    ],
    setup: () =>
      emptyDocker({
        containers: [
          {
            id: "deadbeef0001",
            name: "api-crasher",
            image: "nexa-api:1.0",
            status: "exited",
            ports: [],
            volumes: [],
            network: "bridge",
          },
        ],
      }),
    missions: [
      {
        id: "d3",
        title: "The Broken Container",
        objective: "Diagnose why api-crasher failed, remove it, and restart it with `PORT=4000`.",
        xp: 200,
        briefing:
          "Production alerted: `api-crasher` died immediately on startup. Read its logs, remove the dead container, and start a new one with the required environment variable.",
        hints: [
          "Run `docker logs api-crasher` to see the missing variable.",
          "Stop and remove with `docker rm -f api-crasher`.",
          "Start with `docker run -d --name api-crasher -e PORT=4000 -p 4000:4000 nexa-api:1.0`.",
        ],
        suggested: ["docker logs api-crasher", "docker rm -f api-crasher", "docker run -d --name api-crasher -e PORT=4000 -p 4000:4000 nexa-api:1.0"],
        checks: [
          {
            label: "Inspect crash logs with docker logs",
            test: (s) => s.history.some((h) => /^docker logs api-crasher/.test(h)),
          },
          {
            label: "Remove the failing container",
            test: (s) => !s.containers.some((c) => c.name === "api-crasher" && c.status === "exited"),
          },
          {
            label: "Container api-crasher running with PORT=4000",
            test: (s) =>
              running(s, (c) => c.name === "api-crasher" && (c.env?.["PORT"] === "4000" || c.ports.some((p) => p.includes("4000")))),
          },
        ],
        check: (s) =>
          s.history.some((h) => /^docker logs api-crasher/.test(h)) &&
          running(s, (c) => c.name === "api-crasher" && (c.env?.["PORT"] === "4000" || c.ports.some((p) => p.includes("4000")))),
      },
    ],
  },
  {
    id: 4,
    title: "The Data Guardian",
    badge: "Volume Master",
    story: "Containers are stateless and ephemeral, but databases must persist their data. Create and attach a persistent volume to a Postgres container.",
    concepts: [
      { term: "Docker Volume", meaning: "Managed storage outside container filesystem that survives restarts." },
      { term: "-v vol:/path", meaning: "Mounts volume into specific directory inside container." },
    ],
    setup: () => emptyDocker({ images: ["postgres:16"] }),
    missions: [
      {
        id: "d4",
        title: "The Data Guardian",
        objective: "Create volume `pgdata` and run container `db` with `pgdata` mounted to `/var/lib/postgresql/data`.",
        xp: 200,
        briefing:
          "QA lost their customer database after someone restarted the host. Ensure the database data lives on a named volume so containers can be replaced freely.",
        hints: [
          "Create volume: `docker volume create pgdata`.",
          "Run container: `docker run -d --name db -v pgdata:/var/lib/postgresql/data postgres:16`.",
        ],
        suggested: ["docker volume create pgdata", "docker run -d --name db -v pgdata:/var/lib/postgresql/data postgres:16"],
        checks: [
          {
            label: "Named volume pgdata is created",
            test: (s) => s.volumes.includes("pgdata"),
          },
          {
            label: "Postgres container db is running with pgdata mounted",
            test: (s) =>
              running(s, (c) => c.name === "db" && c.volumes.some((v) => v.startsWith("pgdata:/var/lib/postgresql/data"))),
          },
        ],
        check: (s) =>
          s.volumes.includes("pgdata") &&
          running(s, (c) => c.name === "db" && c.volumes.some((v) => v.startsWith("pgdata:/var/lib/postgresql/data"))),
      },
    ],
  },
  {
    id: 5,
    title: "Network Operator",
    badge: "Network Operator",
    story: "Default bridge networks don't provide DNS name resolution between containers. Create an isolated custom bridge network and connect services.",
    concepts: [
      { term: "User-defined Bridge", meaning: "Provides automatic DNS resolution between containers by name." },
      { term: "--network", meaning: "Attaches a container to a designated private network." },
    ],
    setup: () => emptyDocker({ images: ["redis:7", "nexa-api:1.0"] }),
    missions: [
      {
        id: "d5",
        title: "Network Operator",
        objective: "Create network `backend-net`, then start `cache` (redis:7) and `api` on `backend-net`.",
        xp: 200,
        briefing:
          "The backend API needs to query Redis using the hostname `cache`. On the default bridge network, container DNS is disabled. Create an isolated network `backend-net`.",
        hints: [
          "Create the network: `docker network create backend-net`.",
          "Start cache: `docker run -d --name cache --network backend-net redis:7`.",
          "Start api: `docker run -d --name api --network backend-net -p 3000:3000 nexa-api:1.0`.",
        ],
        suggested: [
          "docker network create backend-net",
          "docker run -d --name cache --network backend-net redis:7",
          "docker run -d --name api --network backend-net -p 3000:3000 nexa-api:1.0",
        ],
        checks: [
          {
            label: "Custom network backend-net is created",
            test: (s) => s.networks.includes("backend-net"),
          },
          {
            label: "Container cache is running on backend-net",
            test: (s) => running(s, (c) => c.name === "cache" && c.network === "backend-net"),
          },
          {
            label: "Container api is running on backend-net",
            test: (s) => running(s, (c) => c.name === "api" && c.network === "backend-net"),
          },
        ],
        check: (s) =>
          s.networks.includes("backend-net") &&
          running(s, (c) => c.name === "cache" && c.network === "backend-net") &&
          running(s, (c) => c.name === "api" && c.network === "backend-net"),
      },
    ],
  },
  {
    id: 6,
    title: "Compose Commander",
    badge: "Compose Commander",
    story: "Managing multiple containers manually is tedious and error-prone. Use Docker Compose to declare both web and cache services in compose.yaml.",
    concepts: [
      { term: "compose.yaml", meaning: "Multi-container specification declaring services, networks, and volumes." },
      { term: "docker compose up", meaning: "Creates and starts all services defined in the configuration file." },
    ],
    setup: () =>
      emptyDocker({
        files: { "compose.yaml": COMPOSE_LEVEL_6 },
        images: ["nexa-api:1.0", "redis:7"],
      }),
    missions: [
      {
        id: "d6",
        title: "Compose Commander",
        objective: "Add a cache service (redis:7) to compose.yaml and bring the entire stack up with `docker compose up -d`.",
        xp: 250,
        briefing:
          "Typing long docker run commands with flags in production leads to outages. Declare our complete microservice stack in compose.yaml and deploy with one command.",
        hints: [
          "Open compose.yaml in the Files tab.",
          "Add `  cache:\\n    image: redis:7` under services, then click Save.",
          "Run `docker compose up -d`.",
        ],
        suggested: ["cat compose.yaml", "docker compose up -d", "docker ps"],
        checks: [
          {
            label: "compose.yaml defines both api and cache services",
            test: (s) => /cache:/m.test(s.files["compose.yaml"] || ""),
          },
          {
            label: "Multi-container stack brought up with docker compose",
            test: (s) =>
              running(s, (c) => c.name.includes("api")) && running(s, (c) => c.name.includes("cache")),
          },
        ],
        check: (s) =>
          /cache:/m.test(s.files["compose.yaml"] || "") &&
          running(s, (c) => c.name.includes("api")) &&
          running(s, (c) => c.name.includes("cache")),
      },
    ],
  },
  {
    id: 7,
    title: "The Deployment Boss",
    badge: "Deployment Boss",
    story: "Boss battle! Multi-tier production architecture with frontend, backend, database volume, and isolated networks. Bring down the monolith and bring up the full microservices stack.",
    concepts: [
      { term: "Microservices", meaning: "Decoupled specialized services interacting over private networks." },
      { term: "Graceful Shutdown", meaning: "Stopping legacy workloads cleanly before cutover." },
    ],
    setup: () =>
      emptyDocker({
        containers: [
          {
            id: "mono0001dead",
            name: "monolith",
            image: "legacy-monolith:0.9",
            status: "running",
            ports: ["80:80"],
            volumes: [],
            network: "bridge",
          },
        ],
        files: {
          "compose.yaml": `services:
  frontend:
    image: nginx:alpine
    ports: ["80:80"]
  backend:
    image: nexa-api:1.0
    ports: ["3000:3000"]
  db:
    image: postgres:16
`,
        },
      }),
    missions: [
      {
        id: "d7",
        title: "The Deployment Boss",
        objective: "Stop the legacy monolith container, then deploy the 3-tier microservices stack with compose.",
        xp: 500,
        briefing:
          "The migration cutover window is now open. Stop the legacy monolith holding port 80, then bring up the production compose stack with frontend, backend, and db.",
        hints: [
          "Stop monolith: `docker stop monolith && docker rm monolith`.",
          "Bring up new stack: `docker compose up -d`.",
          "Check running services with `docker ps`.",
        ],
        suggested: ["docker stop monolith", "docker compose up -d", "docker ps"],
        checks: [
          {
            label: "Stop the legacy monolith container",
            test: (s) => !running(s, (c) => c.name === "monolith"),
          },
          {
            label: "Launch multi-service production stack with Docker Compose",
            test: (s) =>
              running(s, (c) => c.name.includes("frontend")) &&
              running(s, (c) => c.name.includes("backend")),
          },
          {
            label: "Verify all 3 containers are healthy and running",
            test: (s) => s.containers.filter((c) => c.status === "running").length >= 3,
          },
        ],
        check: (s) =>
          !running(s, (c) => c.name === "monolith") &&
          running(s, (c) => c.name.includes("frontend")) &&
          running(s, (c) => c.name.includes("backend")),
      },
    ],
  },
  {
    id: 8,
    title: "Pipeline Architect",
    badge: "Pipeline Architect",
    story: "Automate Docker builds for cloud deployment. Tag and prepare a production-grade multi-stage container image for AWS ECR.",
    concepts: [
      { term: "Multi-stage Build", meaning: "Separates build dependencies from final minimal runtime image." },
      { term: "AWS ECR Registry", meaning: "Amazon Elastic Container Registry repository URL format." },
    ],
    setup: () =>
      emptyDocker({
        files: {
          Dockerfile: MULTI_STAGE_DOCKERFILE,
          "package.json": '{"name":"nexa-web","scripts":{"build":"echo build"}}',
        },
      }),
    missions: [
      {
        id: "d8",
        title: "Pipeline Architect",
        objective: "Build and tag a minimal multi-stage image for AWS ECR as `123456789012.dkr.ecr.us-east-1.amazonaws.com/nexa-web:v1`.",
        xp: 220,
        briefing:
          "To deploy our containers on AWS ECS and EKS, images must be pushed to Amazon Elastic Container Registry (ECR). Build the multi-stage Dockerfile and tag it with the AWS ECR registry URI.",
        hints: [
          "Inspect the multi-stage Dockerfile in Files tab.",
          "Build and tag with `docker build -t 123456789012.dkr.ecr.us-east-1.amazonaws.com/nexa-web:v1 .`",
        ],
        suggested: [
          "cat Dockerfile",
          "docker build -t 123456789012.dkr.ecr.us-east-1.amazonaws.com/nexa-web:v1 .",
          "docker images",
        ],
        checks: [
          {
            label: "Multi-stage Dockerfile configured in sandbox files",
            test: (s) => /AS builder/m.test(s.files["Dockerfile"] || ""),
          },
          {
            label: "Build and tag image for AWS ECR: 123456789012.dkr.ecr.us-east-1.amazonaws.com/nexa-web:v1",
            test: (s) =>
              s.images.some((i) => i.includes("123456789012.dkr.ecr.us-east-1.amazonaws.com/nexa-web:v1")),
          },
        ],
        check: (s) =>
          s.images.some((i) => i.includes("123456789012.dkr.ecr.us-east-1.amazonaws.com/nexa-web:v1")),
      },
    ],
  },
];
