import type { LabLevel } from "@/lib/sandbox";
import { emptyDocker, type DockerState } from "./engine";

const running = (s: DockerState, pred: (c: DockerState["containers"][number]) => boolean) =>
  s.containers.some((c) => c.status === "running" && pred(c));

const API_DOCKERFILE_BROKEN = `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
# TODO: tell the container how to start the app`;

export const dockerLevels: LabLevel<DockerState>[] = [
  {
    id: 1, title: "Hello, Container", badge: "First Contact",
    story: "Day one at Nexa. Your lead, Maya, says: \"Before you touch our services, prove Docker works on your sandbox.\"",
    concepts: [
      { term: "Image", meaning: "A read-only template — the app plus everything it needs." },
      { term: "Container", meaning: "A running (or stopped) instance of an image." },
    ],
    setup: () => emptyDocker(),
    missions: [
      { id: "d1-1", title: "Check the engine", objective: "Confirm Docker is installed by checking its version.", xp: 50,
        hints: ["Every CLI has a version subcommand.", "Run `docker version`."], check: (s) => s.history.some((h) => /^docker (version|--version)/.test(h)) },
      { id: "d1-2", title: "Run hello-world", objective: "Run the official hello-world image and confirm it created a container.", xp: 100,
        hints: ["`docker run` pulls the image automatically if it's missing.", "Run `docker run hello-world`, then `docker ps -a`."], check: (s) => s.containers.some((c) => c.image.startsWith("hello-world")) },
    ],
  },
  {
    id: 2, title: "Serve the Homepage", badge: "Port Master",
    story: "Marketing needs a quick preview of the landing page. Nginx is the fastest way to serve static files.",
    concepts: [
      { term: "-d", meaning: "Detached: run in the background." },
      { term: "-p 8080:80", meaning: "Map host port 8080 to container port 80." },
      { term: "--name", meaning: "Give the container a memorable name." },
    ],
    setup: () => emptyDocker(),
    missions: [
      { id: "d2-1", title: "Pull nginx", objective: "Download the nginx image so it's available locally.", xp: 60,
        hints: ["Use docker pull.", "`docker pull nginx`"], check: (s) => s.images.some((i) => i.startsWith("nginx")) },
      { id: "d2-2", title: "Publish it", objective: "Run nginx in the background, named `web`, reachable on host port 8080.", xp: 140,
        hints: ["You need -d, --name and -p.", "`docker run -d --name web -p 8080:80 nginx`"],
        check: (s) => running(s, (c) => c.name === "web" && c.image.startsWith("nginx") && c.ports.some((p) => p.startsWith("8080:80"))) },
    ],
  },
  {
    id: 3, title: "Container Lifecycle", badge: "Lifecycle Keeper",
    story: "An old test container `legacy-cache` is eating memory on the shared host. Clean it up without touching `web`.",
    concepts: [
      { term: "docker stop", meaning: "Gracefully stops a running container." },
      { term: "docker rm", meaning: "Deletes a stopped container." },
      { term: "docker logs", meaning: "Shows a container's output." },
    ],
    setup: () => emptyDocker({
      images: ["nginx:latest", "redis:7"],
      containers: [
        { id: "a1b2c3d4e5f6", name: "web", image: "nginx:latest", status: "running", ports: ["8080:80"], volumes: [], network: "bridge" },
        { id: "f6e5d4c3b2a1", name: "legacy-cache", image: "redis:7", status: "running", ports: [], volumes: [], network: "bridge" },
      ],
    }),
    missions: [
      { id: "d3-1", title: "Read the logs", objective: "Check what the `web` container has been printing.", xp: 60,
        hints: ["docker logs <name>", "`docker logs web`"], check: (s) => s.history.some((h) => /^docker logs web/.test(h)) },
      { id: "d3-2", title: "Remove legacy-cache", objective: "Stop and remove `legacy-cache`, keeping `web` running.", xp: 140,
        hints: ["A running container must be stopped before rm.", "`docker stop legacy-cache` then `docker rm legacy-cache`"],
        check: (s) => !s.containers.some((c) => c.name === "legacy-cache") && running(s, (c) => c.name === "web") },
    ],
  },
  {
    id: 4, title: "Build Your Own Image", badge: "Image Smith",
    story: "The Nexa API needs to ship as an image. A teammate started the Dockerfile but the build keeps failing.",
    concepts: [
      { term: "FROM", meaning: "The base image to start from." },
      { term: "COPY / RUN", meaning: "Add files and run build steps (each creates a layer)." },
      { term: "CMD", meaning: "The default command when the container starts." },
    ],
    setup: () => emptyDocker({ files: { Dockerfile: API_DOCKERFILE_BROKEN, "package.json": '{ "name": "nexa-api", "scripts": { "start": "node server.js" } }', "server.js": "require('http').createServer((q,r)=>r.end('ok')).listen(3000)" } }),
    missions: [
      { id: "d4-1", title: "Fix the Dockerfile", objective: "Open Dockerfile in the file panel and add a CMD that starts the app (npm start).", xp: 120,
        hints: ["Look at the last line — it's only a comment.", 'Add `CMD ["npm", "start"]` at the end and save.'], check: (s) => /^CMD\s+/m.test(s.files["Dockerfile"] ?? "") },
      { id: "d4-2", title: "Build and run", objective: "Build the image as `nexa-api:1.0` and run it detached on port 3000.", xp: 180,
        hints: ["docker build -t <name:tag> .", "`docker build -t nexa-api:1.0 .` then `docker run -d -p 3000:3000 nexa-api:1.0`"],
        check: (s) => s.images.includes("nexa-api:1.0") && running(s, (c) => c.image === "nexa-api:1.0" && c.ports.some((p) => p.endsWith(":3000"))) },
    ],
  },
  {
    id: 5, title: "Data That Survives", badge: "Persistence Pro",
    story: "QA lost their test database after a restart — again. Containers are disposable; data shouldn't be.",
    concepts: [
      { term: "Volume", meaning: "Docker-managed storage that outlives containers." },
      { term: "-v name:/path", meaning: "Mount a volume into the container." },
    ],
    setup: () => emptyDocker({ images: ["postgres:16"] }),
    missions: [
      { id: "d5-1", title: "Create a volume", objective: "Create a volume named `pgdata`.", xp: 80,
        hints: ["docker volume …", "`docker volume create pgdata`"], check: (s) => s.volumes.includes("pgdata") },
      { id: "d5-2", title: "Mount it", objective: "Run postgres detached, named `db`, with `pgdata` mounted at /var/lib/postgresql/data.", xp: 170,
        hints: ["Combine -d, --name and -v.", "`docker run -d --name db -v pgdata:/var/lib/postgresql/data postgres:16`"],
        check: (s) => running(s, (c) => c.name === "db" && c.volumes.some((v) => v.startsWith("pgdata:/var/lib/postgresql/data"))) },
    ],
  },
  {
    id: 6, title: "Multi-Container Apps", badge: "Composer",
    story: "The API needs Redis. Starting each container by hand is error-prone — describe the whole stack in one file.",
    concepts: [
      { term: "User network", meaning: "Containers on the same network reach each other by name." },
      { term: "Compose", meaning: "Declare services in compose.yaml and start them together." },
    ],
    setup: () => emptyDocker({ images: ["nexa-api:1.0", "redis:7"], registry: ["redis:7", "nexa-api:1.0", "nginx:latest"],
      files: { "compose.yaml": "services:\n  api:\n    image: nexa-api:1.0\n    ports: [\"3000:3000\"]\n# TODO: add a cache service using redis:7\n" } }),
    missions: [
      { id: "d6-1", title: "Private network", objective: "Create a network named `nexa-net`.", xp: 80,
        hints: ["docker network …", "`docker network create nexa-net`"], check: (s) => s.networks.includes("nexa-net") },
      { id: "d6-2", title: "Compose the stack", objective: "Add a `cache` service (image redis:7) to compose.yaml and bring the stack up.", xp: 200,
        hints: ["Indent like the api service: two spaces for the name, four for image.", "Add `  cache:\\n    image: redis:7`, save, then `docker compose up -d`."],
        check: (s) => running(s, (c) => c.name === "nexa-api-1") && running(s, (c) => c.name === "nexa-cache-1" && c.image === "redis:7") },
    ],
  },
];
