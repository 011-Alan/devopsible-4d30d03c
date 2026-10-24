import { parseFlags, tokenize, type ExecResult } from "@/lib/sandbox";

export type Pod = {
  name: string;
  app: string;
  image: string;
  status: "Running" | "ImagePullBackOff" | "CrashLoopBackOff" | "Pending";
  ns: string;
  restarts?: number;
};

export type Deployment = {
  name: string;
  image: string;
  replicas: number;
  ns: string;
  revisions: string[];
};

export type Service = {
  name: string;
  selector: string;
  port: number;
  type: "ClusterIP" | "NodePort" | "LoadBalancer";
  ns: string;
  targetPort?: number;
};

export type HPA = {
  name: string;
  targetDeployment: string;
  minReplicas: number;
  maxReplicas: number;
  targetCPU: number;
  ns: string;
};

export type K8sState = {
  namespaces: string[];
  deployments: Deployment[];
  pods: Pod[];
  services: Service[];
  configmaps: { name: string; data: Record<string, string>; ns: string }[];
  hpa: HPA[];
  files: Record<string, string>;
  history: string[];
};

const GOOD_IMAGES = /^(nginx|nexa-web|nexa-api|redis|busybox|httpd)(:[\w.-]+)?$/;
const rand = () => Math.random().toString(36).slice(2, 7);

export const emptyK8s = (over: Partial<K8sState> = {}): K8sState => ({
  namespaces: ["default", "kube-system"],
  deployments: [],
  pods: [],
  services: [
    { name: "kubernetes", selector: "component=apiserver", port: 443, type: "ClusterIP", ns: "default" },
  ],
  configmaps: [],
  hpa: [],
  files: {},
  history: [],
  ...over,
});

/** Reconcile: make pods match each deployment's desired state */
export function reconcile(s: K8sState): K8sState {
  const standalonePods = s.pods.filter(
    (p) => !p.app || !s.deployments.some((d) => d.name === p.app && d.ns === p.ns)
  );
  const out: Pod[] = [...standalonePods];

  for (const d of s.deployments) {
    const isGood = GOOD_IMAGES.test(d.image) || d.image.includes("amazonaws.com") || d.image.includes("nexa");
    const status: Pod["status"] = isGood ? "Running" : "ImagePullBackOff";
    const existing = s.pods.filter((p) => p.app === d.name && p.ns === d.ns && p.image === d.image);
    const keep = existing.slice(0, d.replicas);

    while (keep.length < d.replicas) {
      keep.push({
        name: `${d.name}-${rand()}${rand()}`.slice(0, d.name.length + 11),
        app: d.name,
        image: d.image,
        status,
        ns: d.ns,
        restarts: 0,
      });
    }

    out.push(...keep.map((p) => ({ ...p, status })));
  }

  return { ...s, pods: out };
}

const HELP = `Available Kubernetes (kubectl) commands:
  kubectl get pods|deployments|services|nodes|namespaces|configmaps|hpa [-n <ns>] [-A]
  kubectl create deployment <name> --image=<image> [--replicas=N] [-n <ns>]
  kubectl scale deployment <name> --replicas=N [-n <ns>]
  kubectl expose deployment <name> --port=N [--type=NodePort|LoadBalancer] [-n <ns>]
  kubectl set image deployment/<name> <container>=<image> [-n <ns>]
  kubectl rollout status|undo|history deployment/<name> [-n <ns>]
  kubectl delete pod|deployment|service <name> [-n <ns>]
  kubectl describe pod <name> [-n <ns>]
  kubectl logs <pod> [-n <ns>]
  kubectl create namespace <name>
  kubectl create configmap <name> --from-literal=key=value [-n <ns>]
  kubectl autoscale deployment <name> --min=N --max=N [--cpu-percent=N] [-n <ns>]
  kubectl apply -f <manifest.yaml>
  kubectl version | cluster-info

Utility commands:
  cat <file>       # View sandbox files
  ls               # List files
  clear            # Clear terminal output
  help             # Show help`;

