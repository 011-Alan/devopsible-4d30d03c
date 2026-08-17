// A tiny in-browser Git simulator. Not real Git — but the mental model is real:
// working tree -> staging area -> commits -> branches.

export type FileMap = Record<string, string>;

export interface Commit {
  hash: string;
  message: string;
  parent: string | null;
  tree: FileMap;
  author: string;
  timestamp: number;
}

export interface RepoState {
  initialized: boolean;
  cwd: string;
  workingTree: FileMap;
  staged: FileMap; // path -> content staged for next commit
  commits: Record<string, Commit>;
  branches: Record<string, string>; // name -> commit hash
  head: string; // branch name
  detached: string | null; // commit hash when detached
  remote: Record<string, string>; // branch -> hash on "DevOpsible Forge"
  tags: Record<string, string>;
}

export interface CommandResult {
  output: string;
  error?: boolean;
}

let hashSeed = 0;
function newHash() {
  hashSeed += 1;
  const base = (Date.now() + hashSeed * 7919).toString(16);
  return base.slice(-6).padStart(6, "0");
}

export function cloneState(s: RepoState): RepoState {
  return JSON.parse(JSON.stringify(s));
}

export function createRepo(files: FileMap, history: { message: string; files: FileMap }[]): RepoState {
  const state: RepoState = {
    initialized: true,
    cwd: "~/project",
    workingTree: { ...files },
    staged: {},
    commits: {},
    branches: {},
    head: "main",
    detached: null,
    remote: {},
    tags: {},
  };

  let parent: string | null = null;
  let tree: FileMap = {};
  for (const step of history) {
    tree = { ...tree, ...step.files };
    const hash = newHash();
    state.commits[hash] = {
      hash,
      message: step.message,
      parent,
      tree: { ...tree },
      author: "nexa-team",
      timestamp: Date.now(),
    };
    parent = hash;
  }
  state.branches.main = parent!;
  state.remote.main = parent!;
  return state;
}

export function headCommit(s: RepoState): Commit | null {
  const hash = s.detached ?? s.branches[s.head];
  return hash ? s.commits[hash] ?? null : null;
}

export function commitTree(s: RepoState): FileMap {
  return headCommit(s)?.tree ?? {};
}

export function commitList(s: RepoState): Commit[] {
  const list: Commit[] = [];
  let c = headCommit(s);
  while (c) {
    list.push(c);
    c = c.parent ? s.commits[c.parent] : null;
  }
  return list;
}

export function changedFiles(s: RepoState) {
  const tree = commitTree(s);
  const untracked: string[] = [];
  const modified: string[] = [];
  const deleted: string[] = [];
  for (const path of Object.keys(s.workingTree)) {
    if (!(path in tree)) {
      if (!(path in s.staged)) untracked.push(path);
    } else if (tree[path] !== s.workingTree[path] && s.staged[path] !== s.workingTree[path]) {
      modified.push(path);
    }
  }
  for (const path of Object.keys(tree)) {
    if (!(path in s.workingTree)) deleted.push(path);
  }
  const stagedPaths = Object.keys(s.staged).filter((p) => s.staged[p] !== tree[p]);
  return { untracked, modified, deleted, staged: stagedPaths };
}

export function isClean(s: RepoState) {
  const c = changedFiles(s);
  return c.untracked.length === 0 && c.modified.length === 0 && c.deleted.length === 0 && c.staged.length === 0;
}

function diffText(a = "", b = "", path: string) {
  const al = a.split("\n");
  const bl = b.split("\n");
  const lines = [`diff --git a/${path} b/${path}`, `--- a/${path}`, `+++ b/${path}`];
  const max = Math.max(al.length, bl.length);
  for (let i = 0; i < max; i++) {
    if (al[i] === bl[i]) {
      if (al[i] !== undefined) lines.push(` ${al[i]}`);
    } else {
      if (al[i] !== undefined) lines.push(`-${al[i]}`);
      if (bl[i] !== undefined) lines.push(`+${bl[i]}`);
    }
  }
  return lines.join("\n");
}

