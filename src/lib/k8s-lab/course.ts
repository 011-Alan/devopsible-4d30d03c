import type { LabLevel } from "@/lib/sandbox";
import { emptyK8s, reconcile, type K8sState } from "./engine";

const ready = (s: K8sState, name: string, ns = "default") => {
  const d = s.deployments.find((x) => x.name === name && x.ns === ns);
  return !!d && s.pods.filter((p) => p.app === name && p.ns === ns && p.status === "Running").length === d.replicas;
};

const MANIFEST = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nexa-api
  namespace: staging
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: nexa-api
          image: nexa-api:1.4`;

export const k8sLevels: LabLevel<K8sState>[] = [
  {
    id: 1, title: "Meet the Cluster", badge: "Cluster Cadet",
    story: "Nexa is moving off single servers. Your sandbox cluster is up — take a look around before deploying anything.",
    concepts: [
      { term: "Node", meaning: "A machine that runs your workloads." },
      { term: "Namespace", meaning: "A folder-like boundary for resources." },
    ],
    setup: () => emptyK8s(),
    missions: [
      { id: "k1-1", title: "List the nodes", objective: "See which machines are in the cluster.", xp: 50,
        hints: ["kubectl get <resource>", "`kubectl get nodes`"], check: (s) => s.history.some((h) => /get (nodes|node|no)\b/.test(h)) },
      { id: "k1-2", title: "Create a namespace", objective: "Create a namespace called `staging` for the team.", xp: 100,
        hints: ["kubectl create …", "`kubectl create namespace staging`"], check: (s) => s.namespaces.includes("staging") },
    ],
  },
  {
    id: 2, title: "First Deployment", badge: "Deployer",
    story: "Ship the Nexa website to the cluster. Kubernetes should keep it running even if something crashes.",
    concepts: [
      { term: "Pod", meaning: "One or more containers scheduled together." },
      { term: "Deployment", meaning: "Keeps a desired number of identical pods running." },
    ],
    setup: () => emptyK8s(),
    missions: [
      { id: "k2-1", title: "Deploy the site", objective: "Create a deployment `web` using the image `nginx`.", xp: 120,
        hints: ["kubectl create deployment <name> --image=<img>", "`kubectl create deployment web --image=nginx`"], check: (s) => ready(s, "web") },
      { id: "k2-2", title: "Self-healing", objective: "Delete one of web's pods and watch Kubernetes replace it.", xp: 120,
        hints: ["Find the pod name with `kubectl get pods`.", "`kubectl delete pod <pod-name>` then `kubectl get pods` again."],
        check: (s) => s.history.some((h) => /delete (pod|po) web-/.test(h)) && ready(s, "web") },
    ],
  },
  {
    id: 3, title: "Scale Out", badge: "Scaler",
    story: "A newsletter just went out. Traffic is spiking and one pod isn't enough.",
    concepts: [{ term: "Replicas", meaning: "How many copies of the pod the deployment keeps alive." }],
    setup: () => reconcile(emptyK8s({ deployments: [{ name: "web", image: "nginx", replicas: 1, ns: "default", revisions: ["nginx"] }] })),
    missions: [
      { id: "k3-1", title: "Scale to 4", objective: "Run 4 replicas of `web`, all Running.", xp: 150,
        hints: ["kubectl scale …", "`kubectl scale deployment web --replicas=4`"],
        check: (s) => s.deployments.some((d) => d.name === "web" && d.replicas === 4) && ready(s, "web") },
    ],
  },
  {
    id: 4, title: "Open the Doors", badge: "Networker",
    story: "Pods come and go, and their IPs change. Give `web` a stable address customers can reach.",
    concepts: [
      { term: "Service", meaning: "A stable name/IP load-balancing across matching pods." },
      { term: "NodePort", meaning: "Exposes the service on a port of every node." },
    ],
    setup: () => reconcile(emptyK8s({ deployments: [{ name: "web", image: "nginx", replicas: 3, ns: "default", revisions: ["nginx"] }] })),
    missions: [
      { id: "k4-1", title: "Expose web", objective: "Expose `web` on port 80 as a NodePort service.", xp: 160,
        hints: ["kubectl expose deployment …", "`kubectl expose deployment web --port=80 --type=NodePort`"],
        check: (s) => s.services.some((v) => v.name === "web" && v.port === 80 && v.type === "NodePort") },
    ],
  },
  {
    id: 5, title: "The Bad Rollout", badge: "Incident Responder",
    story: "PagerDuty fires: someone set image `nginx:1.99-typo`. The site is down. Diagnose and recover — fast.",
    concepts: [
      { term: "Rolling update", meaning: "Pods are replaced gradually with the new version." },
      { term: "ImagePullBackOff", meaning: "The image can't be pulled — usually a wrong name/tag." },
      { term: "rollout undo", meaning: "Return to the previous revision." },
    ],
    setup: () => reconcile(emptyK8s({ deployments: [{ name: "web", image: "nginx:1.99-typo", replicas: 3, ns: "default", revisions: ["nginx:1.27", "nginx:1.99-typo"] }] })),
    missions: [
      { id: "k5-1", title: "Diagnose", objective: "Describe a failing pod to find out why it won't start.", xp: 120,
        hints: ["kubectl describe pod <name> shows Events.", "`kubectl get pods`, then `kubectl describe pod <web-…>`"], check: (s) => s.history.some((h) => /describe (pod|po) web-/.test(h)) },
      { id: "k5-2", title: "Roll back", objective: "Get all `web` pods Running again on a working image.", xp: 200,
        hints: ["You can undo the last rollout or set a valid image.", "`kubectl rollout undo deployment/web`"], check: (s) => ready(s, "web") },
    ],
  },
  {
    id: 6, title: "Declarative Config", badge: "GitOps Initiate",
    story: "Real teams don't click or type their infra — they commit YAML. Apply the API manifest to staging.",
    concepts: [
      { term: "Manifest", meaning: "YAML describing desired state." },
      { term: "kubectl apply", meaning: "Create or update resources to match the file." },
    ],
    setup: () => emptyK8s({ files: { "api-deployment.yaml": MANIFEST } }),
    missions: [
      { id: "k6-1", title: "Prepare staging", objective: "The manifest targets the `staging` namespace — make sure it exists.", xp: 80,
        hints: ["Read the file with `cat api-deployment.yaml`.", "`kubectl create namespace staging`"], check: (s) => s.namespaces.includes("staging") },
      { id: "k6-2", title: "Apply and scale via YAML", objective: "Edit the manifest to 3 replicas, then apply it so 3 nexa-api pods run in staging.", xp: 200,
        hints: ["Edit `replicas:` in the file panel and save.", "`kubectl apply -f api-deployment.yaml` then `kubectl get pods -n staging`"],
        check: (s) => s.deployments.some((d) => d.name === "nexa-api" && d.ns === "staging" && d.replicas === 3) && ready(s, "nexa-api", "staging") },
    ],
  },
];
