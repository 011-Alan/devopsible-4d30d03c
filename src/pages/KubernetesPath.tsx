import { Link } from "react-router-dom";
import { LabLayout } from "@/components/layout/LabLayout";
import { useUserProgress } from "@/lib/progress";
import { k8sLevels } from "@/lib/k8s-lab/course";
import { ArrowLeft, Play, RotateCcw, Lock, Trophy } from "lucide-react";

export default function KubernetesPath() {
  const { progress } = useUserProgress();
  const totalXp = 2240;
  const earnedXp = progress.kubernetes.earnedXp;
  const xpPercent = Math.min(100, (earnedXp / totalXp) * 100);

  return (
    <LabLayout>
      <div className="mx-auto max-w-[1100px] px-6 py-10 space-y-8">
        {/* Back to Dashboard */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        {/* Hero Card */}
        <div className="p-8 rounded-2xl bg-[#0b1222] border border-[#1b2742] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-slate-400">
            LEARNING PATH
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(99,102,241,0.25)]">
              ☸️
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Kubernetes Kingdom</h1>
              <p className="text-sm text-slate-400">Become a Cluster Engineer</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <div className="mt-2.5 flex justify-end text-xs font-mono text-slate-400">
              {earnedXp} / {totalXp.toLocaleString()} XP
            </div>
          </div>
        </div>

        {/* Level Cards Stack */}
        <div className="space-y-4">
          {k8sLevels.map((lvl, index) => {
            const state = progress.kubernetes.levels[lvl.id] || {
              status: lvl.id === 1 ? "completed" : lvl.id === 2 ? "unlocked" : "locked",
              earnedXp: lvl.id === 1 ? 80 : 0,
            };
            const mission = lvl.missions[0];
            const missionXp = mission?.xp || 100;
            const isCompleted = state.status === "completed";
            const isLocked = state.status === "locked";
            const isInProgress = state.status === "in_progress";
            const isUnlocked = state.status === "unlocked";

            return (
              <div
                key={lvl.id}
                className={`p-6 rounded-2xl bg-[#0a1020] border transition-all ${
                  isLocked
                    ? "border-[#141d30] opacity-60"
                    : isCompleted
                    ? "border-emerald-500/20 shadow-md"
                    : "border-[#1e2d4d] shadow-lg"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left: Info */}
                  <div className="space-y-2.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 tracking-wider">
                        LEVEL {String(lvl.id).padStart(2, "0")}
                      </span>
                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          COMPLETED
                        </span>
                      )}
                      {isInProgress && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                          IN PROGRESS
                        </span>
                      )}
                      {isUnlocked && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                          UNLOCKED
                        </span>
                      )}
                      {isLocked && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-900 text-slate-500 border border-slate-800">
                          LOCKED
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-bold text-white tracking-tight">{lvl.title}</h2>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {mission?.objective || lvl.story}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-cyan-950/40 text-cyan-400 border border-cyan-500/30">
                        +{missionXp} XP
                      </span>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-amber-950/40 text-amber-300 border border-amber-500/30">
                        <Trophy className="h-3 w-3 text-amber-400" />
                        {lvl.badge.toUpperCase()}
                      </span>

                      {isCompleted && (
                        <span className="text-xs font-mono text-emerald-400 font-medium">
                          EARNED {state.earnedXp || 80} XP
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Button */}
                  <div className="flex items-center shrink-0">
                    {isCompleted ? (
                      <Link
                        to={`/learn/kubernetes/lab/${lvl.id}`}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-transparent hover:bg-cyan-950/30 border border-cyan-400/80 hover:border-cyan-400 text-cyan-400 font-medium text-sm transition-all shadow-sm"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Replay
                      </Link>
                    ) : isLocked ? (
                      <button
                        disabled
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f1729] border border-[#1c2944] text-slate-500 text-sm font-medium cursor-not-allowed"
                      >
                        <Lock className="h-4 w-4" />
                        Clear level {index} first
                      </button>
                    ) : (
                      <Link
                        to={`/learn/kubernetes/lab/${lvl.id}`}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] font-semibold text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.45)]"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        Start lab
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </LabLayout>
  );
}
