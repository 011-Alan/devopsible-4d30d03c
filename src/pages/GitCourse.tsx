import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { levels, rankFor, xpAfterHints, type Level, type Mission } from "@/lib/git-sim/levels";
import { runCommand, commitList, type RepoState } from "@/lib/git-sim/engine";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  FileCode,
  GitBranch,
  Lightbulb,
  Lock,
  RotateCcw,
  Terminal as TerminalIcon,
  Trophy,
} from "lucide-react";

type Progress = {
  xp: number;
  completed: Record<string, number>; // missionId -> xp awarded
  badges: string[];
};

const STORAGE_KEY = "devopsible.git.progress";

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { xp: 0, completed: {}, badges: [] };
}

type Line = { text: string; kind: "cmd" | "out" | "err" | "sys" };

export default function GitCourse() {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [levelId, setLevelId] = useState(1);
  const level = levels.find((l) => l.id === levelId)!;

  const [mode, setMode] = useState<"learn" | "practice" | "mission">("learn");
  const [repo, setRepo] = useState<RepoState>(() => level.setup());
  const [history, setHistory] = useState<string[]>([]);
  const [lines, setLines] = useState<Line[]>([{ text: "Sandbox ready. Type `help` to see what you can run.", kind: "sys" }]);
  const [input, setInput] = useState("");
  const [openFile, setOpenFile] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const resetLab = (l: Level = level) => {
    setRepo(l.setup());
    setHistory([]);
    setOpenFile(null);
    setLines([{ text: `Golden snapshot restored for Level ${l.id} — ${l.title}.`, kind: "sys" }]);
  };

  const selectLevel = (l: Level) => {
    if (!l.available) return;
    setLevelId(l.id);
    setMode("learn");
    resetLab(l);
  };

  const award = (mission: Mission) => {
    if (progress.completed[mission.id]) return;
    const xp = xpAfterHints(mission.xp, hintsUsed[mission.id] ?? 0);
    setProgress((p) => {
      const completed = { ...p.completed, [mission.id]: xp };
      const levelDone = level.missions.every((m) => completed[m.id]);
      return {
        xp: p.xp + xp + (levelDone ? 250 : 0),
        completed,
        badges: levelDone && !p.badges.includes(level.badge) ? [...p.badges, level.badge] : p.badges,
      };
    });
    setToast(`+${xp} XP — ${mission.title}`);
    setLines((ls) => [...ls, { text: `✓ ${mission.done}  (+${xp} XP)`, kind: "sys" }]);
    setTimeout(() => setToast(null), 3200);
  };

  const check = (state: RepoState, log: string[]) => {
    for (const m of level.missions) {
      if (!progress.completed[m.id] && m.validate(state, log)) award(m);
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
  };

  const saveFile = (path: string, content: string) => {
    const next = { ...repo, workingTree: { ...repo.workingTree, [path]: content } };
    setRepo(next);
    check(next, history);
  };

  const createFile = () => {
    const name = window.prompt("New file path", "src/payment.js");
    if (!name) return;
    const next = { ...repo, workingTree: { ...repo.workingTree, [name]: "" } };
    setRepo(next);
    setOpenFile(name);
    check(next, history);
  };

  const { current: rank, next: nextRank } = rankFor(progress.xp);
  const rankPct = nextRank ? Math.round(((progress.xp - rank.xp) / (nextRank.xp - rank.xp)) * 100) : 100;
  const levelMissionsDone = level.missions.filter((m) => progress.completed[m.id]).length;
  const commits = useMemo(() => commitList(repo), [repo]);
  const branch = repo.detached ? `HEAD@${repo.detached}` : repo.head;

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> All tools
          </Link>
          <div className="flex items-center gap-4 text-[12px]">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Trophy className="h-3.5 w-3.5" /> {progress.xp.toLocaleString()} XP
            </span>
            <span className="text-foreground font-medium">{rank.name}</span>
            <div className="hidden sm:block h-1 w-32 bg-muted overflow-hidden rounded-full">
              <div className="h-full bg-primary transition-all" style={{ width: `${rankPct}%` }} />
            </div>
            {nextRank && <span className="hidden sm:inline text-muted-foreground">next: {nextRank.name}</span>}
          </div>
        </div>

        <header className="mt-5 pb-5 border-b border-border">
          <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Course</p>
          <h1 className="mt-2 text-[26px] font-[500] tracking-[-0.02em] leading-tight">Git Yourself Up</h1>
          <p className="mt-2 text-[14px] text-muted-foreground max-w-[620px]">
            You're a junior engineer at Nexa. Twelve levels, one story: from your first day in the repo to shipping a
            tagged release. Every challenge is validated by inspecting the repository, not the commands you typed.
          </p>
        </header>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[210px_1fr] gap-6">
          {/* Level rail */}
          <aside className="space-y-px">
            {levels.map((l) => {
              const done = l.missions.length > 0 && l.missions.every((m) => progress.completed[m.id]);
              return (
                <button
                  key={l.id}
                  onClick={() => selectLevel(l)}
                  disabled={!l.available}
                  className={`w-full text-left px-3 py-2.5 border border-border flex items-center gap-2.5 transition-colors ${
                    l.id === levelId ? "bg-accent" : l.available ? "hover:bg-accent/50" : "opacity-45 cursor-not-allowed"
                  }`}
                >
                  <span className="text-[14px]">{l.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Level {l.id}</span>
                    <span className="block text-[12.5px] font-medium truncate">{l.title}</span>
                  </span>
                  {done ? <Check className="h-3.5 w-3.5 text-primary" /> : !l.available ? <Lock className="h-3 w-3 text-muted-foreground" /> : null}
                </button>
              );
            })}
            {progress.badges.length > 0 && (
              <div className="pt-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-2">Badges</p>
                <div className="flex flex-wrap gap-1.5">
                  {progress.badges.map((b) => (
                    <span key={b} className="text-[11px] border border-border px-2 py-1">{b}</span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <div className="min-w-0">
            {/* Story */}
            <div className="border border-border p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Level {level.id} · {level.role}
                  </p>
                  <h2 className="mt-1.5 text-[18px] font-medium">
                    {level.emoji} {level.title}
                  </h2>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {levelMissionsDone}/{level.missions.length} missions
                </span>
              </div>
              <p className="mt-3 text-[13.5px] leading-[1.7] text-muted-foreground max-w-[720px]">{level.story}</p>
            </div>

            {/* Modes */}
            <div className="mt-4 flex items-center gap-px border border-border w-fit">
              {([
                ["learn", "Learn", BookOpen],
                ["practice", "Practice", TerminalIcon],
                ["mission", "Mission", GitBranch],
              ] as const).map(([key, label, Icon]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] transition-colors ${
                    mode === key ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            {!level.available ? (
              <div className="mt-4 border border-dashed border-border p-10 text-center text-[13px] text-muted-foreground">
                Level {level.id} is still being built. Finish levels 1–5 in the meantime.
              </div>
            ) : mode === "learn" ? (
              <div className="mt-4 border border-border divide-y divide-border">
                {level.concepts.map((c, i) => (
                  <section key={c.heading} className="p-5">
                    <span className="text-[11px] font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="mt-1.5 text-[15px] font-medium">{c.heading}</h3>
                    <p className="mt-2 text-[13.5px] leading-[1.7] text-muted-foreground max-w-[680px]">{c.body}</p>
                  </section>
                ))}
                <div className="p-5">
                  <Button size="sm" className="h-8 text-[12.5px] gap-1.5" onClick={() => setMode("practice")}>
                    Try it yourself <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : mode === "mission" ? (
              <div className="mt-4 space-y-px">
                {level.missions.map((m) => {
                  const used = hintsUsed[m.id] ?? 0;
                  const complete = !!progress.completed[m.id];
                  return (
                    <div key={m.id} className="border border-border p-5">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-[15px] font-medium flex items-center gap-2">
                          {complete && <Check className="h-4 w-4 text-primary" />} {m.title}
                        </h3>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          Reward: +{xpAfterHints(m.xp, used)} XP
                        </span>
                      </div>
                      <p className="mt-2 text-[13.5px] leading-[1.7] text-muted-foreground">{m.brief}</p>
                      <ul className="mt-3 space-y-1">
                        {m.objectives.map((o) => (
                          <li key={o} className="text-[12.5px] text-muted-foreground flex items-center gap-2">
                            <span className="text-[11px]">{complete ? "☑" : "☐"}</span> {o}
                          </li>
                        ))}
                      </ul>
                      {!complete && (
                        <div className="mt-4">
                          {used > 0 && (
                            <div className="mb-2 space-y-1">
                              {m.hints.slice(0, used).map((h, i) => (
                                <p key={i} className="text-[12.5px] text-muted-foreground border-l-2 border-border pl-3">
                                  Hint {i + 1}: {h}
                                </p>
                              ))}
                            </div>
                          )}
                          {used < m.hints.length && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[12px] gap-1.5"
                              onClick={() => setHintsUsed((h) => ({ ...h, [m.id]: used + 1 }))}
                            >
                              <Lightbulb className="h-3.5 w-3.5" /> Need a hint?
                            </Button>
                          )}
                        </div>
                      )}
                      {complete && <p className="mt-3 text-[12.5px] text-primary">{m.done}</p>}
                    </div>
                  );
                })}
                <div className="border border-border p-5">
                  <Button size="sm" className="h-8 text-[12.5px] gap-1.5" onClick={() => setMode("practice")}>
                    Open the sandbox <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-px bg-border border border-border">
                {/* Explorer */}
                <div className="bg-background p-3 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Project explorer</p>
                    <button onClick={createFile} className="text-[11px] text-muted-foreground hover:text-foreground">+ new</button>
                  </div>
                  <div className="space-y-0.5">
                    {Object.keys(repo.workingTree)
                      .sort()
                      .map((path) => (
                        <button
                          key={path}
                          onClick={() => setOpenFile(path === openFile ? null : path)}
                          className={`w-full text-left px-2 py-1 text-[12.5px] font-mono flex items-center gap-1.5 transition-colors ${
                            openFile === path ? "bg-accent" : "hover:bg-accent/50"
                          }`}
                        >
                          <FileCode className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{path}</span>
                        </button>
                      ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-2">Forge · nexa/web-app</p>
                    <p className="text-[12px] font-mono">branch: {branch}</p>
                    <div className="mt-2 space-y-0.5">
                      {commits.slice(0, 5).map((c) => (
                        <p key={c.hash} className="text-[11.5px] font-mono text-muted-foreground truncate">
                          {c.hash} {c.message}
                        </p>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="mt-4 h-7 text-[12px] gap-1.5" onClick={() => resetLab()}>
                    <RotateCcw className="h-3.5 w-3.5" /> Restart lab
                  </Button>
                </div>

                {/* Editor + terminal */}
                <div className="bg-background flex flex-col min-w-0">
                  {openFile && (
                    <div className="border-b border-border p-3">
                      <p className="text-[11.5px] font-mono text-muted-foreground mb-2">{openFile}</p>
                      <Textarea
                        value={repo.workingTree[openFile] ?? ""}
                        onChange={(e) => saveFile(openFile, e.target.value)}
                        spellCheck={false}
                        className="font-mono text-[12.5px] min-h-[180px] bg-card resize-y"
                      />
                      <p className="mt-1.5 text-[11px] text-muted-foreground">Changes save to the working tree as you type.</p>
                    </div>
                  )}
                  <div
                    ref={scrollRef}
                    onClick={() => inputRef.current?.focus()}
                    className="flex-1 min-h-[320px] max-h-[460px] overflow-auto p-3 font-mono text-[12.5px] leading-[1.65] cursor-text"
                  >
                    {lines.map((l, i) => (
                      <pre
                        key={i}
                        className={`whitespace-pre-wrap break-words ${
                          l.kind === "cmd"
                            ? "text-foreground"
                            : l.kind === "err"
                            ? "text-destructive"
                            : l.kind === "sys"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {l.kind === "cmd" ? `student@git-lab:~/project$ ${l.text}` : l.text}
                      </pre>
                    ))}
                    <div className="flex items-center gap-2">
                      <span className="text-primary shrink-0">student@git-lab:~/project$</span>
                      <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            submit(input);
                            setInput("");
                          }
                        }}
                        spellCheck={false}
                        autoFocus
                        className="flex-1 bg-transparent outline-none border-0 text-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 border border-border bg-card px-4 py-3 text-[13px] font-medium shadow-lg">
          {toast}
        </div>
      )}
    </AppLayout>
  );
}