export function runK8s(state: K8sState, raw: string): ExecResult<K8sState> {
  const cmd = raw.trim();
  const s: K8sState = { ...state, history: [...state.history, cmd] };
  const ok = (output: string, next: K8sState = s) => ({ state: next, output });
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

  if (t[0] !== "kubectl" && t[0] !== "k") {
    return err(`${t[0]}: command not found. Type 'help' for available commands.`);
  }

  const { flags, rest } = parseFlags(t.slice(1), [
    "-n",
    "--namespace",
    "--image",
    "--replicas",
    "--port",
    "--type",
    "-f",
    "--from-literal",
    "--min",
    "--max",
    "--cpu-percent",
  ]);

  const ns = (flags["-n"] || flags["--namespace"] || "default") as string;
  const allNs = !!flags["-A"] || !!flags["--all-namespaces"];
  const [verb, kindRaw, nameRaw] = rest;
  const kind = (kindRaw ?? "").split("/")[0];
  const name = kindRaw?.includes("/") ? kindRaw.split("/")[1] : nameRaw;
  const is = (k: string, ...alts: string[]) => [k, ...alts].includes(kind);

  if (!s.namespaces.includes(ns) && !(verb === "create" && is("namespace", "ns"))) {
    return err(`Error from server (NotFound): namespaces "${ns}" not found`);
  }

  const dep = (n?: string) => s.deployments.find((d) => d.name === n && d.ns === ns);

  switch (verb) {
    case "version":
      return ok(`Client Version: v1.31.0
Kustomize Version: v5.4.2
Server Version: v1.31.0-eks-a502698 (AWS Elastic Kubernetes Service)`);

    case "cluster-info":
      return ok(`Kubernetes control plane is running at https://A5B2C3D4E5.gr7.us-east-1.eks.amazonaws.com
CoreDNS is running at https://A5B2C3D4E5.gr7.us-east-1.eks.amazonaws.com/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy`);

    case "get": {
      const inNs = <T extends { ns: string }>(xs: T[]) => xs.filter((x) => allNs || x.ns === ns);

      if (is("pods", "pod", "po")) {
        const ps = inNs(s.pods);
        if (!ps.length) return ok(`No resources found in ${ns} namespace.`);
        return ok(
          [
            "NAME".padEnd(32) + "READY   STATUS             RESTARTS   AGE",
            ...ps.map(
              (p) =>
                p.name.padEnd(32) +
                (p.status === "Running" ? "1/1     " : "0/1     ") +
                p.status.padEnd(19) +
                String(p.restarts ?? 0).padEnd(11) +
                "4m"
            ),
          ].join("\n")
        );
      }

      if (is("deployments", "deployment", "deploy")) {
        const ds = inNs(s.deployments);
        if (!ds.length) return ok(`No resources found in ${ns} namespace.`);
        return ok(
          [
            "NAME".padEnd(20) + "READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS   IMAGES",
            ...ds.map((d) => {
              const r = s.pods.filter(
                (p) => p.app === d.name && p.ns === d.ns && p.status === "Running"
              ).length;
              return (
                d.name.padEnd(20) +
                `${r}/${d.replicas}`.padEnd(8) +
                `${d.replicas}`.padEnd(13) +
                `${r}`.padEnd(12) +
                "4m    " +
                d.name.padEnd(13) +
                d.image
              );
            }),
          ].join("\n")
        );
      }

      if (is("services", "service", "svc")) {
        const svcs = inNs(s.services);
        return ok(
          [
            "NAME".padEnd(20) + "TYPE".padEnd(16) + "CLUSTER-IP      EXTERNAL-IP        PORT(S)",
            ...svcs.map(
              (v) =>
                v.name.padEnd(20) +
                v.type.padEnd(16) +
                "10.100.42.12    " +
                (v.type === "LoadBalancer" ? "a1b2c3d4-eks.elb.us-east-1.amazonaws.com " : "<none>             ") +
                `${v.port}` +
                (v.type === "NodePort" ? `:3${String(v.port).padStart(4, "0").slice(-4)}/TCP` : "/TCP")
            ),
          ].join("\n")
        );
      }

      if (is("nodes", "node", "no")) {
        return ok(`NAME                                                STATUS   ROLES           AGE   VERSION
ip-192-168-10-142.ec2.internal                      Ready    control-plane   14d   v1.31.0-eks-a502698
ip-192-168-11-205.ec2.internal (aws-eks-worker)     Ready    node            14d   v1.31.0-eks-a502698
ip-192-168-12-88.ec2.internal  (aws-eks-worker)     Ready    node            14d   v1.31.0-eks-a502698`);
      }

      if (is("namespaces", "namespace", "ns")) {
        return ok(
          [
            "NAME".padEnd(20) + "STATUS   AGE",
            ...s.namespaces.map((n) => n.padEnd(20) + "Active   14d"),
          ].join("\n")
        );
      }

      if (is("configmaps", "configmap", "cm")) {
        const cms = inNs(s.configmaps);
        if (!cms.length) return ok(`No resources found in ${ns} namespace.`);
        return ok(
          [
            "NAME".padEnd(25) + "DATA   AGE",
            ...cms.map((c) => c.name.padEnd(25) + `${Object.keys(c.data).length}`.padEnd(7) + "2m"),
          ].join("\n")
        );
      }

      if (is("hpa")) {
        const hpas = inNs(s.hpa);
        if (!hpas.length) return ok(`No resources found in ${ns} namespace.`);
        return ok(
          [
            "NAME".padEnd(20) + "REFERENCE".padEnd(24) + "TARGETS   MINPODS   MAXPODS   REPLICAS   AGE",
            ...hpas.map(
              (h) =>
                h.name.padEnd(20) +
                `Deployment/${h.targetDeployment}`.padEnd(24) +
                `${h.targetCPU}%/80%   `.padEnd(10) +
                `${h.minReplicas}`.padEnd(10) +
                `${h.maxReplicas}`.padEnd(10) +
                "2         2m"
            ),
          ].join("\n")
        );
      }

      return err(`error: the server doesn't have a resource type "${kind}"`);
    }

    case "create": {
      if (is("namespace", "ns")) {
        if (!name) return err("namespace name required");
        return ok(`namespace/${name} created`, {
          ...s,
          namespaces: s.namespaces.includes(name) ? s.namespaces : [...s.namespaces, name],
        });
      }

      if (is("configmap", "cm")) {
        const lit =
          typeof flags["--from-literal"] === "string"
            ? (flags["--from-literal"] as string).split("=")
            : null;
        if (!name || !lit) return err("Usage: kubectl create configmap <name> --from-literal=key=value");
        return ok(`configmap/${name} created`, {
          ...s,
          configmaps: [
            ...s.configmaps.filter((c) => !(c.name === name && c.ns === ns)),
            { name, ns, data: { [lit[0]]: lit[1] || "" } },
          ],
        });
      }

      if (is("deployment", "deploy")) {
        if (!name || typeof flags["--image"] !== "string") {
          return err('error: required flag(s) "image" not set');
        }
        if (dep(name)) return err(`Error from server (AlreadyExists): deployments.apps "${name}" already exists`);
        const replicas = Number(flags["--replicas"] ?? 2);
        const image = flags["--image"] as string;
        return ok(
          `deployment.apps/${name} created`,
          reconcile({
            ...s,
            deployments: [
              ...s.deployments,
              { name, image, replicas, ns, revisions: [image] },
            ],
          })
        );
      }

      return err(`error: unknown create target "${kind}"`);
    }

    case "scale": {
      const d = dep(name);
      if (!d) return err(`Error from server (NotFound): deployments.apps "${name}" not found`);
      const r = Number(flags["--replicas"]);
      if (Number.isNaN(r)) return err("error: --replicas is required");
      return ok(
        `deployment.apps/${name} scaled`,
        reconcile({
          ...s,
          deployments: s.deployments.map((x) => (x === d ? { ...x, replicas: r } : x)),
        })
      );
    }

    case "expose": {
      const d = dep(name);
      if (!d) return err(`Error from server (NotFound): deployments.apps "${name}" not found`);
      const port = Number(flags["--port"]);
      if (!port) return err("error: --port is required");
      const svcType = (flags["--type"] as "ClusterIP" | "NodePort" | "LoadBalancer") || "ClusterIP";
      const svcName = (flags["--name"] as string) || `${name}-svc`;

      return ok(`service/${svcName} exposed`, {
        ...s,
        services: [
          ...s.services.filter((x) => !(x.name === svcName && x.ns === ns)),
          { name: svcName, selector: `app=${name}`, port, type: svcType, ns },
        ],
      });
    }

    case "autoscale": {
      const d = dep(name);
      if (!d) return err(`Error from server (NotFound): deployments.apps "${name}" not found`);
      const min = Number(flags["--min"] ?? 2);
      const max = Number(flags["--max"] ?? 8);
      const cpu = Number(flags["--cpu-percent"] ?? 80);
      return ok(`horizontalpodautoscaler.autoscaling/${name} autoscaled`, {
        ...s,
        hpa: [
          ...s.hpa.filter((h) => !(h.name === name && h.ns === ns)),
          { name, targetDeployment: name, minReplicas: min, maxReplicas: max, targetCPU: cpu, ns },
        ],
      });
    }

    case "set": {
      if (kind === "image" && rest[1]?.startsWith("deployment/")) {
        const depName = rest[1].split("/")[1];
        const d = dep(depName);
        if (!d) return err(`Error from server (NotFound): deployments.apps "${depName}" not found`);
        const imgPair = rest[2] ?? "";
        const newImg = imgPair.includes("=") ? imgPair.split("=")[1] : imgPair;
        if (!newImg) return err("Usage: kubectl set image deployment/<name> <container>=<image>");

        return ok(
          `deployment.apps/${depName} image updated`,
          reconcile({
            ...s,
            deployments: s.deployments.map((x) =>
              x === d ? { ...x, image: newImg, revisions: [...x.revisions, newImg] } : x
            ),
          })
        );
      }
      return err("Usage: kubectl set image deployment/<name> <container>=<image>");
    }

    case "rollout": {
      const depName = nameRaw?.split("/")[1] || nameRaw || "";
      const d = dep(depName);
      if (!d) return err(`Error from server (NotFound): deployments.apps "${depName}" not found`);

      if (kindRaw === "status") {
        return ok(`deployment "${depName}" successfully rolled out`);
      }

      if (kindRaw === "history") {
        return ok(
          [
            `deployment.apps/${depName}`,
            "REVISION  CHANGE-CAUSE",
            ...d.revisions.map((rev, idx) => `${idx + 1}         kubectl set image (image=${rev})`),
          ].join("\n")
        );
      }

      if (kindRaw === "undo") {
        if (d.revisions.length <= 1) return ok(`deployment.apps/${depName} rolled back (no prior revisions)`);
        const prevImg = d.revisions[d.revisions.length - 2] || "nginx:1.27";
        return ok(
          `deployment.apps/${depName} rolled back to revision ${d.revisions.length - 1}`,
          reconcile({
            ...s,
            deployments: s.deployments.map((x) =>
              x === d ? { ...x, image: prevImg, revisions: [...x.revisions, prevImg] } : x
            ),
          })
        );
      }
      return err("Usage: kubectl rollout status|undo|history deployment/<name>");
    }

    case "delete": {
      if (is("pod", "po")) {
        const p = s.pods.find((x) => x.name === name && x.ns === ns);
        if (!p) return err(`Error from server (NotFound): pods "${name}" not found`);
        const next = reconcile({ ...s, pods: s.pods.filter((x) => x !== p) });
        return ok(`pod "${name}" deleted`, next);
      }
      if (is("deployment", "deploy")) {
        const d = dep(name);
        if (!d) return err(`Error from server (NotFound): deployments.apps "${name}" not found`);
        return ok(
          `deployment.apps "${name}" deleted`,
          reconcile({ ...s, deployments: s.deployments.filter((x) => x !== d) })
        );
      }
      if (is("service", "svc")) {
        return ok(`service "${name}" deleted`, {
          ...s,
          services: s.services.filter((x) => !(x.name === name && x.ns === ns)),
        });
      }
      return err(`error: cannot delete resource ${kind}`);
    }

    case "describe": {
      if (is("pod", "po")) {
        const p = s.pods.find((x) => x.name.startsWith(name || "") && x.ns === ns);
        if (!p) return err(`Error from server (NotFound): pods "${name}" not found`);
        return ok(`Name:         ${p.name}
Namespace:    ${p.ns}
Priority:     0
Node:         ip-192-168-11-205.ec2.internal/192.168.11.205
Status:       ${p.status}
IP:           10.244.1.42
Containers:
  ${p.app || "app"}:
    Container ID:   containerd://9a8b7c6d5e4f
    Image:          ${p.image}
    State:          ${p.status === "Running" ? "Running" : "Waiting"}
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  4m                 default-scheduler  Successfully assigned ${p.ns}/${p.name}
  ${p.status === "Running" ? "Normal   Pulled     3m                 kubelet            Container image pulled successfully\n  Normal   Created    3m                 kubelet            Created container\n  Normal   Started    3m                 kubelet            Started container" : "Warning  Failed     3m                 kubelet            Failed to pull image \"" + p.image + "\": rpc error: not found\n  Warning  Failed     3m                 kubelet            Error: ImagePullBackOff"}`);
      }
      return err("Usage: kubectl describe pod <name>");
    }

    case "logs": {
      const p = s.pods.find((x) => x.name.startsWith(kindRaw || "") && x.ns === ns);
      if (!p) return err(`Error from server (NotFound): pods "${kindRaw}" not found`);
      return ok(`[${p.name}] Server started listening on 0.0.0.0:80
[${p.name}] Ready for traffic`);
    }

    case "apply": {
      const fileArg = flags["-f"] as string;
      if (!fileArg) return err('error: required flag(s) "-f" not set');
      const content = s.files[fileArg] || s.files["deployment.yaml"] || s.files["production.yaml"] || s.files["gitops-sync.yaml"];
      if (!content) return err(`error: the path "${fileArg}" does not exist`);

      // Parse YAML manifests (name, kind, namespace)
      const nameMatch = content.match(/name:\s*([\w-]+)/);
      const kindMatch = content.match(/kind:\s*(\w+)/);
      const nsMatch = content.match(/namespace:\s*([\w-]+)/);
      const resKind = kindMatch ? kindMatch[1].toLowerCase() : "deployment";
      const resName = nameMatch ? nameMatch[1] : "applied-resource";
      const targetNs = nsMatch ? nsMatch[1] : ns;

      let nextState = s;
      if (!nextState.namespaces.includes(targetNs)) {
        nextState = { ...nextState, namespaces: [...nextState.namespaces, targetNs] };
      }

      if (resKind === "deployment") {
        const imageMatch = content.match(/image:\s*([\w.:/-]+)/);
        const replicasMatch = content.match(/replicas:\s*(\d+)/);
        const img = imageMatch ? imageMatch[1] : "nginx:1.27";
        const rep = replicasMatch ? Number(replicasMatch[1]) : 2;

        const existing = nextState.deployments.find((d) => d.name === resName && d.ns === targetNs);
        const updatedDeployments = existing
          ? nextState.deployments.map((d) => (d === existing ? { ...d, image: img, replicas: rep } : d))
          : [...nextState.deployments, { name: resName, image: img, replicas: rep, ns: targetNs, revisions: [img] }];

        nextState = reconcile({ ...nextState, deployments: updatedDeployments });
      }

      return ok(`${resKind}.apps/${resName} configured`, nextState);
    }

    default:
      return err(`kubectl: '${verb ?? ""}' is not a kubectl command. Type 'help'.`);
  }
}
