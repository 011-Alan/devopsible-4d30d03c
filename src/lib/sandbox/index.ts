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

export type LabMission<S> = {
  id: string;
  title: string;
  objective: string;
  hints: string[];
  xp: number;
  /** Validation reads environment state, never the typed command. */
  check: (state: S) => boolean;
};

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
 *  The provisioner must return `state` in the same shape as the local simulator so validators keep working. */
export function remoteBackend<S>(tool: string): SandboxBackend<S> {
  let sessionId: string | null = null;
  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("sandbox", { body: { tool, sessionId, ...body } });
    if (error) throw error;
    if (data?.sessionId) sessionId = data.sessionId;
    return data;
  };
  return {
    mode: "remote",
    start: async (levelId) => (await call({ action: "start", levelId })).state,
    reset: async (levelId) => (await call({ action: "reset", levelId })).state,
    exec: async (_s, command) => {
      const d = await call({ action: "exec", command });
      return { state: d.state, output: d.output ?? "", error: !!d.error };
    },
  };
}

export const SANDBOX_MODE = (import.meta.env.VITE_SANDBOX_MODE as string) === "remote" ? "remote" : "local";

export function pickBackend<S>(tool: string, engine: Engine<S>, levels: LabLevel<S>[]): SandboxBackend<S> {
  return SANDBOX_MODE === "remote" ? remoteBackend<S>(tool) : localBackend(engine, levels);
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