function parse(input: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quote: string | null = null;
  for (const ch of input.trim()) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === " ") {
      if (cur) out.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

export function runCommand(state: RepoState, input: string): { state: RepoState; result: CommandResult } {
  const s = cloneState(state);
  const args = parse(input);
  if (args.length === 0) return { state: s, result: { output: "" } };

  const [cmd, ...rest] = args;

  const err = (output: string) => ({ state: s, result: { output, error: true } });
  const ok = (output: string) => ({ state: s, result: { output } });

  if (cmd === "pwd") return ok("/home/student/project");
  if (cmd === "clear") return ok("__CLEAR__");
  if (cmd === "ls") {
    const dir = rest.find((a) => !a.startsWith("-")) ?? "";
    const showAll = rest.some((a) => a.startsWith("-") && a.includes("a"));
    const prefix = dir && dir !== "." ? dir.replace(/\/$/, "") + "/" : "";
    const entries = new Set<string>();
    for (const p of Object.keys(s.workingTree)) {
      if (!p.startsWith(prefix)) continue;
      const remainder = p.slice(prefix.length);
      const seg = remainder.split("/")[0];
      if (remainder.includes("/")) entries.add(seg + "/");
      else entries.add(seg);
    }
    if (showAll && !prefix) entries.add(".git/");
    if (entries.size === 0) return err(`ls: cannot access '${dir}': No such file or directory`);
    return ok([...entries].sort().join("  "));
  }
  if (cmd === "cat") {
    const path = rest[0];
    if (!path || !(path in s.workingTree)) return err(`cat: ${path ?? ""}: No such file or directory`);
    return ok(s.workingTree[path]);
  }
  if (cmd === "echo") return ok(rest.join(" "));
  if (cmd === "rm") {
    const path = rest.find((a) => !a.startsWith("-"));
    if (!path || !(path in s.workingTree)) return err(`rm: cannot remove '${path ?? ""}': No such file or directory`);
    delete s.workingTree[path];
    return ok("");
  }
  if (cmd === "help") {
    return ok("Available: pwd, ls, cat, rm, clear, git <subcommand>\nGit: status, log, show, diff, add, commit, branch, switch, checkout, restore, merge, push, tag, help");
  }
  if (cmd !== "git") return err(`${cmd}: command not found`);

  const [sub, ...gargs] = rest;
  const tree = commitTree(s);

  switch (sub) {
    case undefined:
    case "help":
      return ok(
        "usage: git <command>\n\n  status     Show the working tree status\n  log        Show commit history\n  show       Show a commit\n  diff       Show changes\n  add        Stage changes\n  commit     Record staged changes\n  branch     List or create branches\n  switch     Change branches\n  checkout   Change branches / restore files\n  restore    Restore working tree files\n  merge      Join two histories\n  push       Update the remote\n  tag        Create a tag"
      );

    case "init":
      return ok("Reinitialized existing Git repository in /home/student/project/.git/");

    case "status": {
      const c = changedFiles(s);
      const lines = [s.detached ? `HEAD detached at ${s.detached}` : `On branch ${s.head}`];
      if (c.staged.length) {
        lines.push("", "Changes to be committed:");
        c.staged.forEach((p) => lines.push(`\t${p in tree ? "modified" : "new file"}:   ${p}`));
      }
      if (c.modified.length || c.deleted.length) {
        lines.push("", "Changes not staged for commit:");
        c.modified.forEach((p) => lines.push(`\tmodified:   ${p}`));
        c.deleted.forEach((p) => lines.push(`\tdeleted:    ${p}`));
      }
      if (c.untracked.length) {
        lines.push("", "Untracked files:");
        c.untracked.forEach((p) => lines.push(`\t${p}`));
      }
      if (isClean(s)) lines.push("", "nothing to commit, working tree clean");
      return ok(lines.join("\n"));
    }

    case "log": {
      const list = commitList(s);
      if (gargs.includes("--oneline")) return ok(list.map((c) => `${c.hash} ${c.message}`).join("\n"));
      return ok(
        list
          .map((c) => `commit ${c.hash}\nAuthor: ${c.author}\n\n    ${c.message}\n`)
          .join("\n") || "fatal: your current branch does not have any commits yet"
      );
    }

    case "show": {
      const target = gargs[0] ?? headCommit(s)?.hash;
      const c = target ? s.commits[target] : null;
      if (!c) return err(`fatal: bad object ${target}`);
      const parentTree = c.parent ? s.commits[c.parent].tree : {};
      const diffs = Object.keys(c.tree)
        .filter((p) => c.tree[p] !== parentTree[p])
        .map((p) => diffText(parentTree[p] ?? "", c.tree[p], p));
      return ok(`commit ${c.hash}\nAuthor: ${c.author}\n\n    ${c.message}\n\n${diffs.join("\n")}`);
    }

    case "diff": {
      const staged = gargs.includes("--staged") || gargs.includes("--cached");
      const parts: string[] = [];
      for (const p of Object.keys(s.workingTree)) {
        const from = staged ? tree[p] ?? "" : s.staged[p] ?? tree[p] ?? "";
        const to = staged ? s.staged[p] ?? tree[p] ?? "" : s.workingTree[p];
        if (from !== to) parts.push(diffText(from, to, p));
      }
      return ok(parts.join("\n"));
    }

    case "add": {
      if (gargs.length === 0) return err("Nothing specified, nothing added.");
      const targets = gargs[0] === "." || gargs[0] === "-A" ? Object.keys(s.workingTree) : gargs;
      for (const p of targets) {
        if (!(p in s.workingTree)) return err(`fatal: pathspec '${p}' did not match any files`);
        s.staged[p] = s.workingTree[p];
      }
      return ok("");
    }

    case "restore": {
      const targets = gargs.filter((a) => !a.startsWith("-"));
      const unstage = gargs.includes("--staged");
      for (const p of targets.length ? targets : Object.keys(tree)) {
        if (unstage) delete s.staged[p];
        else if (p in tree) s.workingTree[p] = tree[p];
      }
      return ok("");
    }

    case "commit": {
      const mIndex = gargs.findIndex((a) => a === "-m" || a === "-am");
      const message = mIndex >= 0 ? gargs[mIndex + 1] : undefined;
      if (!message) return err('error: please supply a message with -m "your message"');
      if (gargs[mIndex] === "-am") {
        for (const p of Object.keys(s.workingTree)) if (p in tree) s.staged[p] = s.workingTree[p];
      }
      const stagedPaths = Object.keys(s.staged).filter((p) => s.staged[p] !== tree[p]);
      if (stagedPaths.length === 0) return err("nothing to commit, working tree clean");
      const hash = newHash();
      const newTree = { ...tree, ...s.staged };
      s.commits[hash] = {
        hash,
        message,
        parent: headCommit(s)?.hash ?? null,
        tree: newTree,
        author: "you",
        timestamp: Date.now(),
      };
      if (s.detached) s.detached = hash;
      else s.branches[s.head] = hash;
      s.staged = {};
      return ok(`[${s.head} ${hash}] ${message}\n ${stagedPaths.length} file(s) changed`);
    }

    case "branch": {
      const name = gargs.find((a) => !a.startsWith("-"));
      if (gargs.includes("-d") || gargs.includes("-D")) {
        if (!name || !(name in s.branches)) return err(`error: branch '${name}' not found.`);
        delete s.branches[name];
        return ok(`Deleted branch ${name}`);
      }
      if (!name) {
        return ok(
          Object.keys(s.branches)
            .sort()
            .map((b) => `${b === s.head ? "* " : "  "}${b}`)
            .join("\n")
        );
      }
      if (name in s.branches) return err(`fatal: a branch named '${name}' already exists`);
      s.branches[name] = headCommit(s)?.hash ?? "";
      return ok("");
    }

    case "switch":
    case "checkout": {
      const create = gargs.includes("-c") || gargs.includes("-b");
      const name = gargs.find((a) => !a.startsWith("-"));
      if (!name) return err("fatal: missing branch name");
      if (create) {
        if (name in s.branches) return err(`fatal: a branch named '${name}' already exists`);
        s.branches[name] = headCommit(s)?.hash ?? "";
        s.head = name;
        s.detached = null;
        return ok(`Switched to a new branch '${name}'`);
      }
      if (name in s.branches) {
        s.head = name;
        s.detached = null;
        s.workingTree = { ...s.commits[s.branches[name]].tree };
        s.staged = {};
        return ok(`Switched to branch '${name}'`);
      }
      if (name in s.commits) {
        s.detached = name;
        s.workingTree = { ...s.commits[name].tree };
        return ok(`Note: switching to '${name}'.\nYou are in 'detached HEAD' state.`);
      }
      return err(`fatal: invalid reference: ${name}`);
    }

    case "merge": {
      const name = gargs.find((a) => !a.startsWith("-"));
      if (!name || !(name in s.branches)) return err(`merge: ${name} - not something we can merge`);
      const source = s.commits[s.branches[name]];
      const current = headCommit(s);
      if (!current) return err("fatal: no current commit");
      if (source.hash === current.hash) return ok("Already up to date.");
      const merged = { ...current.tree, ...source.tree };
      const hash = newHash();
      s.commits[hash] = {
        hash,
        message: `Merge branch '${name}' into ${s.head}`,
        parent: current.hash,
        tree: merged,
        author: "you",
        timestamp: Date.now(),
      };
      s.branches[s.head] = hash;
      s.workingTree = { ...merged };
      return ok(`Updating ${current.hash}..${source.hash}\nFast-forward\nMerge made by the 'ort' strategy.`);
    }

    case "revert": {
      const target = gargs.find((a) => !a.startsWith("-"));
      const c = target ? s.commits[target] : null;
      if (!c) return err(`fatal: bad revision '${target}'`);
      const parentTree = c.parent ? s.commits[c.parent].tree : {};
      const restored = { ...commitTree(s) };
      for (const p of Object.keys(c.tree)) if (p in parentTree) restored[p] = parentTree[p];
      const hash = newHash();
      s.commits[hash] = {
        hash,
        message: `Revert "${c.message}"`,
        parent: headCommit(s)?.hash ?? null,
        tree: restored,
        author: "you",
        timestamp: Date.now(),
      };
      s.branches[s.head] = hash;
      s.workingTree = { ...restored };
      s.staged = {};
      return ok(`[${s.head} ${hash}] Revert "${c.message}"`);
    }

    case "push": {
      const branch = gargs[1] ?? s.head;
      if (!(branch in s.branches)) return err(`error: src refspec ${branch} does not match any`);
      s.remote[branch] = s.branches[branch];
      return ok(
        `Enumerating objects: 5, done.\nWriting objects: 100% (5/5), done.\nTo forge.devopsible.local:nexa/web-app.git\n   ${branch} -> ${branch}\n✓ Push successful`
      );
    }

    case "remote":
      return ok("origin\tgit@forge.devopsible.local:nexa/web-app.git (fetch)\norigin\tgit@forge.devopsible.local:nexa/web-app.git (push)");

    case "tag": {
      const name = gargs.find((a) => !a.startsWith("-"));
      if (!name) return ok(Object.keys(s.tags).join("\n"));
      s.tags[name] = headCommit(s)?.hash ?? "";
      return ok("");
    }

    default:
      return err(`git: '${sub}' is not a git command. See 'git help'.`);
  }
}
