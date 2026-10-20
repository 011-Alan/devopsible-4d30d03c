import { parseFlags, tokenize, type ExecResult } from "@/lib/sandbox";

export type Pod = { name: string; app: string; image: string; status: "Running" | "ImagePullBackOff" | "CrashLoopBackOff"; ns: string };
export type Deployment = { name: string; image: string; replicas: number; ns: string; revisions: string[] };
export type Service = { name: string; selector: string; port: number; type: "ClusterIP" | "NodePort" | "LoadBalancer"; ns: string };
export type K8sState = {
  namespaces: string[];
  deployments: Deployment[];
  pods: Pod[];
  services: Service[];
  configmaps: { name: string; data: Record<string, string>; ns: string }[];
  files: Record<string, string>;
  history: string[];
};

const GOOD_IMAGES = /^(nginx|nexa-web|nexa-api|redis|busybox|httpd)(:[\w.-]+)?$/;
const rand = () => Math.random().toString(36).slice(2, 7);

export const emptyK8s = (over: Partial<K8sState> = {}): K8sState => ({
  namespaces: ["default", "kube-system"], deployments: [], pods: [], services: [], configmaps: [], files: {}, history: [], ...over,
});

/** Reconcile: make pods match each deployment's desired state (what the control plane does). */
export function reconcile(s: K8sState): K8sState {
  const pods: Pod[] = s.pods.filter((p) => !p.app || !s.deployments.some((d) => d.name === p.app && d.ns === p.ns) ? !p.app : true);
  const out: Pod[] = pods.filter((p) => !s.deployments.some((d) => d.name === p.app && d.ns === p.ns));
  for (const d of s.deployments) {
    const status: Pod["status"] = GOOD_IMAGES.test(d.image) ? "Running" : "ImagePullBackOff";
    const mine = s.pods.filter((p) => p.app === d.name && p.ns === d.ns && p.image === d.image);
    const keep = mine.slice(0, d.replicas);
    while (keep.length < d.replicas) keep.push({ name: `${d.name}-${rand()}${rand()}`.slice(0, d.name.length + 11), app: d.name, image: d.image, status, ns: d.ns });
    out.push(...keep.map((p) => ({ ...p, status })));
  }
  return { ...s, pods: out };
}

const HELP = `kubectl get pods|deployments|services|nodes|namespaces|configmaps [-n ns]
kubectl create deployment <name> --image=<img> [--replicas=N] [-n ns]
kubectl scale deployment <name> --replicas=N
kubectl expose deployment <name> --port=N [--type=NodePort]
kubectl set image deployment/<name> <container>=<img>
kubectl rollout status|undo|history deployment/<name>
kubectl delete pod|deployment|service <name>
kubectl describe pod <name> | logs <pod>
kubectl create namespace <name> | create configmap <name> --from-literal=k=v
kubectl apply -f <file>   Shell: ls, cat <file>`;

