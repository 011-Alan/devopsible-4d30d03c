import { parseFlags, tokenize, type ExecResult } from "@/lib/sandbox";

export type Container = {
  id: string;
  name: string;
  image: string;
  status: "running" | "exited";
  ports: string[];
  volumes: string[];
  network: string;
  env?: Record<string, string>;
};

export type DockerState = {
  images: string[];
  registry: string[];
  containers: Container[];
  volumes: string[];
  networks: string[];
  files: Record<string, string>;
  history: string[];
  lastCurl?: { url: string; status: number; body: string };
};

export const emptyDocker = (over: Partial<DockerState> = {}): DockerState => ({
  images: ["nginx:latest", "alpine:latest"],
  registry: [
    "nginx:latest",
    "nginx:alpine",
    "node:20-alpine",
    "postgres:16",
    "redis:7",
    "hello-world:latest",
    "alpine:latest",
    "nexa-api:1.0",
    "123456789012.dkr.ecr.us-east-1.amazonaws.com/nexa-web:v1",
  ],
  containers: [],
  volumes: [],
  networks: ["bridge", "host", "none"],
  files: {},
  history: [],
  ...over,
});

const tagOf = (img: string) => (img.includes(":") ? img : `${img}:latest`);
let seq = 0;
const newId = () => (Date.now().toString(16) + (seq++).toString(16)).slice(-12);

const HELP = `Available Docker commands:
  docker run [-d] [--name <name>] [-p <host>:<container>] [-v <vol>:<path>] [--network <net>] [-e <K=V>] <image>
  docker ps [-a]
  docker images
  docker pull <image>
  docker stop <name|id>
  docker start <name|id>
  docker rm [-f] <name|id>
  docker logs <name|id>
  docker exec <name|id> <command>
  docker build -t <name:tag> <path>
  docker volume create|ls <name>
  docker network create|ls <name>
  docker compose [-f <file>] up [-d] | down
  docker version

Utility commands:
  curl <url>       # Test HTTP response (e.g. curl localhost:8080)
  cat <file>       # View file contents
  ls               # List sandbox files
  clear            # Clear terminal output
  help             # Show this help text`;

