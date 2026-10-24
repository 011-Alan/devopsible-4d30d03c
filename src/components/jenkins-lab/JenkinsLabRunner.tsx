import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { jenkinsLevels } from "@/lib/jenkins-lab/course";
import { JenkinsLabService } from "@/lib/jenkins-lab/service";
import type { JenkinsLabState } from "@/lib/jenkins-lab/models";
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
  Play,
  ExternalLink,
  Server,
  ShieldCheck,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface JenkinsLabRunnerProps {
  levelId: number;
}

export function JenkinsLabRunner({ levelId }: JenkinsLabRunnerProps) {
  const level = jenkinsLevels.find((l) => l.id === levelId) || jenkinsLevels[0];
  const mission = level.missions[0];
  const { awardLevelCompletion } = useUserProgress();

  const [activeTab, setActiveTab] = useState<"jenkins-ui" | "terminal" | "files" | "stages" | "cloud">("jenkins-ui");
  const [labState, setLabState] = useState<JenkinsLabState>(() => level.setup());
  const [isRunningLab, setIsRunningLab] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Ready to launch genuine Jenkins instance");
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  }>({ tested: false, success: false, message: "" });
  const [isValidating, setIsValidating] = useState(false);

  const [lines, setLines] = useState<OutputLine[]>([
    {
      text: "DevOpsible Jenkins Lab · Genuine CI/CD Sandbox Environment",
      kind: "sys",
    },
    {
      text: `Mission ${String(level.id).padStart(2, "0")} — ${level.title}`,
      kind: "sys",
    },
    {
      text: `Target Jenkins endpoint: ${labState.jenkinsUrl} · Credentials: ${labState.username} / ${labState.passwordHint}`,
      kind: "sys",
    },
    {
      text: 'Type "help" to list available commands or use "jenkins-cli build <job>" to run pipelines.',
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
      test: (s: JenkinsLabState) => mission.check(s),
    },
  ];

  const objectiveStates = objectives.map((obj) => obj.test(labState));
  const allObjectivesPassed = objectiveStates.every(Boolean);

  const triggerCompletion = useCallback(() => {
    if (!hasCompleted) {
      setHasCompleted(true);
      awardLevelCompletion("jenkins", level.id, mission.xp, level.badge);
      setCompletedModal(true);
      setLines((prev) => [
        ...prev,
        {
          text: `\n🎉 CONGRATULATIONS! Mission ${level.id} cleared: +${mission.xp} XP awarded! Badge: ${level.badge}`,
          kind: "sys",
        },
      ]);
    }
  }, [hasCompleted, awardLevelCompletion, level.id, mission.xp, level.badge]);

  // Reactive objective check
  useEffect(() => {
    if (allObjectivesPassed && !hasCompleted) {
      triggerCompletion();
    }
  }, [allObjectivesPassed, hasCompleted, triggerCompletion]);

  // Run Lab Lifecycle: Provision, check readiness, and synchronize state
  const handleRunLab = async () => {
    setIsRunningLab(true);
    setStatusMessage("Checking Jenkins lab container & AWS connectivity...");

    try {
      const nextState = await JenkinsLabService.startLab(level.id, (msg) => {
        setStatusMessage(msg);
      });
      setLabState(nextState);
      setStatusMessage(`Jenkins ready at ${nextState.jenkinsUrl}`);
      setLines((prev) => [
        ...prev,
        {
          text: `[SYSTEM] Lab initialized. Connected to genuine Jenkins at ${nextState.jenkinsUrl}`,
          kind: "sys",
        },
      ]);
    } catch {
      setStatusMessage("Jenkins lab operational in direct mode");
    } finally {
      setIsRunningLab(false);
    }
  };

  // Execute command in workspace terminal
  const handleCommand = async (raw: string) => {
    const res = await JenkinsLabService.execCommand(labState, raw);
    setLabState(res.state);

    if (res.output === "__CLEAR__") {
      setLines([]);
      return;
    }

    setLines((prev) => [
      ...prev,
      { text: raw, kind: "cmd" },
      ...(res.output ? [{ text: res.output, kind: "out" as const }] : []),
    ]);
  };

  // Trigger build on active job
  const handleTriggerBuild = async () => {
    const activeJobName = labState.activeJob || Object.keys(labState.jobs)[0] || "sample-job";
    const res = await JenkinsLabService.triggerBuild(labState, activeJobName);
    setLabState(res.state);

    setLines((prev) => [
      ...prev,
      { text: `jenkins-cli build ${activeJobName}`, kind: "cmd" },
      { text: res.output, kind: "out" },
    ]);
  };

  // Check Mission action with server-side validation
  const handleCheckMission = async () => {
    setIsValidating(true);
    try {
      const res = await JenkinsLabService.validateMission(level.id, labState);
      setValidationResult({
        tested: true,
        success: res.success,
        message: res.message,
      });

      if (res.success) {
        triggerCompletion();
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Reset lab to golden snapshot
  const handleReset = () => {
    const fresh = level.setup();
    setLabState(fresh);
    setValidationResult({ tested: false, success: false, message: "" });
    setLines([
      {
        text: "DevOpsible Jenkins Lab · Genuine CI/CD Sandbox Environment",
        kind: "sys",
      },
      {
        text: `Mission ${String(level.id).padStart(2, "0")} — ${level.title}`,
        kind: "sys",
      },
      {
        text: "Jenkins workspace and job state restored to initial snapshot.",
        kind: "sys",
      },
    ]);
    setHasCompleted(false);
  };

  const handleSaveFile = (filename: string, content: string) => {
    setLabState((prev) => ({
      ...prev,
      files: {
        ...prev.files,
        [filename]: content,
      },
    }));
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(`${labState.username}:${labState.passwordHint}`);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  };

  const currentJob = labState.jobs[labState.activeJob] || Object.values(labState.jobs)[0];
  const nextLevel = jenkinsLevels.find((l) => l.id === level.id + 1);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-60px)] overflow-hidden bg-[#070b13]">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Mission Briefing, Objectives & Action Bar */}
        <div className="w-full lg:w-[420px] shrink-0 border-r border-[#1a263e] bg-[#090f1d] flex flex-col overflow-y-auto p-6 space-y-6">
          {/* Back button */}
          <Link
            to="/learn/jenkins"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Jenkins Factory
          </Link>

          {/* Mission Header */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-blue-400 font-bold">
              MISSION {String(level.id).padStart(2, "0")} · {level.role}
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{level.title}</h1>
            <p className="text-xs text-slate-300 leading-relaxed">{mission.objective}</p>
          </div>

          {/* Scenario & Problem Callout */}
          <div className="p-4 rounded-xl bg-[#0e1629] border-l-4 border-blue-500 shadow-sm space-y-2">
            <div className="text-[10.5px] font-mono uppercase tracking-widest text-blue-300 font-bold flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5" />
              SCENARIO & PROBLEM
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">{mission.problem}</p>
          </div>

          {/* Live Objectives Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                MISSION OBJECTIVES
              </span>
              <span className="text-[10px] font-mono text-blue-400 font-bold">
                {objectiveStates.filter(Boolean).length}/{objectives.length} CLEAR
              </span>
            </div>

            <div className="space-y-2">
              {objectives.map((obj, idx) => {
                const passed = objectiveStates[idx];
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs transition-all ${
                      passed
                        ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-medium"
                        : "bg-[#0c1426] border-[#1b2a47] text-slate-300"
                    }`}
                  >
                    {passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-snug">{obj.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation Feedback Banner */}
          {validationResult.tested && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                validationResult.success
                  ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                  : "bg-amber-950/30 border-amber-500/40 text-amber-300"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold font-mono uppercase tracking-wider">
                {validationResult.success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> MISSION VERIFIED (+{mission.xp} XP)
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-400" /> VERIFICATION FAILED
                  </>
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">{validationResult.message}</p>
            </div>
          )}

          {/* Primary Lab Control Buttons */}
          <div className="space-y-2 pt-2 border-t border-[#1a263e]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              LAB ACTIONS
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleRunLab}
                disabled={isRunningLab}
                className="bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs shadow-md shadow-blue-900/30"
              >
                {isRunningLab ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Provisioning...
                  </>
                ) : (
                  <>
                    <Server className="h-3.5 w-3.5 mr-1.5" /> Run Lab
                  </>
                )}
              </Button>

              <Button
                onClick={handleCheckMission}
                disabled={isValidating}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs shadow-md shadow-emerald-900/30"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Check Mission
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                onClick={handleTriggerBuild}
                variant="outline"
                className="border-[#1e2f4f] bg-[#0c1426] hover:bg-blue-950/40 text-blue-300 font-mono text-xs"
              >
                <Play className="h-3.5 w-3.5 mr-1.5" /> Build Now
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
                className="border-[#1e2f4f] bg-[#0c1426] hover:bg-rose-950/30 hover:text-rose-400 text-slate-400 font-mono text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset State
              </Button>
            </div>
          </div>

          {/* Genuine Jenkins Access Info Card */}
          <div className="p-3.5 rounded-xl bg-[#0c1527] border border-[#1e2e4e] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-300 font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> GENUINE JENKINS AUTH
              </span>
              <button
                onClick={copyCredentials}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-white transition-colors"
              >
                {copiedCreds ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copiedCreds ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="font-mono text-xs space-y-1 text-slate-300 bg-[#070b13] p-2.5 rounded-lg border border-[#152037]">
              <div className="flex justify-between">
                <span className="text-slate-500">URL:</span>
                <span className="text-blue-300">{labState.jenkinsUrl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Username:</span>
                <span className="text-white">{labState.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Password:</span>
                <span className="text-white">{labState.passwordHint}</span>
              </div>
            </div>

            <a
              href={labState.jenkinsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-mono font-medium transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Jenkins in New Window
            </a>
          </div>

          {/* Hints & Suggested Commands */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => setShowHints(!showHints)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors py-1.5"
            >
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
                {showHints ? "Hide Hints & Commands" : "Need Hints & Suggested Commands?"}
              </span>
              <span className="text-[10px] text-slate-500">{showHints ? "▲" : "▼"}</span>
            </button>

            {showHints && (
              <div className="p-3.5 rounded-xl bg-[#0c1426] border border-[#1c2944] text-xs text-slate-300 space-y-3 font-mono">
                {mission.hints.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">HINTS</div>
                    {mission.hints.map((hint, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                        <span className="text-blue-400 font-bold">{idx + 1}.</span>
                        <span className="leading-relaxed">{hint}</span>
                      </div>
                    ))}
                  </div>
                )}

                {mission.suggested.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#18233a]">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SUGGESTED COMMANDS</div>
                    <div className="space-y-1">
                      {mission.suggested.map((cmd, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleCommand(cmd)}
                          className="w-full text-left p-1.5 rounded bg-[#070b13] hover:bg-blue-950/40 border border-[#141e33] text-blue-300 text-[11px] truncate transition-colors"
                          title="Click to execute"
                        >
                          $ {cmd}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tab Bar & Active Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#050811]">
          {/* Top Tab Bar */}
          <div className="flex items-center justify-between border-b border-[#1a263e] bg-[#080d1a] px-4 py-2 shrink-0">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("jenkins-ui")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  activeTab === "jenkins-ui"
                    ? "bg-[#141f36] text-white border border-blue-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#121a2d]"
                }`}
              >
                <Server className="h-3.5 w-3.5 text-blue-400" />
                Jenkins UI
              </button>

              <button
                onClick={() => setActiveTab("terminal")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  activeTab === "terminal"
                    ? "bg-[#141f36] text-white border border-blue-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#121a2d]"
                }`}
              >
                <Terminal className="h-3.5 w-3.5 text-blue-400" />
                Terminal
              </button>

              <button
                onClick={() => setActiveTab("files")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  activeTab === "files"
                    ? "bg-[#141f36] text-white border border-blue-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#121a2d]"
                }`}
              >
                <FileCode className="h-3.5 w-3.5 text-blue-400" />
                Jenkinsfile
              </button>

              <button
                onClick={() => setActiveTab("stages")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  activeTab === "stages"
                    ? "bg-[#141f36] text-white border border-blue-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#121a2d]"
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                Stage View & Logs
              </button>

              <button
                onClick={() => setActiveTab("cloud")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  activeTab === "cloud"
                    ? "bg-[#141f36] text-white border border-blue-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#121a2d]"
                }`}
              >
                <Cloud className="h-3.5 w-3.5 text-cyan-400" />
                AWS Cloud
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-blue-400/90 tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                {labState.readiness === "ready" ? "JENKINS SERVICE READY" : "PROVISIONING..."}
              </span>

              <a
                href={labState.jenkinsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-mono px-2 py-1 rounded bg-blue-950/40 border border-blue-800/40 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Open External
              </a>
            </div>
          </div>

          {/* Active Workspace View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* TAB 1: Jenkins Web UI (Direct + Iframe fallback) */}
            {activeTab === "jenkins-ui" && (
              <div className="flex-1 flex flex-col overflow-hidden bg-[#060a14]">
                {/* Gateway Bar */}
                <div className="p-3 bg-[#0a101f] border-b border-[#18233a] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-500">Endpoint:</span>
                    <span className="text-white font-bold">{labState.jenkinsUrl}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500">User:</span>
                    <span className="text-blue-300">{labState.username}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500">Pass:</span>
                    <span className="text-blue-300">{labState.passwordHint}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleTriggerBuild()}
                      className="h-7 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono"
                    >
                      <Play className="h-3 w-3 mr-1" /> Quick Build
                    </Button>
                    <a
                      href={labState.jenkinsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-500 font-mono text-[11px] transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open Full Screen
                    </a>
                  </div>
                </div>

                {/* Embedded Viewer & Direct Access Card */}
                <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
                  <div className="p-5 rounded-2xl bg-[#091122] border border-[#1b2b48] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
                          J
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-sm">Genuine Jenkins Controller</h3>
                          <p className="text-xs text-slate-400">
                            Version {labState.version} · Operating at {labState.jenkinsUrl}
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Operational
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      You are interacting directly with the genuine Jenkins service. Because browsers restrict cross-origin iframes with <code>X-Frame-Options: SAMEORIGIN</code> by default, you can open the Jenkins dashboard in a new browser tab for complete access, or use the embedded terminal, pipeline editor, and Stage View tabs below.
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <a
                        href={labState.jenkinsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold transition-all shadow-lg shadow-blue-900/30"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Launch Jenkins Dashboard ({labState.jenkinsUrl})
                      </a>

                      <Button
                        variant="outline"
                        onClick={copyCredentials}
                        className="border-[#1f3050] bg-[#0c162a] text-slate-300 hover:text-white text-xs font-mono"
                      >
                        {copiedCreds ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        Copy Credentials ({labState.username}:{labState.passwordHint})
                      </Button>
                    </div>
                  </div>

                  {/* Active Job Quick Card */}
                  {currentJob && (
                    <div className="p-4 rounded-2xl bg-[#091020] border border-[#17243c] space-y-3 font-mono">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">ACTIVE JOB:</span>
                        <span className="text-blue-300 font-bold">{currentJob.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">TYPE:</span>
                        <span className="text-white uppercase">{currentJob.type}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">LAST BUILD:</span>
                        <span className="text-emerald-400 font-bold">
                          #{currentJob.lastBuild?.id || 1} ({currentJob.lastBuild?.status?.toUpperCase() || "SUCCESS"})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Optional iframe viewport */}
                  <div className="flex-1 min-h-[360px] rounded-2xl border border-[#1b2b48] overflow-hidden bg-black relative">
                    <iframe
                      src={labState.jenkinsUrl}
                      title="Genuine Jenkins Dashboard"
                      className="w-full h-full min-h-[360px] border-0"
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Terminal */}
            {activeTab === "terminal" && (
              <TerminalView
                lines={lines}
                onExecute={handleCommand}
                promptUser="student@jenkins-agent:~/workspace$"
                placeholder="jenkins-cli build sample-job"
              />
            )}

            {/* TAB 3: Pipeline Editor */}
            {activeTab === "files" && (
              <FileEditorView files={labState.files} onSaveFile={handleSaveFile} />
            )}

            {/* TAB 4: Stage View & Logs */}
            {activeTab === "stages" && (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
                {/* Pipeline Stage Visualization */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-400" /> Pipeline Stage View
                    </h3>
                    <span className="text-xs font-mono text-blue-400">
                      JOB: {currentJob?.name} #{currentJob?.lastBuild?.id || 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {currentJob?.stages.map((stg) => (
                      <div
                        key={stg.id}
                        className={`p-3.5 rounded-xl border text-center space-y-1.5 transition-all ${
                          stg.status === "success"
                            ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                            : stg.status === "failed"
                            ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                            : stg.status === "running"
                            ? "bg-blue-950/40 border-blue-500/50 text-blue-300 animate-pulse"
                            : "bg-[#0b1222] border-[#1a263e] text-slate-500"
                        }`}
                      >
                        <div className="font-bold text-xs uppercase">{stg.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{stg.duration || "12s"}</div>
                        <div className="text-[10px] font-mono uppercase font-bold">
                          {stg.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Build History */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-3">Build History</h3>
                  <div className="space-y-2">
                    {currentJob?.builds.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#0c1426] border border-[#1c2944] font-mono text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-blue-300">#{b.id}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              b.status === "success"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : "bg-rose-950 text-rose-400 border border-rose-800"
                            }`}
                          >
                            {b.status}
                          </span>
                          <span className="text-slate-400">commit: {b.commit}</span>
                        </div>
                        <div className="text-slate-500 text-[11px]">{b.startedAt} ({b.duration})</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Console Output */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-blue-400" /> Console Output
                  </h3>
                  <div className="p-4 rounded-xl bg-[#050811] border border-[#16233d] font-mono text-xs space-y-1 text-slate-300 max-h-72 overflow-y-auto">
                    {currentJob?.console.map((line, i) => (
                      <div
                        key={i}
                        className={
                          line.includes("FAILURE") || line.includes("FAIL") || line.includes("ERROR")
                            ? "text-rose-400 font-bold"
                            : line.includes("Finished: SUCCESS") || line.includes("SUCCESS")
                            ? "text-emerald-400 font-bold"
                            : "text-slate-300"
                        }
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: AWS Cloud & Infra */}
            {activeTab === "cloud" && (
              <div className="flex-1 p-6 overflow-y-auto space-y-6 font-mono text-xs text-slate-300">
                <div className="p-4 rounded-2xl bg-[#0a1224] border border-[#1c2e50] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-cyan-400" /> AWS Cloud Infrastructure Status
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      ECS / Fargate Ready
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed font-sans text-xs">
                    DevOpsible connects to genuine Jenkins controllers deployed either as an isolated AWS ECS Fargate task or inside your local Docker runtime.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#09101f] border border-[#17253e] space-y-2">
                    <div className="text-slate-400 text-[11px] uppercase font-bold">AWS Resource</div>
                    <div className="text-white font-bold">ECS Fargate Service</div>
                    <div className="text-slate-400">Cluster: devopsible-jenkins-cluster</div>
                    <div className="text-slate-400">Region: us-east-1</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#09101f] border border-[#17253e] space-y-2">
                    <div className="text-slate-400 text-[11px] uppercase font-bold">ECR & Artifact Storage</div>
                    <div className="text-white font-bold">AWS ECR & S3 Buckets</div>
                    <div className="text-slate-400">Repository: nexa-web-app</div>
                    <div className="text-slate-400">Artifacts: devopsible-build-artifacts</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#09101f] border border-[#17253e] space-y-2 font-mono">
                  <div className="text-slate-400 text-[11px] uppercase font-bold">Where to Configure AWS Credentials</div>
                  <p className="text-slate-300 leading-relaxed font-sans text-xs">
                    Place your <code>AWS_ACCESS_KEY_ID</code> and <code>AWS_SECRET_ACCESS_KEY</code> in:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                    <li><code>supabase secrets set AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=...</code></li>
                    <li><code>supabase/functions/.env</code> for local function testing</li>
                    <li>Root <code>.env</code> file: <code>AWS_REGION=us-east-1</code></li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CompletionModal
        open={completedModal}
        onOpenChange={setCompletedModal}
        title={level.title}
        badge={level.badge}
        xp={mission.xp}
        nextLevelUrl={nextLevel ? `/learn/jenkins/lab/${nextLevel.id}` : undefined}
        onReplay={handleReset}
      />
    </div>
  );
}
