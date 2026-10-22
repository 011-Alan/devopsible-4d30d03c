import { supabase } from "@/integrations/supabase/client";

/** Shared contract for every interactive lab (Docker, Kubernetes, ...).
 *  Local = in-browser simulator. Remote = real cloud sandbox via the `sandbox` backend function. */
export type ExecResult<S> = { state: S; output: string; error?: boolean };

export interface SandboxBackend<S> {
  readonly mode: "local" | "remote";
  start(levelId: number): Promise<S>;
  exec(state: S, command: string): Promise<ExecResult<S>>;
  reset(levelId: number): Promise<S>;
}

/** One objective line on the mission checklist — verified against live environment state. */
export type LabCheck<S> = { label: string; test: (state: S) => boolean };

export type LabMission<S> = {
  id: string;
  title: string;
  objective: string;
  hints: string[];
  xp: number;
  /** Validation reads environment state, never the typed command. */
  check: (state: S) => boolean;
  /** Story shown in the BRIEFING box (defaults to the level story). */
  briefing?: string;
  /** Objective checklist shown in the UI; when present, check() should be allChecked(checks). */
  checks?: LabCheck<S>[];
  /** Suggested command chips. */
  suggested?: string[];
  docs?: { label: string; href: string }[];
};

export const allChecked = <S,>(checks: LabCheck<S>[]) => (state: S) => checks.every((c) => c.test(state));

export type LabLevel<S> = {
  id: number;
  title: string;
  story: string;
  concepts: { term: string; meaning: string }[];
  badge: string;
  missions: LabMission<S>[];
  setup: () => S;
};

export type LabProgress = { xp: number; completed: Record<string, number>; badges: string[] };

export const LEVEL_BONUS = 250;
const HINT_MULTIPLIERS = [1, 0.8, 0.6, 0.3];
export const xpAfterHints = (xp: number, hintsUsed: number) =>
  Math.round(xp * HINT_MULTIPLIERS[Math.min(hintsUsed, HINT_MULTIPLIERS.length - 1)]);

export type Engine<S> = (state: S, command: string) => ExecResult<S>;

export function localBackend<S>(engine: Engine<S>, levels: LabLevel<S>[]): SandboxBackend<S> {
  const setup = (id: number) => levels.find((l) => l.id === id)!.setup();
  return {
    mode: "local",
    start: async (id) => setup(id),
    reset: async (id) => setup(id),
    exec: async (state, cmd) => engine(state, cmd),
  };
}

/** Talks to the `sandbox` backend function, which forwards to your cloud provisioner (e.g. AWS).
 *  The provisioner must return `state` in the same shape as the local simulator so validators keep working.
 *  If the backend has no cloud credentials configured yet (or is unreachable), `fallback` keeps the lab playable. */
export function remoteBackend<S>(tool: string, fallback?: SandboxBackend<S>): SandboxBackend<S> {
  let sessionId: string | null = null;
  let usingFallback = false;

  const call = async (body: Record<string, unknown>) => {
    if (usingFallback && fallback) return { __fallback: true };
    try {
      const { data, error } = await supabase.functions.invoke("sandbox", { body: { tool, sessionId, ...body } });
      if (error) throw error;
      if (data?.sessionId) sessionId = data.sessionId;
      if (data?.mode === "unconfigured" && fallback) {
        usingFallback = true;
        return { __fallback: true };
      }
      return data;
    } catch {
      if (fallback) {
        usingFallback = true;
        return { __fallback: true };
      }
      throw new Error("Cloud sandbox unavailable. Set VITE_SANDBOX_MODE=local or configure the cloud runner.");
    }
  };

  const withFallback = async <T,>(action: (b: SandboxBackend<S>) => Promise<T>): Promise<T> => {
    const data = await call(action.call ? {} : {});
    if (data?.__fallback && fallback) return action(fallback);
    throw new Error("unreachable");
  };

  return {
    mode: "remote",
    start: (levelId) =>
      (async () => {
        const d = await call({ action: "start", levelId });
        return d?.__fallback && fallback ? fallback.start(levelId) : d.state;
      })(),
    reset: (levelId) =>
      (async () => {
        const d = await call({ action: "reset", levelId });
        return d?.__fallback && fallback ? fallback.reset(levelId) : d.state;
      })(),
    exec: (_s, command) =>
      (async () => {
        const d = await call({ action: "exec", command });
        return d?.__fallback && fallback
          ? fallback.exec(_s, command)
          : { state: d.state, output: d.output ?? "", error: !!d.error };
      })(),
  };
}

export const SANDBOX_MODE = (import.meta.env.VITE_SANDBOX_MODE as string) === "remote" ? "remote" : "local";

export function pickBackend<S>(tool: string, engine: Engine<S>, levels: LabLevel<S>[]): SandboxBackend<S> {
  const local = localBackend(engine, levels);
  return SANDBOX_MODE === "remote" ? remoteBackend<S>(tool, local) : local;
}

export function tokenize(cmd: string): string[] {
  return (cmd.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((t) => t.replace(/^["']|["']$/g, ""));
}

/** Extract `--flag value`, `--flag=value` and `-f value` style options. */
export function parseFlags(args: string[], withValue: string[]) {
  const flags: Record<string, string | true> = {};
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("-")) {
      const [k, v] = a.split("=", 2);
      if (v !== undefined) flags[k] = v;
      else if (withValue.includes(k) && args[i + 1] !== undefined) flags[k] = args[++i];
      else flags[k] = true;
    } else rest.push(a);
  }
  return { flags, rest };
}

/** Collect every `-e k=v` / `--env=k=v` style occurrence (parseFlags only keeps the last one). */
export function collectFlagPairs(args: string[], flag: string, longFlag?: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === flag && args[i + 1] !== undefined) out.push(args[++i]);
    else if (a.startsWith(`${flag}=`)) out.push(a.slice(flag.length + 1));
    else if (longFlag && a === longFlag && args[i + 1] !== undefined) out.push(args[++i]);
    else if (longFlag && a.startsWith(`${longFlag}=`)) out.push(a.slice(longFlag.length + 1));
  }
  return out;
}
