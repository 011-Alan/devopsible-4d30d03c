import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LabLayout } from "@/components/layout/LabLayout";
import { Button } from "@/components/ui/button";
import { levels, type Level, type Mission } from "@/lib/git-sim/levels";
import { runCommand, commitList, type RepoState } from "@/lib/git-sim/engine";
import { useUserProgress } from "@/lib/progress";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  FileCode,
  GitBranch,
  HelpCircle,
  Lock,
  Play,
  RotateCcw,
  Terminal as TerminalIcon,
  Trophy,
} from "lucide-react";

type Line = { text: string; kind: "cmd" | "out" | "err" | "sys" };

export default function GitCourse() {
  const [searchParams] = useSearchParams();
  const initialLevelId = parseInt(searchParams.get("level") || "1", 10);
  const { progress, awardLevelCompletion } = useUserProgress();

  const [levelId, setLevelId] = useState(initialLevelId);
  const level = levels.find((l) => l.id === levelId) || levels[0];

  const [mode, setMode] = useState<"learn" | "practice" | "mission">("mission");
  const [repo, setRepo] = useState<RepoState>(() => level.setup());
  const [history, setHistory] = useState<string[]>([]);
  const [lines, setLines] = useState<Line[]>([
    { text: "DevOpsible Git Sandbox environment ready.", kind: "sys" },
    { text: `Level ${level.id} — ${level.title}`, kind: "sys" },
    { text: "Type `help` to list commands. Inspect state in the file panel and commit graph.", kind: "sys" },
  ]);
  const [input, setInput] = useState("");
  const [openFile, setOpenFile] = useState<string | null>("app.js");
  const [fileContent, setFileContent] = useState<string>("");
  const [hintsUsed, setHintsUsed] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"terminal" | "files" | "graph">("terminal");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    if (openFile && repo.workingTree[openFile] !== undefined) {
      setFileContent(repo.workingTree[openFile] || "");
    } else {
      const first = Object.keys(repo.workingTree)[0];
      if (first) {
        setOpenFile(first);
        setFileContent(repo.workingTree[first] || "");
      }
    }
  }, [repo.workingTree, openFile]);

  const resetLab = (l: Level = level) => {
    setRepo(l.setup());
    setHistory([]);
    setLines([
      { text: "DevOpsible Git Sandbox environment ready.", kind: "sys" },
      { text: `Level ${l.id} — ${l.title}`, kind: "sys" },
      { text: "Sandbox restored to golden snapshot.", kind: "sys" },
    ]);
  };

  const selectLevel = (l: Level) => {
    if (!l.available) return;
    setLevelId(l.id);
    resetLab(l);
  };

  const award = (m: Mission) => {
    const isDone = progress.git?.levels[level.id]?.status === "completed";
    awardLevelCompletion("git", level.id, m.xp, level.badge);
    setToast(`+${m.xp} XP — ${m.title}`);
    setLines((ls) => [...ls, { text: `✓ ${m.done}  (+${m.xp} XP)`, kind: "sys" }]);
    setTimeout(() => setToast(null), 3500);
  };

  const check = (state: RepoState, log: string[]) => {
    for (const m of level.missions) {
      if (m.validate(state, log)) {
        award(m);
      }
    }
  };

  const submit = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const { state, result } = runCommand(repo, cmd);
    const log = [...history, cmd];
    setHistory(log);
    setRepo(state);
    if (result.output === "__CLEAR__") {
      setLines([]);
    } else {
      setLines((ls) => [
        ...ls,
        { text: cmd, kind: "cmd" },
        ...(result.output ? [{ text: result.output, kind: result.error ? ("err" as const) : ("out" as const) }] : []),
      ]);
    }
    check(state, log);
    setInput("");
  };

  const saveFile = (path: string, content: string) => {
    const next = { ...repo, workingTree: { ...repo.workingTree, [path]: content } };
    setRepo(next);
    check(next, history);
    setToast(`Saved ${path}`);
    setTimeout(() => setToast(null), 2000);
  };

  const commits = useMemo(() => commitList(repo), [repo]);
  const branch = repo.detached ? `HEAD@${repo.detached}` : repo.head;
  const levelState = progress.git?.levels[level.id] || { status: "in_progress", earnedXp: 0 };
  const isLevelCompleted = levelState.status === "completed";

  return (
    <LabLayout>
      <div className="flex-1 flex flex-col h-[calc(100vh-60px)] overflow-hidden bg-[#070b13]">
        {/* Toast notification */}
        {toast && (
          <div className="fixed top-16 right-6 z-50 px-4 py-2.5 rounded-xl bg-orange-950/90 border border-orange-500/50 text-orange-200 font-mono text-xs shadow-xl animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {toast}
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Mission Briefing & Levels */}
          <div className="w-full lg:w-[420px] shrink-0 border-r border-[#1a263e] bg-[#090f1d] flex flex-col overflow-y-auto p-6 space-y-6">
            <Link
              to="/learn/git"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Git Flow
            </Link>

            {/* Level Title & Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-orange-400 font-bold">
                  LEVEL {String(level.id).padStart(2, "0")} · {level.role}
                </span>
                {isLevelCompleted && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                    COMPLETED
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>{level.emoji}</span>
                <span>{level.title}</span>
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">{level.story}</p>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0d1526] border border-[#1d2a45]">
              <button
                onClick={() => setMode("mission")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mode === "mission" ? "bg-orange-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                Missions
              </button>
              <button
                onClick={() => setMode("learn")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mode === "learn" ? "bg-orange-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                Concepts
              </button>
            </div>

            {mode === "learn" ? (
              <div className="space-y-4">
                {level.concepts.map((c, i) => (
                  <div key={c.heading} className="p-4 rounded-xl bg-[#0c1426] border border-[#1b2844] space-y-1.5">
                    <div className="text-[10px] font-mono text-orange-400">CONCEPT {String(i + 1).padStart(2, "0")}</div>
                    <h3 className="text-sm font-bold text-white">{c.heading}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{c.body}</p>
                  </div>
                ))}
                <Button
                  onClick={() => setMode("mission")}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs"
                >
                  Start Missions <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  ACTIVE MISSIONS
                </div>

                <div className="space-y-3">
                  {level.missions.map((m) => {
                    const done = m.validate(repo, history);
                    return (
                      <div
                        key={m.id}
                        className={`p-4 rounded-xl border transition-all ${
                          done ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200" : "bg-[#0c1426] border-[#1b2844]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            {done ? <Check className="h-4 w-4 text-emerald-400" /> : <Play className="h-3.5 w-3.5 text-orange-400" />}
                            {m.title}
                          </h3>
                          <span className="text-xs font-mono text-orange-400">+{m.xp} XP</span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">{m.brief}</p>

                        <div className="mt-3 space-y-1">
                          {m.objectives.map((obj, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                              <span className="text-orange-400">▪</span> {obj}
                            </div>
                          ))}
                        </div>

                        {/* Hints button */}
                        <div className="mt-3 pt-2 border-t border-[#1a263e]">
                          <details className="text-xs text-slate-400">
                            <summary className="cursor-pointer text-orange-400/90 hover:text-orange-300">
                              View Hints
                            </summary>
                            <div className="mt-2 space-y-1 pl-2 border-l-2 border-orange-500/40 text-[11px] font-mono">
                              {m.hints.map((h, hi) => (
                                <p key={hi}>{hi + 1}. {h}</p>
                              ))}
                            </div>
                          </details>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Level Quick Switcher */}
            <div className="pt-4 border-t border-[#1a263e]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
                ALL LEVELS
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {levels.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => selectLevel(l)}
                    className={`p-2 rounded-lg text-center text-xs font-mono transition-colors ${
                      l.id === level.id
                        ? "bg-orange-600 text-white font-bold"
                        : "bg-[#0e1629] border border-[#1b2742] text-slate-400 hover:text-white"
                    }`}
                  >
                    LV {l.id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Tab Bar & Interactive Sandbox */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#050811]">
            {/* Header Tabs */}
            <div className="flex items-center justify-between border-b border-[#1a263e] bg-[#080d1a] px-4 py-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("terminal")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    activeTab === "terminal"
                      ? "bg-[#18233c] text-white border border-orange-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#121a2d]"
                  }`}
                >
                  <TerminalIcon className="h-3.5 w-3.5 text-orange-400" />
                  Terminal
                </button>

                <button
                  onClick={() => setActiveTab("files")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    activeTab === "files"
                      ? "bg-[#18233c] text-white border border-orange-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#121a2d]"
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5 text-orange-400" />
                  Files
                </button>

                <button
                  onClick={() => setActiveTab("graph")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    activeTab === "graph"
                      ? "bg-[#18233c] text-white border border-orange-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#121a2d]"
                  }`}
                >
                  <GitBranch className="h-3.5 w-3.5 text-orange-400" />
                  Commit Graph
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-orange-400/90 tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                  BRANCH: {branch}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetLab()}
                  className="h-7 text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 px-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Tab 1: Terminal */}
            {activeTab === "terminal" && (
              <div
                className="flex-1 flex flex-col p-4 bg-[#050811] overflow-hidden font-mono text-[13px] cursor-text"
                onClick={() => inputRef.current?.focus()}
              >
                <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1.5 pr-2">
                  {lines.map((l, i) => (
                    <div
                      key={i}
                      className={
                        l.kind === "cmd"
                          ? "text-slate-100 font-semibold"
                          : l.kind === "err"
                          ? "text-rose-400 pl-2"
                          : l.kind === "sys"
                          ? "text-orange-400 font-medium"
                          : "text-slate-300 leading-relaxed pl-1"
                      }
                    >
                      {l.kind === "cmd" && <span className="text-emerald-400 mr-2">student@nexa:~/project$</span>}
                      {l.text}
                    </div>
                  ))}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submit(input);
                    }}
                    className="flex items-center gap-2 pt-1"
                  >
                    <span className="text-emerald-400 font-semibold shrink-0 select-none">
                      student@nexa:~/project$
                    </span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="git status, git add, git commit..."
                      className="flex-1 bg-transparent border-none outline-none text-white font-mono text-[13px] p-0 placeholder:text-slate-600 focus:ring-0"
                      autoFocus
                      spellCheck={false}
                    />
                  </form>
                </div>
              </div>
            )}

            {/* Tab 2: Files Editor */}
            {activeTab === "files" && (
              <div className="flex-1 flex flex-col overflow-hidden bg-[#050811]">
                <div className="flex items-center justify-between border-b border-[#1b263e] bg-[#090e1c] px-3 py-2">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {Object.keys(repo.workingTree).map((filename) => (
                      <button
                        key={filename}
                        onClick={() => {
                          setOpenFile(filename);
                          setFileContent(repo.workingTree[filename] || "");
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                          openFile === filename
                            ? "bg-[#18233c] text-orange-300 border border-orange-500/40"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <FileCode className="h-3.5 w-3.5 text-orange-400" />
                        {filename}
                      </button>
                    ))}
                  </div>

                  {openFile && (
                    <Button
                      onClick={() => saveFile(openFile, fileContent)}
                      size="sm"
                      className="h-7 px-3 text-xs bg-orange-600 hover:bg-orange-500 text-white font-mono"
                    >
                      Save Changes
                    </Button>
                  )}
                </div>

                <div className="flex-1 relative flex overflow-hidden">
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="flex-1 w-full p-4 bg-transparent resize-none font-mono text-[13px] leading-relaxed text-slate-200 border-none outline-none focus:ring-0 selection:bg-orange-500/30"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Commit Graph Visualizer */}
            {activeTab === "graph" && (
              <div className="flex-1 p-6 overflow-y-auto space-y-4 font-mono text-xs bg-[#050811]">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm">Git Commit Tree ({commits.length} commits)</h3>
                  <span className="text-slate-400">HEAD at: {branch}</span>
                </div>

                <div className="space-y-3">
                  {commits.map((c) => {
                    const isHead = (repo.detached ? repo.detached : repo.branches[repo.head]) === c.hash;
                    const matchingBranches = Object.entries(repo.branches)
                      .filter(([, hash]) => hash === c.hash)
                      .map(([name]) => name);

                    return (
                      <div
                        key={c.hash}
                        className={`p-4 rounded-xl border ${
                          isHead ? "bg-[#101b33] border-orange-500/50 shadow-md" : "bg-[#0b1222] border-[#1b2742]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-black/60 font-mono text-orange-300 font-bold">
                              {c.hash.slice(0, 7)}
                            </span>
                            <span className="text-white font-bold text-sm">{c.message}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {matchingBranches.map((bName) => (
                              <span
                                key={bName}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  bName === "main"
                                    ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                                    : "bg-purple-950 text-purple-400 border border-purple-800"
                                }`}
                              >
                                {bName}
                              </span>
                            ))}
                            {isHead && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                                HEAD
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 text-slate-400 text-[11px]">
                          Author: {c.author} · Parent: {c.parent?.slice(0, 7) || "root"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </LabLayout>
  );
}