export function runDocker(state: DockerState, raw: string): ExecResult<DockerState> {
  const cmd = raw.trim();
  const s: DockerState = { ...state, history: [...state.history, cmd] };
  const ok = (output: string, next: DockerState = s) => ({ state: next, output });
  const err = (output: string) => ({ state: s, output, error: true });
  const t = tokenize(cmd);
  if (!t.length) return ok("");

  if (t[0] === "help") return ok(HELP);
  if (t[0] === "clear") return ok("__CLEAR__");
  if (t[0] === "ls") return ok(Object.keys(s.files).join("  ") || "(empty)");
  if (t[0] === "cat") {
    if (!t[1]) return err("cat: missing file operand");
    return s.files[t[1]] ? ok(s.files[t[1]]) : err(`cat: ${t[1]}: No such file`);
  }

  // Support curl
  if (t[0] === "curl") {
    const target = t[1] || "";
    const cleanTarget = target.replace(/^https?:\/\//, "");
    const portMatch = cleanTarget.match(/:(\d+)/);
    const port = portMatch ? portMatch[1] : (cleanTarget.startsWith("localhost") || cleanTarget.startsWith("127.0.0.1") ? "80" : "80");

    // Look for running container exposing this host port
    const matchingContainer = s.containers.find(
      (c) => c.status === "running" && c.ports.some((p) => p.startsWith(`${port}:`) || p === port)
    );

    if (matchingContainer) {
      if (matchingContainer.image.includes("nginx")) {
        const body = `<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
body { width: 35em; margin: 0 auto; font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and working.</p>
</body>
</html>`;
        return ok(body, { ...s, lastCurl: { url: target, status: 200, body } });
      }

      if (matchingContainer.image.includes("nexa") || matchingContainer.image.includes("api")) {
        const body = JSON.stringify({ status: "healthy", service: matchingContainer.name, uptime: "42s" }, null, 2);
        return ok(body, { ...s, lastCurl: { url: target, status: 200, body } });
      }

      const body = `HTTP/1.1 200 OK\nContent-Type: text/plain\n\nConnected to ${matchingContainer.name} (${matchingContainer.image})`;
      return ok(body, { ...s, lastCurl: { url: target, status: 200, body } });
    }

    return err(`curl: (7) Failed to connect to ${target || "host"} port ${port}: Connection refused`);
  }

  if (t[0] !== "docker") return err(`${t[0]}: command not found. Type 'help' for available commands.`);

  const find = (n: string) => s.containers.find((c) => c.name === n || c.id.startsWith(n));
  const [sub, ...args] = t.slice(1);

  switch (sub) {
    case "version":
    case "--version":
      return ok(`Client: Docker Engine - Community
 Version:           27.0.3
 API version:       1.46
 Go version:        go1.22.4
 OS/Arch:           linux/amd64

Server: Docker Engine - Community
 Engine:
  Version:          27.0.3
  API version:      1.46 (minimum version 1.24)
  Go version:       go1.22.4
  OS/Arch:          linux/amd64
  Kernel Version:   6.6.137-devopsible-aws`);

    case "images":
      return ok(
        [
          "REPOSITORY                                                      TAG       IMAGE ID       CREATED        SIZE",
          ...s.images.map((i) => {
            const [repo, tag = "latest"] = i.split(":");
            return `${repo.padEnd(60)}${tag.padEnd(10)}${newId().slice(0, 12).padEnd(15)}2 days ago     142MB`;
          }),
        ].join("\n")
      );

    case "pull": {
      const img = tagOf(args[0] ?? "");
      if (!args[0]) return err("docker pull requires an image name");
      const images = s.images.includes(img) ? s.images : [...s.images, img];
      return ok(
        `Using default tag: ${img.split(":")[1]}
${img.split(":")[1]}: Pulling from library/${img.split(":")[0]}
712b20f88881: Pull complete
Status: Downloaded newer image for ${img}
docker.io/library/${img}`,
        { ...s, images }
      );
    }

    case "run": {
      const { flags, rest } = parseFlags(args, ["--name", "-p", "-v", "--network", "-e"]);
      const imgArg = rest[0];
      if (!imgArg) return err("docker run requires an image name");
      const img = tagOf(imgArg);
      let images = s.images;
      let pre = "";
      if (!images.includes(img)) {
        images = [...images, img];
        pre = `Unable to find image '${img}' locally\n${img.split(":")[1]}: Pulling from library/${img.split(":")[0]}\nStatus: Downloaded newer image for ${img}\n`;
      }

      const name =
        typeof flags["--name"] === "string"
          ? (flags["--name"] as string)
          : `${img.split("/").pop()!.split(":")[0].replace(/\W/g, "_")}_${s.containers.length + 1}`;

      if (find(name)) return err(`Error response from daemon: Conflict. The container name "/${name}" is already in use by container "${name}". You have to remove that container to be able to reuse that name.`);

      const network = typeof flags["--network"] === "string" ? (flags["--network"] as string) : "bridge";
      if (!s.networks.includes(network)) return err(`Error response from daemon: network ${network} not found`);

      const vol = typeof flags["-v"] === "string" ? (flags["-v"] as string) : null;
      let volumes = s.volumes;
      if (vol) {
        const v = vol.split(":")[0];
        if (!v.startsWith("/") && !volumes.includes(v)) volumes = [...volumes, v];
      }

      const ports: string[] = [];
      if (typeof flags["-p"] === "string") {
        ports.push(flags["-p"] as string);
      }

      const envVars: Record<string, string> = {};
      if (typeof flags["-e"] === "string") {
        const [k, v] = (flags["-e"] as string).split("=");
        if (k) envVars[k] = v || "";
      }

      const id = newId();
      const oneShot = img.startsWith("hello-world");
      const isDetached = !!flags["-d"];
      const c: Container = {
        id,
        name,
        image: img,
        status: oneShot ? "exited" : "running",
        ports,
        volumes: vol ? [vol] : [],
        network,
        env: envVars,
      };

      const out = oneShot
        ? `Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from Docker Hub.
 3. The Docker daemon created a new container from that image which runs the executable that produces the output you are currently reading.`
        : isDetached
        ? id
        : `${name} started (attached mode). Press Ctrl+C or use -d to detach.`;

      return ok(pre + out, { ...s, images, volumes, containers: [...s.containers, c] });
    }

    case "ps": {
      const all = args.includes("-a");
      const list = s.containers.filter((c) => all || c.status === "running");
      if (!list.length) {
        return ok("CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                    NAMES");
      }
      return ok(
        [
          "CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                    NAMES",
          ...list.map((c) => {
            const portStr = c.ports.map((p) => {
              if (p.includes(":")) {
                const [h, ct] = p.split(":");
                return `0.0.0.0:${h}->${ct}/tcp`;
              }
              return p;
            }).join(", ") || "";
            return `${c.id.slice(0, 12).padEnd(15)}${c.image.padEnd(15)}"/docker-entrypoint…"   2 minutes ago   ${(c.status === "running" ? "Up 2 minutes" : "Exited (0) 5m").padEnd(15)}${portStr.padEnd(25)}${c.name}`;
          }),
        ].join("\n")
      );
    }

    case "stop":
    case "start": {
      const targetName = args[0] ?? "";
      const c = find(targetName);
      if (!c) return err(`Error response from daemon: No such container: ${targetName}`);
      const status = sub === "stop" ? "exited" : "running";
      return ok(c.name, {
        ...s,
        containers: s.containers.map((x) => (x === c ? { ...x, status } : x)),
      });
    }

    case "rm": {
      const force = args.includes("-f");
      const cleanArgs = args.filter((a) => a !== "-f");
      const targetName = cleanArgs[0] ?? "";
      const c = find(targetName);
      if (!c) return err(`Error response from daemon: No such container: ${targetName}`);
      if (c.status === "running" && !force) {
        return err(`Error response from daemon: You cannot remove a running container ${c.id.slice(0, 12)}. Stop the container before attempting removal or force remove`);
      }
      return ok(c.name, { ...s, containers: s.containers.filter((x) => x !== c) });
    }

    case "logs": {
      const targetName = args[0] ?? "";
      const c = find(targetName);
      if (!c) return err(`Error response from daemon: No such container: ${targetName}`);
      if (c.name === "api-crasher") {
        return ok(`[ERROR] Server initialization failed: process.env.PORT is undefined!
[FATAL] Uncaught Exception: TypeError: Cannot read properties of undefined (reading 'PORT')
    at Server.listen (/app/server.js:14:22)
Container process terminated with exit code 1`);
      }
      if (c.image.startsWith("nginx")) {
        return ok(`/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
/docker-entrypoint.sh: Configuration complete; ready for start up
2026/10/22 14:20:00 [notice] 1#1: using the "epoll" event method
2026/10/22 14:20:00 [notice] 1#1: nginx/1.27.0
2026/10/22 14:20:00 [notice] 1#1: built by gcc 12.2.1
2026/10/22 14:20:00 [notice] 1#1: OS: Linux 6.6.137-devopsible-aws
172.17.0.1 - - [22/Oct/2026:14:21:05 +0000] "GET / HTTP/1.1" 200 615 "-" "curl/7.88.1"`);
      }
      if (c.image.includes("api") || c.image.includes("nexa")) {
        return ok(`[INFO] Nexa API service initialized on port ${c.ports[0]?.split(":")[0] || "3000"}
[INFO] Connected to Database and Redis Cache
GET /health 200 OK (1.2ms)`);
      }
      return ok(`${c.name}: [OK] Process running normally.`);
    }

    case "exec": {
      const targetName = args.filter((a) => !a.startsWith("-"))[0] ?? "";
      const c = find(targetName);
      if (!c) return err(`Error response from daemon: No such container: ${targetName}`);
      if (c.status !== "running") return err(`Error response from daemon: Container ${c.name} is not running`);
      const cmdToExec = args.slice(1).filter((a) => !a.startsWith("-")).slice(1).join(" ") || "sh";
      return ok(`(inside ${c.name}) ${cmdToExec} executed successfully`);
    }

    case "build": {
      const { flags, rest } = parseFlags(args, ["-t", "-f"]);
      const context = rest[0];
      if (!context) return err("docker build requires 1 argument (PATH | URL | -).\ne.g.: docker build -t myapp:1.0 .");
      const dfName = (flags["-f"] as string) || "Dockerfile";
      const df = s.files[dfName] || s.files["Dockerfile"];
      if (!df) return err(`ERROR: failed to read dockerfile: open ${dfName}: no such file`);
      if (!/^FROM\s+\S+/m.test(df)) return err("ERROR: Dockerfile must begin with a FROM instruction");

      const tag = tagOf(typeof flags["-t"] === "string" ? (flags["-t"] as string) : "untitled:latest");
      const steps = df.split("\n").filter((l) => l.trim() && !l.startsWith("#"));

      const buildLog = [
        `[+] Building 1.8s (7/7) FINISHED                                                               docker:default`,
        ...steps.map((l, i) => ` => [internal] load build step ${i + 1}/${steps.length}: ${l}`),
        ` => exporting to image`,
        ` => => exporting layers`,
        ` => => writing image sha256:${newId()}`,
        ` => => naming to ${tag}`,
      ].join("\n");

      return ok(buildLog, {
        ...s,
        images: s.images.includes(tag) ? s.images : [...s.images, tag],
        registry: [...s.registry, tag],
      });
    }

    case "volume": {
      if (args[0] === "ls") {
        return ok(["DRIVER    VOLUME NAME", ...s.volumes.map((v) => `local     ${v}`)].join("\n"));
      }
      if (args[0] === "create" && args[1]) {
        return ok(args[1], {
          ...s,
          volumes: s.volumes.includes(args[1]) ? s.volumes : [...s.volumes, args[1]],
        });
      }
      return err("Usage: docker volume create|ls <name>");
    }

    case "network": {
      if (args[0] === "ls") {
        return ok(["NETWORK ID     NAME      DRIVER    SCOPE", ...s.networks.map((n) => `${newId().slice(0, 12).padEnd(15)}${n.padEnd(10)}bridge    local`)].join("\n"));
      }
      if (args[0] === "create" && args[1]) {
        return ok(args[1], {
          ...s,
          networks: s.networks.includes(args[1]) ? s.networks : [...s.networks, args[1]],
        });
      }
      return err("Usage: docker network create|ls <name>");
    }

    case "compose": {
      const { flags, rest } = parseFlags(args, ["-f"]);
      const fileName = (flags["-f"] as string) || "compose.yaml";
      const file = s.files[fileName] || s.files["compose.yaml"] || s.files["docker-compose.yml"];

      if (rest[0] === "down") {
        return ok("Containers stopped and removed", {
          ...s,
          containers: s.containers.filter((c) => !c.name.startsWith("nexa-") && !c.name.startsWith("prod-")),
        });
      }

      if (rest[0] !== "up") return err("Usage: docker compose [-f file] up -d | down");

      if (!file) return err(`no configuration file provided: not found (${fileName})`);

      const services = [...file.matchAll(/^\s{2}(\w[\w-]*):\s*\n\s{4}(?:image|build):\s*(\S+)/gm)];
      const net = "nexa_default";
      const containers = s.containers.filter((c) => !c.name.startsWith("nexa-"));
      const added: Container[] = (services.length > 0 ? services : [["", "web", "nginx:alpine"], ["", "cache", "redis:7"]]).map(
        ([, sName, img]) => ({
          id: newId(),
          name: `nexa-${sName || "svc"}-1`,
          image: img === "." ? "nexa-api:1.0" : tagOf(img || "nginx"),
          status: "running" as const,
          ports: sName === "web" || sName === "api" ? ["3000:3000"] : [],
          volumes: [],
          network: net,
        })
      );

      return ok(
        [
          `[+] Running ${added.length}/${added.length}`,
          ` ✔ Network ${net}      Created`,
          ...added.map((c) => ` ✔ Container ${c.name}  Started`),
        ].join("\n"),
        {
          ...s,
          networks: s.networks.includes(net) ? s.networks : [...s.networks, net],
          containers: [...containers, ...added],
        }
      );
    }

    default:
      return err(`docker: '${sub ?? ""}' is not a docker command. Type 'help'.`);
  }
}
