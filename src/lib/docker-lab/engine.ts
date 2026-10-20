import { parseFlags, tokenize, type ExecResult } from "@/lib/sandbox";

export type Container = { id: string; name: string; image: string; status: "running" | "exited"; ports: string[]; volumes: string[]; network: string };
export type DockerState = {
  images: string[];
  registry: string[];
  containers: Container[];
  volumes: string[];
  networks: string[];
  files: Record<string, string>;
  history: string[];
};

export const emptyDocker = (over: Partial<DockerState> = {}): DockerState => ({
  images: [],
  registry: ["nginx:latest", "nginx:alpine", "node:20-alpine", "postgres:16", "redis:7", "hello-world:latest", "alpine:latest"],
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

const HELP = `Available: docker version | images | pull <img> | run [-d] [--name n] [-p h:c] [-v vol:/path] [--network n] <img>
ps [-a] | stop|start|rm <name> | logs <name> | exec <name> <cmd> | build -t <name:tag> .
volume create|ls <name> | network create|ls <name> | compose up -d | compose down
Shell: ls, cat <file>, clear`;

export function runDocker(state: DockerState, raw: string): ExecResult<DockerState> {
  const cmd = raw.trim();
  const s: DockerState = { ...state, history: [...state.history, cmd] };
  const ok = (output: string, next: DockerState = s) => ({ state: next, output });
  const err = (output: string) => ({ state: s, output, error: true });
  const t = tokenize(cmd);
  if (!t.length) return ok("");
  if (t[0] === "help") return ok(HELP);
  if (t[0] === "ls") return ok(Object.keys(s.files).join("  ") || "(empty)");
  if (t[0] === "cat") return s.files[t[1]] ? ok(s.files[t[1]]) : err(`cat: ${t[1]}: No such file`);
  if (t[0] !== "docker") return err(`${t[0]}: command not found. Type 'help'.`);

  const find = (n: string) => s.containers.find((c) => c.name === n || c.id.startsWith(n));
  const [sub, ...args] = t.slice(1);

  switch (sub) {
    case "version":
    case "--version":
      return ok("Docker version 27.0.3, build devopsible-sandbox\nServer: Docker Engine - Community 27.0.3");
    case "images":
      return ok(["REPOSITORY          TAG", ...s.images.map((i) => i.split(":").map((p, k) => (k ? p : p.padEnd(20))).join(""))].join("\n"));
    case "pull": {
      const img = tagOf(args[0] ?? "");
      if (!args[0]) return err("docker pull requires an image");
      if (!s.registry.includes(img)) return err(`Error: pull access denied for ${img}, repository does not exist`);
      const images = s.images.includes(img) ? s.images : [...s.images, img];
      return ok(`${img.split(":")[1]}: Pulling from library/${img.split(":")[0]}\nStatus: Downloaded newer image for ${img}`, { ...s, images });
    }
    case "run": {
      const { flags, rest } = parseFlags(args, ["--name", "-p", "-v", "--network", "-e"]);
      const imgArg = rest[0];
      if (!imgArg) return err("docker run requires an image");
      const img = tagOf(imgArg);
      let images = s.images;
      let pre = "";
      if (!images.includes(img)) {
        if (!s.registry.includes(img)) return err(`Unable to find image '${img}' locally\nError: repository does not exist`);
        images = [...images, img];
        pre = `Unable to find image '${img}' locally\nStatus: Downloaded newer image for ${img}\n`;
      }
      const name = typeof flags["--name"] === "string" ? (flags["--name"] as string) : `${img.split(":")[0].replace(/\W/g, "_")}_${s.containers.length + 1}`;
      if (find(name)) return err(`Error: container name "${name}" is already in use`);
      const network = typeof flags["--network"] === "string" ? (flags["--network"] as string) : "bridge";
      if (!s.networks.includes(network)) return err(`Error: network ${network} not found`);
      const vol = typeof flags["-v"] === "string" ? (flags["-v"] as string) : null;
      let volumes = s.volumes;
      if (vol) { const v = vol.split(":")[0]; if (!v.startsWith("/") && !volumes.includes(v)) volumes = [...volumes, v]; }
      const oneShot = img.startsWith("hello-world");
      const c: Container = {
        id: newId(), name, image: img, status: oneShot || !flags["-d"] ? (oneShot ? "exited" : "running") : "running",
        ports: typeof flags["-p"] === "string" ? [flags["-p"] as string] : [], volumes: vol ? [vol] : [], network,
      };
      const out = oneShot ? "Hello from Docker!\nThis message shows that your installation appears to be working correctly." : flags["-d"] ? c.id : `${name} started (attached). Use -d to run in background.`;
      return ok(pre + out, { ...s, images, volumes, containers: [...s.containers, c] });
    }
    case "ps": {
      const all = args.includes("-a");
      const list = s.containers.filter((c) => all || c.status === "running");
      return ok(["CONTAINER ID   IMAGE                STATUS     PORTS          NAMES",
        ...list.map((c) => `${c.id.slice(0, 12).padEnd(15)}${c.image.padEnd(21)}${(c.status === "running" ? "Up" : "Exited").padEnd(11)}${(c.ports.join(",") || "-").padEnd(15)}${c.name}`)].join("\n"));
    }
    case "stop":
    case "start": {
      const c = find(args[0] ?? "");
      if (!c) return err(`Error: No such container: ${args[0]}`);
      const status = sub === "stop" ? "exited" : "running";
      return ok(c.name, { ...s, containers: s.containers.map((x) => (x === c ? { ...x, status } : x)) });
    }
    case "rm": {
      const force = args.includes("-f");
      const c = find(args.filter((a) => a !== "-f")[0] ?? "");
      if (!c) return err(`Error: No such container: ${args[0]}`);
      if (c.status === "running" && !force) return err(`Error: cannot remove running container ${c.name}. Stop it first or use -f`);
      return ok(c.name, { ...s, containers: s.containers.filter((x) => x !== c) });
    }
    case "logs": {
      const c = find(args[0] ?? "");
      if (!c) return err(`Error: No such container: ${args[0]}`);
      if (c.image.startsWith("nexa-api")) return ok("> nexa-api@1.0.0 start\nListening on :3000\nGET /health 200");
      if (c.image.startsWith("nginx")) return ok('/docker-entrypoint.sh: Configuration complete; ready for start up\n172.17.0.1 - "GET / HTTP/1.1" 200');
      return ok(`${c.name}: no recent output`);
    }
    case "exec": {
      const c = find(args.filter((a) => !a.startsWith("-"))[0] ?? "");
      if (!c) return err(`Error: No such container: ${args[0]}`);
      if (c.status !== "running") return err(`Error: container ${c.name} is not running`);
      return ok(`(inside ${c.name}) ${args.slice(1).filter((a) => !a.startsWith("-")).slice(1).join(" ") || "sh"} executed`);
    }
    case "build": {
      const { flags, rest } = parseFlags(args, ["-t"]);
      if (rest[0] !== ".") return err("docker build needs a context, e.g. `docker build -t nexa-api:1.0 .`");
      const df = s.files["Dockerfile"];
      if (!df) return err("ERROR: failed to read dockerfile: open Dockerfile: no such file");
      if (!/^FROM\s+\S+/m.test(df)) return err("ERROR: Dockerfile must start with a FROM instruction");
      if (!/^CMD\s+/m.test(df)) return err("ERROR: Dockerfile has no CMD — the container would not know what to run");
      const tag = tagOf(typeof flags["-t"] === "string" ? (flags["-t"] as string) : "untitled");
      const steps = df.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
      return ok([...steps.map((l, i) => `#${i + 1} [${i + 1}/${steps.length}] ${l}`), `=> naming to docker.io/library/${tag}`].join("\n"),
        { ...s, images: s.images.includes(tag) ? s.images : [...s.images, tag], registry: [...s.registry, tag] });
    }
    case "volume": {
      if (args[0] === "ls") return ok(["DRIVER    VOLUME NAME", ...s.volumes.map((v) => `local     ${v}`)].join("\n"));
      if (args[0] === "create" && args[1]) return ok(args[1], { ...s, volumes: s.volumes.includes(args[1]) ? s.volumes : [...s.volumes, args[1]] });
      return err("Usage: docker volume create|ls <name>");
    }
    case "network": {
      if (args[0] === "ls") return ok(["NAME", ...s.networks].join("\n"));
      if (args[0] === "create" && args[1]) return ok(newId(), { ...s, networks: s.networks.includes(args[1]) ? s.networks : [...s.networks, args[1]] });
      return err("Usage: docker network create|ls <name>");
    }
    case "compose": {
      const file = s.files["compose.yaml"];
      if (!file) return err("no configuration file provided: not found (compose.yaml)");
      if (args[0] === "down") return ok("Containers stopped and removed", { ...s, containers: s.containers.filter((c) => !c.name.startsWith("nexa-")) });
      if (args[0] !== "up") return err("Usage: docker compose up -d | down");
      const services = [...file.matchAll(/^\s{2}(\w[\w-]*):\s*\n\s{4}(?:image|build):\s*(\S+)/gm)];
      if (!services.length) return err("compose.yaml has no services");
      const net = "nexa_default";
      const containers = s.containers.filter((c) => !c.name.startsWith("nexa-"));
      const added = services.map(([, name, img]) => ({ id: newId(), name: `nexa-${name}-1`, image: img === "." ? "nexa-api:1.0" : tagOf(img), status: "running" as const, ports: [], volumes: [], network: net }));
      return ok(["[+] Running " + added.length + "/" + added.length, ...added.map((c) => ` ✔ Container ${c.name}  Started`)].join("\n"),
        { ...s, networks: s.networks.includes(net) ? s.networks : [...s.networks, net], containers: [...containers, ...added] });
    }
    default:
      return err(`docker: '${sub ?? ""}' is not a docker command. Type 'help'.`);
  }
}
