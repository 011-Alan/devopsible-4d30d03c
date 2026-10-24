import { Link } from "react-router-dom";
import { LabLayout } from "@/components/layout/LabLayout";
import { useUserProgress } from "@/lib/progress";
import { levels as gitLevels } from "@/lib/git-sim/levels";
import { jenkinsLevels } from "@/lib/jenkins-lab/course";
import { dockerLevels } from "@/lib/docker-lab/course";
import { k8sLevels } from "@/lib/k8s-lab/course";
import { Play, Check, Lock, ArrowRight, GitBranch, Settings2 } from "lucide-react";

export default function Dashboard() {
  const { progress } = useUserProgress();

  const gitCompletedCount = Object.values(progress.git?.levels || {}).filter(
    (l) => l.status === "completed"
  ).length;

  const jenkinsCompletedCount = Object.values(progress.jenkins?.levels || {}).filter(
    (l) => l.status === "completed"
  ).length;

  const dockerCompletedCount = Object.values(progress.docker.levels).filter(
    (l) => l.status === "completed"
  ).length;

  const k8sCompletedCount = Object.values(progress.kubernetes.levels).filter(
    (l) => l.status === "completed"
  ).length;

  const gitTotalXp = 1450;
  const jenkinsTotalXp = 2500;
  const dockerTotalXp = 1820;
  const k8sTotalXp = 2240;

  const gitXpPercent = Math.min(100, ((progress.git?.earnedXp || 0) / gitTotalXp) * 100);
  const jenkinsXpPercent = Math.min(100, ((progress.jenkins?.earnedXp || 0) / jenkinsTotalXp) * 100);
  const dockerXpPercent = Math.min(100, (progress.docker.earnedXp / dockerTotalXp) * 100);
  const k8sXpPercent = Math.min(100, (progress.kubernetes.earnedXp / k8sTotalXp) * 100);

  return (
    <LabLayout>
      <div className="mx-auto max-w-[1340px] px-6 py-12 space-y-12">
        {/* Hero Section */}
        <div className="space-y-4 max-w-3xl">
          <div className="font-mono text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase">
            LEARN DEVOPS BY DOING
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
            Your learning path
          </h1>
          <p className="text-slate-300 text-base md:text-[17px] leading-relaxed">
            Real Git, Jenkins, Docker, and Kubernetes practice, straight from the browser. Nothing to install, no
            local setup, no throwaway project — you work inside disposable lab environments, and the
            platform inspects the actual state of each environment before awarding XP and badges.
          </p>

          {/* Terminal Command Callout */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#080d1a] border border-[#1e2a44] font-mono text-[13.5px] shadow-lg">
              <span className="text-emerald-400 font-semibold">student@devopsible:~/lab$</span>
              <span className="text-slate-200">
                docker run -d --name web-lab -p 8080:80 nginx
              </span>
              <span className="inline-block w-2.5 h-4 bg-cyan-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0b1222]/80 border border-[#1b2742] shadow-sm backdrop-blur">
            <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-400 font-medium">
              OPERATOR LEVEL
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white tracking-tight">
              {String(progress.operatorLevel).padStart(2, "0")}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {progress.totalXp % 1000} / 1000 XP to next
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b1222]/80 border border-[#1b2742] shadow-sm backdrop-blur">
            <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-400 font-medium">
              TOTAL XP EARNED
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white tracking-tight font-mono">
              {progress.totalXp}
            </div>
            <div className="mt-1 text-xs text-slate-400">Awarded by validated missions</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b1222]/80 border border-[#1b2742] shadow-sm backdrop-blur">
            <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-400 font-medium">
              MISSIONS CLEARED
            </div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
              {progress.missionsCleared}
            </div>
            <div className="mt-1 text-xs text-slate-400">Across all 4 learning paths</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b1222]/80 border border-[#1b2742] shadow-sm backdrop-blur">
            <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-400 font-medium">
              BADGES EARNED
            </div>
            <div className="mt-2 text-3xl font-extrabold text-cyan-400 tracking-tight font-mono">
              {progress.badges.length}
            </div>
            <div className="mt-1 text-xs text-slate-400">One per level boss</div>
          </div>
        </div>

        {/* 4 Core DevOps Tools Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Core DevOps Toolpaths
            </h2>
            <span className="text-xs font-mono text-slate-400">4 Active Tracks</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Git Workflow Path Card */}
            <div className="p-7 rounded-2xl bg-[#0a1020]/90 border border-[#1c2947] flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-slate-400">
                    LEARNING PATH
                  </span>
                  <span className="px-3 py-0.5 rounded-full text-xs font-mono bg-[#162238] border border-[#2b3a5a] text-orange-300">
                    {gitCompletedCount}/8
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-orange-950/80 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                    <GitBranch className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Git Flow</h2>
                    <p className="text-xs text-slate-400">Version Control & Branching Mastery</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center text-xs font-mono mb-2">
                    <span className="text-slate-400">PATH XP</span>
                    <span className="text-slate-200">
                      {progress.git?.earnedXp || 0} / {gitTotalXp.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500 rounded-full"
                      style={{ width: `${gitXpPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-7 space-y-3.5">
                  {gitLevels.slice(0, 5).map((lvl) => {
                    const state = progress.git?.levels[lvl.id] || {
                      status: lvl.id === 1 ? "in_progress" : "locked",
                      earnedXp: 0,
                    };
                    const missionXp = lvl.missions.reduce((a, b) => a + b.xp, 0);

                    return (
                      <Link
                        key={lvl.id}
                        to={`/learn/git/course?level=${lvl.id}`}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                          state.status === "locked"
                            ? "opacity-50 pointer-events-none"
                            : "hover:bg-[#131c33] cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs ${
                              state.status === "completed"
                                ? "bg-emerald-950/70 border border-emerald-500/50 text-emerald-400"
                                : state.status === "in_progress"
                                ? "bg-amber-950/60 border border-amber-500/40 text-amber-400"
                                : "bg-slate-900 border border-slate-800 text-slate-500"
                            }`}
                          >
                            {state.status === "completed" ? (
                              <Check className="h-4 w-4" />
                            ) : state.status === "locked" ? (
                              <Lock className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5 fill-current" />
                            )}
                          </div>
                          <div>
                            <div className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400">
                              LEVEL {String(lvl.id).padStart(2, "0")}
                            </div>
                            <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                              <span>{lvl.emoji}</span>
                              <span>{lvl.title}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-mono text-slate-400">+{missionXp} XP</span>
                          {state.status === "completed" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                              COMPLETED
                            </span>
                          )}
                          {state.status === "in_progress" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-400 border border-amber-800/40">
                              IN PROGRESS
                            </span>
                          )}
                          {state.status === "locked" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-500 border border-slate-800">
                              LOCKED
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#1a2744]">
                <Link
                  to="/learn/git"
                  className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-orange-950/30 hover:bg-orange-900/40 border border-orange-500/40 hover:border-orange-400 text-orange-300 font-medium text-sm transition-all"
                >
                  <span>Continue Git Flow</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* 2. Jenkins Factory Path Card */}
            <div className="p-7 rounded-2xl bg-[#0a1020]/90 border border-[#1c2947] flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-slate-400">
                    LEARNING PATH
                  </span>
                  <span className="px-3 py-0.5 rounded-full text-xs font-mono bg-[#162238] border border-[#2b3a5a] text-blue-300">
                    {jenkinsCompletedCount}/10
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <Settings2 className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Jenkins Factory</h2>
                    <p className="text-xs text-slate-400">Continuous Integration & Delivery Automation</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center text-xs font-mono mb-2">
                    <span className="text-slate-400">PATH XP</span>
                    <span className="text-slate-200">
                      {progress.jenkins?.earnedXp || 0} / {jenkinsTotalXp.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 rounded-full"
                      style={{ width: `${jenkinsXpPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-7 space-y-3.5">
                  {jenkinsLevels.slice(0, 5).map((lvl) => {
                    const state = progress.jenkins?.levels[lvl.id] || {
                      status: lvl.id === 1 ? "unlocked" : "locked",
                      earnedXp: 0,
                    };
                    const missionXp = lvl.missions.reduce((a, b) => a + b.xp, 0);

                    return (
                      <Link
                        key={lvl.id}
                        to={`/learn/jenkins/lab/${lvl.id}`}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                          state.status === "locked"
                            ? "opacity-50 pointer-events-none"
                            : "hover:bg-[#131c33] cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs ${
                              state.status === "completed"
                                ? "bg-emerald-950/70 border border-emerald-500/50 text-emerald-400"
                                : state.status === "unlocked"
                                ? "bg-cyan-950/60 border border-cyan-500/40 text-cyan-400"
                                : "bg-slate-900 border border-slate-800 text-slate-500"
                            }`}
                          >
                            {state.status === "completed" ? (
                              <Check className="h-4 w-4" />
                            ) : state.status === "locked" ? (
                              <Lock className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5 fill-current" />
                            )}
                          </div>
                          <div>
                            <div className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400">
                              LEVEL {String(lvl.id).padStart(2, "0")}
                            </div>
                            <div className="text-sm font-semibold text-slate-100">{lvl.title}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-mono text-slate-400">+{missionXp} XP</span>
                          {state.status === "completed" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                              COMPLETED
                            </span>
                          )}
                          {state.status === "unlocked" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                              UNLOCKED
                            </span>
                          )}
                          {state.status === "locked" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-500 border border-slate-800">
                              LOCKED
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#1a2744]">
                <Link
                  to="/learn/jenkins"
                  className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-blue-950/30 hover:bg-blue-900/40 border border-blue-500/40 hover:border-blue-400 text-blue-300 font-medium text-sm transition-all"
                >
                  <span>Continue Jenkins</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* 3. Docker Quest Path Card */}
            <div className="p-7 rounded-2xl bg-[#0a1020]/90 border border-[#1c2947] flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-slate-400">
                    LEARNING PATH
                  </span>
                  <span className="px-3 py-0.5 rounded-full text-xs font-mono bg-[#162238] border border-[#2b3a5a] text-cyan-300">
                    {dockerCompletedCount}/8
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    🐳
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Docker Quest</h2>
                    <p className="text-xs text-slate-400">Become a Container Engineer</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center text-xs font-mono mb-2">
                    <span className="text-slate-400">PATH XP</span>
                    <span className="text-slate-200">
                      {progress.docker.earnedXp} / {dockerTotalXp.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
                      style={{ width: `${dockerXpPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-7 space-y-3.5">
                  {dockerLevels.map((lvl) => {
                    const state = progress.docker.levels[lvl.id] || {
                      status: lvl.id === 1 ? "in_progress" : "locked",
                      earnedXp: 0,
                    };
                    const missionXp = lvl.missions[0]?.xp || 100;

                    return (
                      <Link
                        key={lvl.id}
                        to={`/learn/docker/lab/${lvl.id}`}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                          state.status === "locked"
                            ? "opacity-50 pointer-events-none"
                            : "hover:bg-[#131c33] cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs ${
                              state.status === "completed"
                                ? "bg-emerald-950/70 border border-emerald-500/50 text-emerald-400"
                                : state.status === "in_progress"
                                ? "bg-amber-950/60 border border-amber-500/40 text-amber-400"
                                : state.status === "unlocked"
                                ? "bg-cyan-950/60 border border-cyan-500/40 text-cyan-400"
                                : "bg-slate-900 border border-slate-800 text-slate-500"
                            }`}
                          >
                            {state.status === "completed" ? (
                              <Check className="h-4 w-4" />
                            ) : state.status === "locked" ? (
                              <Lock className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5 fill-current" />
                            )}
                          </div>
                          <div>
                            <div className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400">
                              LEVEL {String(lvl.id).padStart(2, "0")}
                            </div>
                            <div className="text-sm font-semibold text-slate-100">{lvl.title}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-mono text-slate-400">+{missionXp} XP</span>
                          {state.status === "completed" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                              COMPLETED
                            </span>
                          )}
                          {state.status === "in_progress" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-400 border border-amber-800/40">
                              IN PROGRESS
                            </span>
                          )}
                          {state.status === "unlocked" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                              UNLOCKED
                            </span>
                          )}
                          {state.status === "locked" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-500 border border-slate-800">
                              LOCKED
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#1a2744]">
                <Link
                  to="/learn/docker"
                  className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-medium text-sm transition-all"
                >
                  <span>Continue Docker</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* 4. Kubernetes Kingdom Path Card */}
            <div className="p-7 rounded-2xl bg-[#0a1020]/90 border border-[#1c2947] flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-slate-400">
                    LEARNING PATH
                  </span>
                  <span className="px-3 py-0.5 rounded-full text-xs font-mono bg-[#162238] border border-[#2b3a5a] text-indigo-300">
                    {k8sCompletedCount}/9
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    ☸️
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      Kubernetes Kingdom
                    </h2>
                    <p className="text-xs text-slate-400">Become a Cluster Engineer</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center text-xs font-mono mb-2">
                    <span className="text-slate-400">PATH XP</span>
                    <span className="text-slate-200">
                      {progress.kubernetes.earnedXp} / {k8sTotalXp.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 rounded-full"
                      style={{ width: `${k8sXpPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-7 space-y-3.5">
                  {k8sLevels.map((lvl) => {
                    const state = progress.kubernetes.levels[lvl.id] || {
                      status: lvl.id === 1 ? "completed" : lvl.id === 2 ? "unlocked" : "locked",
                      earnedXp: lvl.id === 1 ? 80 : 0,
                    };
                    const missionXp = lvl.missions[0]?.xp || 100;

                    return (
                      <Link
                        key={lvl.id}
                        to={`/learn/kubernetes/lab/${lvl.id}`}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                          state.status === "locked"
                            ? "opacity-50 pointer-events-none"
                            : "hover:bg-[#131c33] cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs ${
                              state.status === "completed"
                                ? "bg-emerald-950/70 border border-emerald-500/50 text-emerald-400"
                                : state.status === "in_progress"
                                ? "bg-amber-950/60 border border-amber-500/40 text-amber-400"
                                : state.status === "unlocked"
                                ? "bg-cyan-950/60 border border-cyan-500/40 text-cyan-400"
                                : "bg-slate-900 border border-slate-800 text-slate-500"
                            }`}
                          >
                            {state.status === "completed" ? (
                              <Check className="h-4 w-4" />
                            ) : state.status === "locked" ? (
                              <Lock className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5 fill-current" />
                            )}
                          </div>
                          <div>
                            <div className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400">
                              LEVEL {String(lvl.id).padStart(2, "0")}
                            </div>
                            <div className="text-sm font-semibold text-slate-100">{lvl.title}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-mono text-slate-400">+{missionXp} XP</span>
                          {state.status === "completed" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                              COMPLETED
                            </span>
                          )}
                          {state.status === "in_progress" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-400 border border-amber-800/40">
                              IN PROGRESS
                            </span>
                          )}
                          {state.status === "unlocked" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                              UNLOCKED
                            </span>
                          )}
                          {state.status === "locked" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-500 border border-slate-800">
                              LOCKED
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#1a2744]">
                <Link
                  to="/learn/kubernetes"
                  className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 font-medium text-sm transition-all"
                >
                  <span>Continue Kubernetes</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LabLayout>
  );
}
