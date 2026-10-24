import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dockerLevels } from "@/lib/docker-lab/course";
import { runDocker, type DockerState } from "@/lib/docker-lab/engine";
import { useUserProgress } from "@/lib/progress";
import { TerminalView, type OutputLine } from "@/components/sandbox/TerminalView";
import { FileEditorView } from "@/components/sandbox/FileEditorView";
import { CompletionModal } from "@/components/sandbox/CompletionModal";
import {
  Terminal,
  FileCode,
  Activity,
  ArrowLeft,
  CheckCircle2,
  Circle,
  HelpCircle,
  RotateCcw,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DockerLabRunnerProps {
  levelId: number;
}

export function DockerLabRunner({ levelId }: DockerLabRunnerProps) {
  const level = dockerLevels.find((l) => l.id === levelId) || dockerLevels[0];
  const mission = level.missions[0];
  const { awardLevelCompletion } = useUserProgress();

  const [activeTab, setActiveTab] = useState<"terminal" | "files" | "status">("terminal");
  const [dockerState, setDockerState] = useState<DockerState>(() => level.setup());
  const [lines, setLines] = useState<OutputLine[]>([
    {
      text: "DevOpsible lab environment · disposable sandbox on devopsible-labs",
      kind: "sys",
    },
    {
      text: `Mission ${String(level.id).padStart(2, "0")} — ${level.title}`,
      kind: "sys",
    },
    {
      text: 'Type "help" to list the commands this lab understands.',
      kind: "sys",
    },
  ]);
  const [showHints, setShowHints] = useState(false);
  const [completedModal, setCompletedModal] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Objectives status
  const objectives = mission.checks || [
    {
      label: mission.objective,
      test: (s: DockerState) => mission.check(s),
    },
  ];

  const objectiveStates = objectives.map((obj) => obj.test(dockerState));
  const allObjectivesPassed = objectiveStates.every(Boolean);

  useEffect(() => {
    if (allObjectivesPassed && !hasCompleted) {
      setHasCompleted(true);
      awardLevelCompletion("docker", level.id, mission.xp, level.badge);
      setCompletedModal(true);
      setLines((prev) => [
        ...prev,
        {
          text: `\n🎉 CONGRATULATIONS! Mission cleared: +${mission.xp} XP awarded! Badge: ${level.badge}`,
          kind: "sys",
        },
      ]);
    }
  }, [allObjectivesPassed, hasCompleted, level.id, mission.xp, level.badge, awardLevelCompletion]);

  const handleCommand = (raw: string) => {
    const result = runDocker(dockerState, raw);
    setDockerState(result.state);

    if (result.output === "__CLEAR__") {
      setLines([]);
      return;
    }

    setLines((prev) => [
      ...prev,
      { text: raw, kind: "cmd" },
      ...(result.output
        ? [{ text: result.output, kind: (result.error ? "err" : "out") as "err" | "out" }]
        : []),
    ]);
  };

  const handleReset = () => {
    const fresh = level.setup();
    setDockerState(fresh);
    setLines([
      {
        text: "DevOpsible lab environment · disposable sandbox on devopsible-labs",
        kind: "sys",
      },
      {
        text: `Mission ${String(level.id).padStart(2, "0")} — ${level.title}`,
        kind: "sys",
      },
      {
        text: "Sandbox state restored to golden snapshot.",
        kind: "sys",
      },
    ]);
    setHasCompleted(false);
  };

  const handleSaveFile = (filename: string, content: string) => {
    setDockerState((prev) => ({
      ...prev,
      files: {
        ...prev.files,
        [filename]: content,
      },
    }));
  };

  const nextLevel = dockerLevels.find((l) => l.id === level.id + 1);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-60px)] overflow-hidden bg-[#070b13]">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Mission Briefing & Live Objectives */}
        <div className="w-full lg:w-[420px] shrink-0 border-r border-[#1a263e] bg-[#090f1d] flex flex-col overflow-y-auto p-6 space-y-6">
          {/* Back button */}
          <Link
            to="/learn/docker"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Docker Quest
          </Link>

          {/* Mission Header */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400 font-bold">
              MISSION {String(level.id).padStart(2, "0")}
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{level.title}</h1>
            <p className="text-xs text-slate-300 leading-relaxed">{mission.objective}</p>
          </div>

          {/* Briefing Box */}
          <div className="p-4 rounded-xl bg-[#0e1629] border-l-4 border-cyan-400 shadow-sm space-y-2">
            <div className="text-[10.5px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
              BRIEFING
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              {mission.briefing || level.story}
            </p>
          </div>

          {/* Live Objectives */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              YOUR OBJECTIVES
            </div>
            <div className="space-y-2.5">
              {objectives.map((obj, i) => {
                const passed = objectiveStates[i];
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs transition-all ${
                      passed
                        ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
                        : "bg-[#0c1324] border-[#1d2b47] text-slate-300"
                    }`}
                  >
                    {passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <span className={passed ? "line-through text-slate-400" : "font-medium"}>
                      {obj.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              The checklist is verified by inspecting the environment, not by the commands you type.
            </p>
          </div>

          {/* Suggested Commands Chips */}
          {mission.suggested && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                SUGGESTED COMMANDS
              </div>
              <div className="space-y-1.5">
                {mission.suggested.map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => {
                      setActiveTab("terminal");
                      handleCommand(cmd);
                    }}
                    className="w-full text-left font-mono text-xs px-3 py-2 rounded-lg bg-[#0e172a] hover:bg-cyan-950/40 border border-[#1e2e4f] hover:border-cyan-500/50 text-cyan-300 transition-colors flex items-center justify-between group"
                  >
                    <span>&gt;_ {cmd}</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-cyan-400">
                      Run ↵
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hints Section */}
          <div className="pt-2 border-t border-[#1a263e]">
            <button
              onClick={() => setShowHints(!showHints)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              {showHints ? "Hide Hints" : "Need a Hint?"}
            </button>
            {showHints && (
              <div className="mt-2.5 p-3 rounded-lg bg-[#0d1424] border border-[#1e2a44] text-xs text-slate-300 space-y-2 font-mono">
                {mission.hints.map((hint, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">{idx + 1}.</span>
                    <span>{hint}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tab Bar & Active Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#050811]">
          {/* Tab Navigation Header */}
          <div className="flex items-center justify-between border-b border-[#1a263e] bg-[#080d1a] px-4 py-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("terminal")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  activeTab === "terminal"
                    ? "bg-[#141f36] text-white border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#121a2d]"
                }`}
              >
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                Terminal
              </button>

              <button
                onClick={() => setActiveTab("files")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  activeTab === "files"
                    ? "bg-[#141f36] text-white border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#121a2d]"
                }`}
              >
                <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                Files
              </button>

              <button
                onClick={() => setActiveTab("status")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  activeTab === "status"
                    ? "bg-[#141f36] text-white border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#121a2d]"
                }`}
              >
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                Live status
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-400/90 tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                LAB ENVIRONMENT RESTORED
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 px-2"
                title="Reset lab to initial state"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          </div>

          {/* Active Workspace View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === "terminal" && (
              <TerminalView
                lines={lines}
                onExecute={handleCommand}
                promptUser="student@devopsible:~/lab$"
                placeholder="docker run -d --name web-lab -p 8080:80 nginx"
              />
            )}

            {activeTab === "files" && (
              <FileEditorView files={dockerState.files} onSaveFile={handleSaveFile} />
            )}

            {activeTab === "status" && (
              <div className="flex-1 p-6 overflow-y-auto space-y-6 text-sm font-mono text-slate-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-sm">Containers ({dockerState.containers.length})</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCommand("curl localhost:8080")}
                      className="h-7 text-xs bg-cyan-950/30 border-cyan-500/40 text-cyan-400 hover:bg-cyan-900/40"
                    >
                      Probe Port 8080
                    </Button>
                  </div>

                  {dockerState.containers.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#0b101c] border border-[#1b263e] text-slate-500 text-xs">
                      No containers currently created or running.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dockerState.containers.map((c) => (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-xl bg-[#0b1222] border border-[#1c2944] space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{c.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                c.status === "running"
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                  : "bg-slate-900 text-slate-400 border border-slate-800"
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">Image: {c.image}</div>
                          <div className="text-xs text-cyan-400">
                            Ports: {c.ports.join(", ") || "none"}
                          </div>
                          {c.volumes.length > 0 && (
                            <div className="text-xs text-amber-400">
                              Volumes: {c.volumes.join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm">Local Images</h3>
                  <div className="p-3 rounded-xl bg-[#0b101c] border border-[#1b263e] space-y-1">
                    {dockerState.images.map((img) => (
                      <div key={img} className="flex justify-between text-xs text-slate-300">
                        <span>{img}</span>
                        <span className="text-slate-500">sha256:verified</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0d162b] border border-cyan-500/20 text-xs text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                    <Cloud className="h-4 w-4" />
                    AWS Cloud Sandbox Status
                  </div>
                  <span className="text-emerald-400">Compatible (ECS/ECR Ready)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Level Completion Modal */}
      <CompletionModal
        open={completedModal}
        onOpenChange={setCompletedModal}
        title={level.title}
        badge={level.badge}
        xp={mission.xp}
        nextLevelUrl={nextLevel ? `/learn/docker/lab/${nextLevel.id}` : undefined}
        onReplay={handleReset}
      />
    </div>
  );
}
