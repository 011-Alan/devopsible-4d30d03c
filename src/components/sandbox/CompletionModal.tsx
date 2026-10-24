import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  badge: string;
  xp: number;
  nextLevelUrl?: string;
  onReplay: () => void;
}

export function CompletionModal({
  open,
  onOpenChange,
  title,
  badge,
  xp,
  nextLevelUrl,
  onReplay,
}: CompletionModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#090f1d] border-[#1e2f4d] text-slate-100 p-6 shadow-2xl">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto h-16 w-16 rounded-full bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center text-3xl shadow-[0_0_25px_rgba(34,211,238,0.4)] animate-bounce">
            🎉
          </div>
          <DialogTitle className="text-2xl font-extrabold text-white tracking-tight pt-2">
            Mission Complete!
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-sm">
            You successfully cleared <span className="text-cyan-400 font-semibold">{title}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-4 rounded-xl bg-[#10182b] border border-[#233352] space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">XP Awarded</span>
            <span className="font-mono font-bold text-emerald-400 text-base">+{xp} XP</span>
          </div>

          <div className="flex justify-between items-center text-sm border-t border-[#1c2944] pt-2">
            <span className="text-slate-400">Badge Unlocked</span>
            <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-amber-300 text-xs px-2.5 py-1 rounded bg-amber-950/50 border border-amber-500/40">
              <Trophy className="h-3 w-3 text-amber-400" />
              {badge.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onReplay}
            className="flex-1 border-[#233554] bg-[#121c30] text-slate-300 hover:text-white hover:bg-[#1a2845] font-medium"
          >
            <RotateCcw className="h-4 w-4 mr-2 text-cyan-400" />
            Replay
          </Button>

          {nextLevelUrl ? (
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate(nextLevelUrl);
              }}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-[#070b13] font-bold shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            >
              Next Level
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate("/dashboard");
              }}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-[#070b13] font-bold"
            >
              Dashboard
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
