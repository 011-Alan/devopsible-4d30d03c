import type { LabLevel } from "@/lib/sandbox";
import { emptyK8s, reconcile, type K8sState } from "./engine";

const ready = (s: K8sState, name: string, ns = "default") => {
  const d = s.deployments.find((x) => x.name === name && x.ns === ns);
  return (
    !!d &&
    s.pods.filter((p) => p.app === name && p.ns === ns && p.status === "Running").length === d.replicas
  );
};

const PROD_MANIFEST = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: prod-api
  namespace: production
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: api
          image: nexa-api:1.0
          ports:
            - containerPort: 3000`;

const GITOPS_MANIFEST = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: eks-delivery
  namespace: default
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: app
          image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/nexa-web:v1
`;

export const k8sLevels: LabLevel<K8sState>[] = [
  {
    id: 1,
    title: "Enter the Kingdom",
    badge: "Cluster Recruit",
    story:
      "Join the team responsible for a live cluster. Inspect its nodes, namespaces and workloads, then open the details of a running pod.",
    concepts: [
      { term: "Node", meaning: "A physical or virtual worker machine hosting Kubernetes pods." },
      { term: "Namespace", meaning: "A virtual cluster inside your Kubernetes cluster for isolating workloads." },
      { term: "Pod", meaning: "The smallest deployable unit of computing in Kubernetes." },
    ],
    setup: () =>
      reconcile(
        emptyK8s({
          deployments: [
            { name: "coredns", image: "coredns:1.10", replicas: 1, ns: "kube-system", revisions: ["coredns:1.10"] },
          ],
          pods: [
            { name: "bootstrap-agent-88x", app: "bootstrap", image: "alpine:latest", status: "Running", ns: "default" },
          ],
        })
      ),
    missions: [
      {
        id: "k1",
        title: "Enter the Kingdom",
        objective: "Inspect nodes, namespaces, and pods in the cluster.",
        xp: 100,
        briefing:
          "Welcome to Nexa's cloud infrastructure. Your sandbox cluster is live on AWS EKS. Explore the cluster hierarchy: nodes, namespaces, and running pods.",
        hints: [
          "List the nodes: `kubectl get nodes`",
          "List namespaces: `kubectl get namespaces`",
          "List pods: `kubectl get pods`",
        ],
        suggested: ["kubectl get nodes", "kubectl get namespaces", "kubectl get pods"],
        checks: [
          {
            label: "Inspect cluster nodes",
            test: (s) => s.history.some((h) => /get (nodes|node|no)\b/.test(h)),
          },
          {
            label: "Inspect cluster namespaces",
            test: (s) => s.history.some((h) => /get (namespaces|namespace|ns)\b/.test(h)),
          },
          {
            label: "Inspect pods in default namespace",
            test: (s) => s.history.some((h) => /get (pods|pod|po)\b/.test(h)),
          },
        ],
        check: (s) =>
          s.history.some((h) => /get (nodes|node|no)\b/.test(h)) &&
          s.history.some((h) => /get (namespaces|namespace|ns)\b/.test(h)) &&
          s.history.some((h) => /get (pods|pod|po)\b/.test(h)),
      },
    ],
  },
  {
    id: 2,
    title: "Deploy Your First Application",
    badge: "Deployment Engineer",
    story: "Create a Deployment that keeps two replicas of a web application running and ready.",
    concepts: [
      { term: "Deployment", meaning: "A declarative controller ensuring desired replicas of pods are running." },
      { term: "Replicas", meaning: "The number of identical pod instances maintained by the ReplicaSet." },
    ],
    setup: () => emptyK8s(),
    missions: [
      {
        id: "k2",
        title: "Deploy Your First Application",
        objective: "Create a deployment named `web` using image `nginx` with 2 replicas.",
        xp: 150,
        briefing:
          "Ship the company portal to the cluster. A Deployment manages pod life cycles automatically, replacing any failed instances.",
        hints: [
          "Use `kubectl create deployment web --image=nginx --replicas=2`.",
          "Check pod status with `kubectl get pods`.",
        ],
        suggested: [
          "kubectl create deployment web --image=nginx --replicas=2",
          "kubectl get deployments",
          "kubectl get pods",
        ],
        checks: [
          {
            label: "Create deployment web with image nginx",
            test: (s) => s.deployments.some((d) => d.name === "web" && d.image.startsWith("nginx")),
          },
          {
            label: "Deployment keeps 2 replicas running and ready",
            test: (s) => ready(s, "web") && s.deployments.find((d) => d.name === "web")?.replicas === 2,
          },
        ],
        check: (s) => ready(s, "web") && s.deployments.find((d) => d.name === "web")?.replicas === 2,
      },
    ],
  },
  {
    id: 3,
    title: "The Replica Challenge",
    badge: "Scale Master",
    story:
      "Traffic is spiking! Scale your deployment dynamically to 5 replicas, and simulate pod failure to verify self-healing.",
    concepts: [
      { term: "kubectl scale", meaning: "Changes the target replica count for an existing Deployment." },
      { term: "Self-healing", meaning: "Kubernetes automatically replaces deleted or crashed pods." },
    ],
    setup: () =>
      reconcile(
        emptyK8s({
          deployments: [{ name: "web", image: "nginx", replicas: 2, ns: "default", revisions: ["nginx"] }],
        })
      ),
    missions: [
      {
        id: "k3",
        title: "The Replica Challenge",
        objective: "Scale `web` to 5 replicas and delete one pod to observe automatic self-healing.",
        xp: 200,
        briefing:
          "Black Friday traffic is hitting the system. Scale the `web` deployment to 5 replicas immediately. Once scaled, delete one of the running pods and verify Kubernetes self-heals by replacing it.",
        hints: [
          "Scale deployment: `kubectl scale deployment web --replicas=5`.",
          "Find a pod name with `kubectl get pods`.",
          "Delete the pod: `kubectl delete pod <pod-name>`.",
        ],
        suggested: ["kubectl scale deployment web --replicas=5", "kubectl get pods", "kubectl delete pod web-"],
        checks: [
          {
            label: "Scale deployment web to 5 replicas",
            test: (s) => s.deployments.some((d) => d.name === "web" && d.replicas === 5),
          },
          {
            label: "Delete a pod to observe self-healing replacement",
            test: (s) => s.history.some((h) => /delete (pod|po) web-/.test(h)) && ready(s, "web"),
          },
        ],
        check: (s) =>
          s.deployments.some((d) => d.name === "web" && d.replicas === 5) &&
          s.history.some((h) => /delete (pod|po) web-/.test(h)) &&
          ready(s, "web"),
      },
    ],
  },
  {
    id: 4,
    title: "Service Discovery",
    badge: "Service Discovery",
    story: "Pods come and go, and their IPs change. Give web a stable address customers can reach with a Service.",
    concepts: [
      { term: "Service", meaning: "A stable DNS name and virtual IP load-balancing across matching pods." },
      { term: "NodePort", meaning: "Exposes the service externally on each node's IP at a static port." },
    ],
    setup: () =>
      reconcile(
        emptyK8s({
          deployments: [{ name: "web", image: "nginx", replicas: 3, ns: "default", revisions: ["nginx"] }],
        })
      ),
    missions: [
      {
        id: "k4",
        title: "Service Discovery",
        objective: "Expose deployment `web` on port 80 as a NodePort service named `web-svc`.",
        xp: 200,
        briefing:
          "Pods are ephemeral and their IP addresses change whenever they restart. Expose our web deployment with a stable Service so traffic can be routed reliably.",
        hints: [
          "Use `kubectl expose deployment web --name=web-svc --port=80 --type=NodePort`.",
          "Check created services with `kubectl get svc`.",
        ],
        suggested: [
          "kubectl expose deployment web --name=web-svc --port=80 --type=NodePort",
          "kubectl get services",
        ],
        checks: [
          {
            label: "Service web-svc created on port 80",
            test: (s) => s.services.some((v) => v.name === "web-svc" && v.port === 80),
          },
          {
            label: "Service type configured as NodePort or LoadBalancer",
            test: (s) =>
              s.services.some(
                (v) => (v.name === "web-svc" || v.selector.includes("web")) && (v.type === "NodePort" || v.type === "LoadBalancer")
              ),
          },
        ],
        check: (s) =>
          s.services.some(
            (v) => (v.name === "web-svc" || v.selector.includes("web")) && v.port === 80
          ),
      },
    ],
  },
  {
    id: 5,
    title: "Configuration & Secrets",
    badge: "Configuration & Secrets",
    story: "Separate code from configuration. Store environment settings in a ConfigMap and sensitive tokens in a Secret.",
    concepts: [
      { term: "ConfigMap", meaning: "Stores non-confidential key-value configuration for pod injection." },
      { term: "12-Factor Config", meaning: "Store configuration in the environment, completely decoupled from image code." },
    ],
    setup: () => emptyK8s(),
    missions: [
      {
        id: "k5",
        title: "Configuration & Secrets",
        objective: "Create ConfigMap `app-config` with `APP_ENV=production`.",
        xp: 200,
        briefing:
          "Never bake environment-specific configuration into container images. Create a ConfigMap called `app-config` with key `APP_ENV` set to `production`.",
        hints: [
          "Create with: `kubectl create configmap app-config --from-literal=APP_ENV=production`.",
          "Verify with: `kubectl get configmaps`.",
        ],
        suggested: [
          "kubectl create configmap app-config --from-literal=APP_ENV=production",
          "kubectl get configmaps",
        ],
        checks: [
          {
            label: "Create ConfigMap app-config with APP_ENV=production",
            test: (s) => s.configmaps.some((c) => c.name === "app-config" && c.data["APP_ENV"] === "production"),
          },
          {
            label: "Verify ConfigMap exists in namespace",
            test: (s) => s.configmaps.some((c) => c.name === "app-config"),
          },
        ],
        check: (s) => s.configmaps.some((c) => c.name === "app-config" && c.data["APP_ENV"] === "production"),
      },
    ],
  },
  {
    id: 6,
    title: "Troubleshooting Tower",
    badge: "Troubleshooting Tower",
    story: "A bad image update has broken production with ImagePullBackOff. Diagnose the event log and perform a rolling undo.",
    concepts: [
      { term: "ImagePullBackOff", meaning: "Kubelet cannot pull the container image due to typo, tag, or auth failure." },
      { term: "kubectl rollout undo", meaning: "Reverts deployment to the previous known good revision." },
    ],
    setup: () =>
      reconcile(
        emptyK8s({
          deployments: [
            {
              name: "web",
              image: "nginx:1.99-nonexistent",
              replicas: 3,
              ns: "default",
              revisions: ["nginx:1.27", "nginx:1.99-nonexistent"],
            },
          ],
        })
      ),
    missions: [
      {
        id: "k6",
        title: "Troubleshooting Tower",
        objective: "Diagnose failing pod with describe, then roll back deployment to restore healthy status.",
        xp: 300,
        briefing:
          "Production outage! An automated deployment deployed a broken image tag `nginx:1.99-nonexistent`. Pods are stuck in `ImagePullBackOff`. Describe the pod to inspect events, then roll back the deployment immediately.",
        hints: [
          "Find pod name with `kubectl get pods`.",
          "Describe pod with `kubectl describe pod web-`.",
          "Roll back deployment: `kubectl rollout undo deployment/web`.",
        ],
        suggested: ["kubectl get pods", "kubectl describe pod web-", "kubectl rollout undo deployment/web"],
        checks: [
          {
            label: "Describe failing pod using kubectl describe pod",
            test: (s) => s.history.some((h) => /describe (pod|po) web-/.test(h)),
          },
          {
            label: "Roll back or update deployment image to working version",
            test: (s) => ready(s, "web"),
          },
          {
            label: "All pods restored to Running status",
            test: (s) => s.pods.filter((p) => p.app === "web" && p.status === "Running").length === 3,
          },
        ],
        check: (s) =>
          s.history.some((h) => /describe (pod|po) web-/.test(h)) &&
          ready(s, "web") &&
          s.pods.filter((p) => p.app === "web" && p.status === "Running").length === 3,
      },
    ],
  },
  {
    id: 7,
    title: "The Autoscaling Arena",
    badge: "The Autoscaling Arena",
    story: "Traffic swings unpredictably. Configure Horizontal Pod Autoscaler (HPA) to scale workloads automatically.",
    concepts: [
      { term: "HPA", meaning: "Horizontal Pod Autoscaler scales pod replicas based on CPU/memory usage." },
      { term: "Target Metrics", meaning: "Thresholds triggering automatic scaling decisions." },
    ],
    setup: () =>
      reconcile(
        emptyK8s({
          deployments: [{ name: "web", image: "nginx:1.27", replicas: 2, ns: "default", revisions: ["nginx:1.27"] }],
        })
      ),
    missions: [
      {
        id: "k7",
        title: "The Autoscaling Arena",
        objective: "Configure HPA for deployment `web` with min 2 and max 8 replicas at 80% CPU.",
        xp: 350,
        briefing:
          "To avoid manual intervention during flash sales, attach an autoscaler to `web`. If average CPU usage exceeds 80%, scale up to a maximum of 8 pods.",
        hints: [
          "Autoscale deployment: `kubectl autoscale deployment web --min=2 --max=8 --cpu-percent=80`.",
          "Inspect HPA with: `kubectl get hpa`.",
        ],
        suggested: [
          "kubectl autoscale deployment web --min=2 --max=8 --cpu-percent=80",
          "kubectl get hpa",
        ],
        checks: [
          {
            label: "Apply HPA resource manifest or autoscale command",
            test: (s) => s.hpa.some((h) => h.targetDeployment === "web"),
          },
          {
            label: "Deployment target configured between 2 and 8 replicas",
            test: (s) => s.hpa.some((h) => h.minReplicas === 2 && h.maxReplicas === 8),
          },
        ],
        check: (s) => s.hpa.some((h) => h.targetDeployment === "web" && h.minReplicas === 2 && h.maxReplicas === 8),
      },
    ],
  },
  {
    id: 8,
    title: "The Production Boss",
    badge: "The Production Boss",
    story: "Boss battle! Deploy multi-tier production architecture to namespace production with zero-downtime rolling update.",
    concepts: [
      { term: "Namespace Isolation", meaning: "Guarantees production workloads are partitioned from staging." },
      { term: "Zero-Downtime Rollout", meaning: "Ensures new pods are Ready before old pods are terminated." },
    ],
    setup: () =>
      emptyK8s({
        files: { "production.yaml": PROD_MANIFEST },
      }),
    missions: [
      {
        id: "k8",
        title: "The Production Boss",
        objective: "Create `production` namespace and apply `production.yaml` with 3 healthy replicas.",
        xp: 500,
        briefing:
          "Boss battle! Set up a secure `production` namespace and apply the multi-replica `production.yaml` manifest. Verify that all 3 replicas become Ready without disruption.",
        hints: [
          "Create namespace: `kubectl create namespace production`.",
          "Apply manifest: `kubectl apply -f production.yaml`.",
          "Verify: `kubectl get pods -n production`.",
        ],
        suggested: [
          "kubectl create namespace production",
          "cat production.yaml",
          "kubectl apply -f production.yaml",
          "kubectl get pods -n production",
        ],
        checks: [
          {
            label: "Create production namespace",
            test: (s) => s.namespaces.includes("production"),
          },
          {
            label: "Apply production manifest with replica sets",
            test: (s) => s.deployments.some((d) => d.name === "prod-api" && d.ns === "production"),
          },
          {
            label: "Verify all 3 replicas are Running in production namespace",
            test: (s) => ready(s, "prod-api", "production"),
          },
        ],
        check: (s) =>
          s.namespaces.includes("production") &&
          s.deployments.some((d) => d.name === "prod-api" && d.ns === "production") &&
          ready(s, "prod-api", "production"),
      },
    ],
  },
  {
    id: 9,
    title: "Delivery Pipeline",
    badge: "Delivery Pipeline",
    story: "Continuous GitOps delivery pipeline on AWS EKS. Apply declarative synchronization manifests to orchestrate deployments.",
    concepts: [
      { term: "GitOps", meaning: "Using Git repositories as the single source of truth for infrastructure." },
      { term: "AWS EKS Cloud Compatibility", meaning: "Deploying enterprise container images from AWS ECR into Amazon EKS." },
    ],
    setup: () =>
      emptyK8s({
        files: { "gitops-sync.yaml": GITOPS_MANIFEST },
      }),
    missions: [
      {
        id: "k9",
        title: "Delivery Pipeline",
        objective: "Apply `gitops-sync.yaml` pulling the AWS ECR container image into the EKS cluster.",
        xp: 240,
        briefing:
          "Complete your journey by connecting GitOps delivery to AWS EKS. Apply `gitops-sync.yaml` which synchronizes container workloads from AWS ECR into the Kubernetes cluster.",
        hints: [
          "Inspect manifest: `cat gitops-sync.yaml`.",
          "Apply manifest: `kubectl apply -f gitops-sync.yaml`.",
          "Verify: `kubectl get deployments`.",
        ],
        suggested: ["cat gitops-sync.yaml", "kubectl apply -f gitops-sync.yaml", "kubectl get deployments", "kubectl get pods"],
        checks: [
          {
            label: "Apply declarative gitops-sync.yaml manifest",
            test: (s) => s.deployments.some((d) => d.name === "eks-delivery"),
          },
          {
            label: "Synchronize cluster state with AWS EKS target",
            test: (s) => ready(s, "eks-delivery"),
          },
        ],
        check: (s) => ready(s, "eks-delivery"),
      },
    ],
  },
];
