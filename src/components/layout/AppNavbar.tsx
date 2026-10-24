import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, TrendingUp, Sparkles, LogOut, Cloud, ShieldCheck } from "lucide-react";
import { useUserProgress } from "@/lib/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AppNavbar() {
  const location = useLocation();
  const { progress, resetProgress } = useUserProgress();
  const { user, profile, signOut } = useAuth();
  const [awsModalOpen, setAwsModalOpen] = useState(false);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Alan";
  const xpInCurrentLevel = progress.totalXp % 1000;
  const xpPercent = Math.min(100, Math.max(8, (xpInCurrentLevel / 1000) * 100));

  const isDashboardActive =
    location.pathname === "/" ||
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/learn");
  const isProgressActive = location.pathname === "/progress";

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[#1e293b]/70 bg-[#090d16]/90 backdrop-blur-md px-6 py-3">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
          {/* Left: Brand + Nav links */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 font-mono text-sm font-bold shadow-[0_0_12px_rgba(34,211,238,0.2)] group-hover:border-cyan-400 transition-colors">
                &gt;_
              </div>
              <span className="font-mono text-base font-bold tracking-[0.14em] text-white">
                DEVOPSIBLE
              </span>
            </Link>

            <nav className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isDashboardActive
                    ? "bg-[#151c2e] text-white border border-[#2d3748] shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#151c2e]/50"
                }`}
              >
                <LayoutGrid className="h-4 w-4 text-cyan-400" />
                Dashboard
              </Link>

              <Link
                to="/progress"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isProgressActive
                    ? "bg-[#151c2e] text-white border border-[#2d3748] shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#151c2e]/50"
                }`}
              >
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                My Progress
              </Link>
            </nav>
          </div>

          {/* Right: Level, XP, AWS indicator, User & Logout */}
          <div className="flex items-center gap-5">
            {/* AWS Cloud pill button */}
            <button
              onClick={() => setAwsModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-cyan-400/90 bg-cyan-950/30 border border-cyan-800/40 hover:border-cyan-500/60 hover:bg-cyan-900/30 transition-all cursor-pointer"
              title="AWS Cloud Sandbox Configuration"
            >
              <Cloud className="h-3.5 w-3.5 text-cyan-400" />
              <span>AWS Cloud: Compatible</span>
            </button>

            {/* Operator Level pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#131b2e] border border-[#2a3754] text-amber-400 text-xs font-semibold tracking-wide shadow-inner">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-amber-400/30" />
              <span>LV {String(progress.operatorLevel).padStart(2, "0")}</span>
            </div>

            {/* XP counter & progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 font-mono text-xs text-slate-300">
                <span className="text-slate-500 font-semibold">XP</span>
                <span className="font-bold text-white">{progress.totalXp}</span>
              </div>
              <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>

            {/* User name & sign out */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800/80">
              <span className="text-sm font-medium text-slate-200 capitalize">{displayName}</span>
              <button
                onClick={() => {
                  if (user) {
                    signOut();
                  } else {
                    resetProgress();
                  }
                }}
                className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                title={user ? "Sign out" : "Reset demo progress"}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* AWS Cloud Info Dialog */}
      <Dialog open={awsModalOpen} onOpenChange={setAwsModalOpen}>
        <DialogContent className="max-w-2xl bg-[#0b101b] border-[#22334d] text-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
              <Cloud className="h-5 w-5 text-cyan-400" />
              AWS Cloud Compatibility & Credentials
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              DevOpsible is designed to connect directly with AWS ECS, ECR, and EKS for real cloud provisioning.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-sm">
            <div className="p-3.5 rounded-lg bg-[#111927] border border-cyan-500/20">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
                <ShieldCheck className="h-4 w-4" />
                Where to place your AWS credentials:
              </div>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 mt-2 text-[13px] leading-relaxed">
                <li>
                  <strong className="text-white">Supabase Cloud Secrets (Production):</strong>
                  <pre className="mt-1 p-2 rounded bg-black/60 font-mono text-xs text-cyan-300 overflow-x-auto">
                    supabase secrets set AWS_ACCESS_KEY_ID=AKIA... AWS_SECRET_ACCESS_KEY=... AWS_REGION=us-east-1
                  </pre>
                </li>
                <li>
                  <strong className="text-white">Local Edge Function (.env):</strong>
                  <div className="text-slate-400 mt-0.5">
                    File path: <code className="text-cyan-300 font-mono">supabase/functions/.env</code>
                  </div>
                  <pre className="mt-1 p-2 rounded bg-black/60 font-mono text-xs text-cyan-300 overflow-x-auto">
                    AWS_ACCESS_KEY_ID=your_access_key{"\n"}
                    AWS_SECRET_ACCESS_KEY=your_secret_key{"\n"}
                    AWS_REGION=us-east-1
                  </pre>
                </li>
                <li>
                  <strong className="text-white">Root Project (.env):</strong>
                  <div className="text-slate-400 mt-0.5">
                    File path: <code className="text-cyan-300 font-mono">.env</code>
                  </div>
                  <pre className="mt-1 p-2 rounded bg-black/60 font-mono text-xs text-cyan-300 overflow-x-auto">
                    VITE_SANDBOX_MODE=remote{"\n"}
                    AWS_REGION=us-east-1
                  </pre>
                </li>
              </ol>
            </div>

            <div className="text-xs text-slate-400">
              * Note: When credentials are not provided, DevOpsible seamlessly executes in high-fidelity browser sandbox mode, preserving all interactive validation and XP tracking.
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setAwsModalOpen(false)} className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium">
                Got it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
