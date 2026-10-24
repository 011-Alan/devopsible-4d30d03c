import { LabLayout } from "@/components/layout/LabLayout";
import { useUserProgress } from "@/lib/progress";
import { Trophy, Award, Sparkles, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProgressPage() {
  const { progress, resetProgress } = useUserProgress();

  const allPossibleBadges = [
    { name: "Container Recruit", path: "Docker", desc: "Ran first Nginx container on port 8080" },
    { name: "Image Architect", path: "Docker", desc: "Constructed custom image from Dockerfile" },
    { name: "Troubleshooter", path: "Docker", desc: "Diagnosed logs and repaired crashing container" },
    { name: "Volume Master", path: "Docker", desc: "Configured persistent storage volume for Postgres" },
    { name: "Network Operator", path: "Docker", desc: "Created custom bridge network with container DNS" },
    { name: "Compose Commander", path: "Docker", desc: "Orchestrated multi-service application with Docker Compose" },
    { name: "Deployment Boss", path: "Docker", desc: "Conquered 3-tier microservices boss battle" },
    { name: "Pipeline Architect", path: "Docker", desc: "Built and tagged multi-stage image for AWS ECR" },
    { name: "Cluster Recruit", path: "Kubernetes", desc: "Inspected EKS nodes, namespaces and pods" },
    { name: "Deployment Engineer", path: "Kubernetes", desc: "Created deployment with 2 replicas" },
    { name: "Scale Master", path: "Kubernetes", desc: "Scaled workloads and tested self-healing" },
    { name: "Service Discovery", path: "Kubernetes", desc: "Exposed workloads with NodePort Service" },
    { name: "Configuration & Secrets", path: "Kubernetes", desc: "Decoupled runtime configuration with ConfigMap" },
    { name: "Troubleshooting Tower", path: "Kubernetes", desc: "Resolved ImagePullBackOff outage with rollout undo" },
    { name: "The Autoscaling Arena", path: "Kubernetes", desc: "Configured Horizontal Pod Autoscaler" },
    { name: "The Production Boss", path: "Kubernetes", desc: "Achieved zero-downtime multi-tier production rollout" },
    { name: "Delivery Pipeline", path: "Kubernetes", desc: "Connected GitOps synchronization to AWS EKS" },
  ];

  return (
    <LabLayout>
      <div className="mx-auto max-w-[1100px] px-6 py-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-400 font-bold">
              OPERATOR PROFILE
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-1">
              Your DevOps Achievements
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Track your validated skills, earned badges, and mastery across cloud-native technologies.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={resetProgress}
            className="self-start md:self-auto border-[#22334e] bg-[#0c1424] text-slate-400 hover:text-rose-400 hover:bg-[#131d33] text-xs font-mono"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-2" />
            Reset Progress
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0b1222] border border-[#1b2742]">
            <div className="text-[11px] font-mono uppercase text-slate-400">OPERATOR LEVEL</div>
            <div className="text-3xl font-extrabold text-amber-400 mt-2 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-400 fill-amber-400/20" />
              LV {String(progress.operatorLevel).padStart(2, "0")}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b1222] border border-[#1b2742]">
            <div className="text-[11px] font-mono uppercase text-slate-400">TOTAL XP EARNED</div>
            <div className="text-3xl font-extrabold text-white mt-2 font-mono">
              {progress.totalXp}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b1222] border border-[#1b2742]">
            <div className="text-[11px] font-mono uppercase text-slate-400">MISSIONS CLEARED</div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              {progress.missionsCleared}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b1222] border border-[#1b2742]">
            <div className="text-[11px] font-mono uppercase text-slate-400">BADGES UNLOCKED</div>
            <div className="text-3xl font-extrabold text-cyan-400 mt-2 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-cyan-400" />
              {progress.badges.length}
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="h-5 w-5 text-cyan-400" />
            Earned Badges & Medals
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allPossibleBadges.map((badge) => {
              const unlocked = progress.badges.some(
                (b) => b.toLowerCase() === badge.name.toLowerCase()
              );

              return (
                <div
                  key={badge.name}
                  className={`p-4 rounded-xl border transition-all ${
                    unlocked
                      ? "bg-[#0d162b] border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                      : "bg-[#090e1a] border-[#162238] opacity-40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm ${
                          unlocked
                            ? "bg-amber-950/80 border border-amber-500/50 text-amber-300"
                            : "bg-slate-900 border border-slate-800 text-slate-600"
                        }`}
                      >
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{badge.name}</div>
                        <div className="text-[10px] font-mono uppercase text-cyan-400">
                          {badge.path} Path
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        unlocked
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-slate-900 text-slate-600 border border-slate-800"
                      }`}
                    >
                      {unlocked ? "UNLOCKED" : "LOCKED"}
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">{badge.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </LabLayout>
  );
}