export function runK8s(state: K8sState, raw: string): ExecResult<K8sState> {
  const cmd = raw.trim();
  const s: K8sState = { ...state, history: [...state.history, cmd] };
  const ok = (output: string, next: K8sState = s) => ({ state: next, output });
  const err = (output: string) => ({ state: s, output, error: true });
  const t = tokenize(cmd);
  if (!t.length) return ok("");
  if (t[0] === "help") return ok(HELP);
  if (t[0] === "ls") return ok(Object.keys(s.files).join("  ") || "(empty)");
  if (t[0] === "cat") return s.files[t[1]] ? ok(s.files[t[1]]) : err(`cat: ${t[1]}: No such file`);
  if (t[0] !== "kubectl" && t[0] !== "k") return err(`${t[0]}: command not found. Type 'help'.`);

  const { flags, rest } = parseFlags(t.slice(1), ["-n", "--namespace", "--image", "--replicas", "--port", "--type", "-f", "--from-literal", "-o"]);
  const ns = (flags["-n"] || flags["--namespace"] || "default") as string;
  const allNs = !!flags["-A"] || !!flags["--all-namespaces"];
  const [verb, kindRaw, nameRaw] = rest;
  const kind = (kindRaw ?? "").split("/")[0];
  const name = kindRaw?.includes("/") ? kindRaw.split("/")[1] : nameRaw;
  const is = (k: string, ...alts: string[]) => [k, ...alts].includes(kind);
  if (!s.namespaces.includes(ns) && !(verb === "create" && is("namespace", "ns"))) return err(`Error from server (NotFound): namespaces "${ns}" not found`);
  const dep = (n?: string) => s.deployments.find((d) => d.name === n && d.ns === ns);

  switch (verb) {
    case "version": return ok("Client Version: v1.31.0\nServer Version: v1.31.0+k3s1");
    case "cluster-info": return ok("Kubernetes control plane is running at https://sandbox.devopsible.local:6443");
    case "get": {
      const inNs = <T extends { ns: string }>(xs: T[]) => xs.filter((x) => allNs || x.ns === ns);
      if (is("pods", "pod", "po")) { const ps = inNs(s.pods); return ok(ps.length ? ["NAME".padEnd(28) + "READY   STATUS", ...ps.map((p) => p.name.padEnd(28) + (p.status === "Running" ? "1/1     " : "0/1     ") + p.status)].join("\n") : `No resources found in ${ns} namespace.`); }
      if (is("deployments", "deployment", "deploy")) { const ds = inNs(s.deployments); return ok(ds.length ? ["NAME".padEnd(16) + "READY   IMAGE", ...ds.map((d) => { const r = s.pods.filter((p) => p.app === d.name && p.ns === d.ns && p.status === "Running").length; return d.name.padEnd(16) + `${r}/${d.replicas}`.padEnd(8) + d.image; })].join("\n") : `No resources found in ${ns} namespace.`); }
      if (is("services", "service", "svc")) return ok(["NAME".padEnd(16) + "TYPE".padEnd(14) + "PORT", "kubernetes".padEnd(16) + "ClusterIP".padEnd(14) + "443", ...inNs(s.services).map((v) => v.name.padEnd(16) + v.type.padEnd(14) + v.port + (v.type === "NodePort" ? `:3${String(v.port).padStart(4, "0").slice(-4)}` : ""))].join("\n"));
      if (is("nodes", "node", "no")) return ok("NAME            STATUS   ROLES           VERSION\nsandbox-node-1  Ready    control-plane   v1.31.0+k3s1");
      if (is("namespaces", "namespace", "ns")) return ok(["NAME", ...s.namespaces].join("\n"));
      if (is("configmaps", "configmap", "cm")) return ok(["NAME", ...inNs(s.configmaps).map((c) => c.name)].join("\n"));
      return err(`error: the server doesn't have a resource type "${kind}"`);
    }
    case "create": {
      if (is("namespace", "ns")) { if (!name) return err("namespace name required"); return ok(`namespace/${name} created`, { ...s, namespaces: s.namespaces.includes(name) ? s.namespaces : [...s.namespaces, name] }); }
      if (is("configmap", "cm")) {
        const lit = typeof flags["--from-literal"] === "string" ? (flags["--from-literal"] as string).split("=") : null;
        if (!name || !lit) return err("Usage: kubectl create configmap <name> --from-literal=key=value");
        return ok(`configmap/${name} created`, { ...s, configmaps: [...s.configmaps.filter((c) => !(c.name === name && c.ns === ns)), { name, ns, data: { [lit[0]]: lit[1] } }] });
      }
      if (is("deployment", "deploy")) {
        if (!name || typeof flags["--image"] !== "string") return err("error: required flag(s) \"image\" not set");
        if (dep(name)) return err(`Error from server (AlreadyExists): deployments.apps "${name}" already exists`);
        const replicas = Number(flags["--replicas"] ?? 1);
        return ok(`deployment.apps/${name} created`, reconcile({ ...s, deployments: [...s.deployments, { name, image: flags["--image"] as string, replicas, ns, revisions: [flags["--image"] as string] }] }));
      }
      return err(`error: unknown create target "${kind}"`);
    }
    case "scale": {
      const d = dep(name); if (!d) return err(`Error from server (NotFound): deployments.apps "${name}" not found`);
      const r = Number(flags["--replicas"]); if (Number.isNaN(r)) return err("error: --replicas is required");
      return ok(`deployment.apps/${name} scaled`, reconcile({ ...s, deployments: s.deployments.map((x) => (x === d ? { ...x, replicas: r } : x)) }));
    }
    case "expose": {
      const d = dep(name); if (!d) return err(`Error from server (NotFound): deployments.apps "${name}" not found`);
      const port = Number(flags["--port"]); if (!port) return err("error: couldn't find port via --port flag");
      if (s.services.some((v) => v.name === name && v.ns === ns)) return err(`Error from server (AlreadyExists): services "${name}" already exists`);
      const type = ((flags["--type"] as string) || "ClusterIP") as Service["type"];
      return ok(`service/${name} exposed`, { ...s, services: [...s.services, { name, selector: name, port, type, ns }] });
    }
    case "set": {
      if (kindRaw !== "image") return err("Usage: kubectl set image deployment/<name> <container>=<image>");
      const target = nameRaw?.split("/")[1]; const img = rest[3]?.split("=")[1];
      const d = dep(target); if (!d || !img) return err("Usage: kubectl set image deployment/<name> <container>=<image>");
      return ok(`deployment.apps/${target} image updated`, reconcile({ ...s, deployments: s.deployments.map((x) => (x === d ? { ...x, image: img, revisions: [...x.revisions, img] } : x)) }));
    }
    case "rollout": {
      const target = (nameRaw ?? "").split("/")[1]; const d = dep(target);
      if (!d) return err(`Error from server (NotFound): deployments.apps "${target}" not found`);
      if (kindRaw === "history") return ok(["REVISION  IMAGE", ...d.revisions.map((r, i) => `${String(i + 1).padEnd(10)}${r}`)].join("\n"));
      if (kindRaw === "status") return GOOD_IMAGES.test(d.image) ? ok(`deployment "${target}" successfully rolled out`) : err(`Waiting for deployment "${target}" rollout to finish: 0 of ${d.replicas} updated replicas are available...\nerror: ImagePullBackOff`);
      if (kindRaw === "undo") {
        if (d.revisions.length < 2) return err("error: no rollout history found");
        const revisions = d.revisions.slice(0, -1);
        return ok(`deployment.apps/${target} rolled back`, reconcile({ ...s, deployments: s.deployments.map((x) => (x === d ? { ...x, image: revisions[revisions.length - 1], revisions } : x)) }));
      }
      return err("Usage: kubectl rollout status|history|undo deployment/<name>");
    }
    case "delete": {
      if (is("pod", "pods", "po")) {
        const p = s.pods.find((x) => x.name === name && x.ns === ns); if (!p) return err(`Error from server (NotFound): pods "${name}" not found`);
        return ok(`pod "${name}" deleted`, reconcile({ ...s, pods: s.pods.filter((x) => x !== p) }));
      }
      if (is("deployment", "deploy")) { if (!dep(name)) return err(`Error from server (NotFound): deployments.apps "${name}" not found`); return ok(`deployment.apps "${name}" deleted`, reconcile({ ...s, deployments: s.deployments.filter((x) => !(x.name === name && x.ns === ns)), pods: s.pods.filter((p) => !(p.app === name && p.ns === ns)) })); }
      if (is("service", "svc")) return ok(`service "${name}" deleted`, { ...s, services: s.services.filter((x) => !(x.name === name && x.ns === ns)) });
      return err(`error: unknown delete target "${kind}"`);
    }
    case "describe": {
      const p = s.pods.find((x) => x.name === name && x.ns === ns); if (!p) return err(`Error from server (NotFound): pods "${name}" not found`);
      const events = p.status === "Running" ? "Normal  Started  Started container" : `Warning  Failed  Failed to pull image "${p.image}": not found\nWarning  BackOff  Back-off pulling image "${p.image}"`;
      return ok(`Name: ${p.name}\nNamespace: ${p.ns}\nImage: ${p.image}\nStatus: ${p.status}\nEvents:\n  ${events}`);
    }
    case "logs": {
      const p = s.pods.find((x) => x.name === kindRaw && x.ns === ns); if (!p) return err(`Error from server (NotFound): pods "${kindRaw}" not found`);
      return p.status === "Running" ? ok(`[${p.app}] listening on :80`) : err(`Error: container "${p.app}" is waiting to start: ${p.status}`);
    }
    case "apply": {
      const file = flags["-f"] as string; const y = s.files[file]; if (!y) return err(`error: the path "${file}" does not exist`);
      const kindM = y.match(/^kind:\s*(\w+)/m)?.[1]; const nameM = y.match(/^\s+name:\s*([\w-]+)/m)?.[1];
      if (kindM !== "Deployment" || !nameM) return err("error: only Deployment manifests are supported in this lab");
      const image = y.match(/image:\s*(\S+)/)?.[1] ?? ""; const replicas = Number(y.match(/replicas:\s*(\d+)/)?.[1] ?? 1);
      const nsM = y.match(/namespace:\s*([\w-]+)/)?.[1] ?? ns;
      if (!s.namespaces.includes(nsM)) return err(`Error from server (NotFound): namespaces "${nsM}" not found`);
      const existing = s.deployments.find((d) => d.name === nameM && d.ns === nsM);
      const deployments = existing
        ? s.deployments.map((d) => (d === existing ? { ...d, image, replicas, revisions: d.image === image ? d.revisions : [...d.revisions, image] } : d))
        : [...s.deployments, { name: nameM, image, replicas, ns: nsM, revisions: [image] }];
      return ok(`deployment.apps/${nameM} ${existing ? "configured" : "created"}`, reconcile({ ...s, deployments }));
    }
    default:
      return err(`error: unknown command "${verb ?? ""}" for "kubectl". Type 'help'.`);
  }
}
