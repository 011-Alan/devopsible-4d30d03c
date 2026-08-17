import { createRepo, isClean, commitList, changedFiles, type RepoState } from "./engine";

export interface Mission {
  id: string;
  title: string;
  brief: string;
  objectives: string[];
  hints: string[];
  xp: number;
  /** Validation inspects repository state — never the exact command typed. */
  validate: (state: RepoState, log: string[]) => boolean;
  done: string;
}

export interface Level {
  id: number;
  title: string;
  emoji: string;
  role: string;
  badge: string;
  story: string;
  concepts: { heading: string; body: string }[];
  setup: () => RepoState;
  missions: Mission[];
  available: boolean;
}

const README = `# Nexa Web

The marketing site for Nexa.

## Getting started

    npm install
    npm run dev
`;

const APP_JS = `const app = document.querySelector("#app");

function render() {
  app.innerHTML = "<h1>Nexa</h1>";
}

render();
`;

const INDEX_HTML = `<!doctype html>
<html>
  <head><title>Nexa</title></head>
  <body><div id="app"></div></body>
</html>
`;

const STYLES = `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #0b0b0c;
  color: #f5f5f5;
}
`;

const LOGIN_JS = `export function login(email, password) {
  if (!email) return false;
  return password.length > 0;
}
`;

const baseRepo = () =>
  createRepo(
    {
      "README.md": README,
      "index.html": INDEX_HTML,
      "styles.css": STYLES,
      "app.js": APP_JS,
      ".gitignore": "node_modules\ndist\n",
    },
    [
      { message: "Initial project", files: { "README.md": README, ".gitignore": "node_modules\ndist\n" } },
      { message: "Add landing page markup", files: { "index.html": INDEX_HTML, "styles.css": STYLES } },
      { message: "Render the Nexa hero", files: { "app.js": APP_JS } },
    ]
  );

const typed = (log: string[], re: RegExp) => log.some((l) => re.test(l.trim()));

export const levels: Level[] = [
  {
    id: 1,
    title: "Welcome to the Repo",
    emoji: "👋",
    role: "New Developer",
    badge: "🟢 First Commit",
    story:
      "Welcome to Nexa. You just joined as a junior engineer and you've been handed the keys to the team's repository. Before you touch a single line of code, get your bearings.",
    concepts: [
      {
        heading: "What a repository actually is",
        body: "A repository is a project folder plus a hidden .git directory that stores every version of every file. Deleting .git turns it back into an ordinary folder.",
      },
      {
        heading: "Working directory",
        body: "The files you can see and edit are the working directory. Git compares them against the last recorded snapshot to tell you what changed.",
      },
      {
        heading: "Ask before you act",
        body: "git status answers 'where am I and what changed?'. git log answers 'how did we get here?'. Real engineers run both constantly.",
      },
    ],
    setup: baseRepo,
    missions: [
      {
        id: "l1m1",
        title: "Find your feet",
        brief: "Confirm where you are in the filesystem and what the project contains.",
        objectives: ["Print the current directory", "List the project files"],
        hints: ["Two classic shell commands, nothing Git-specific yet.", "One tells you the path, one lists files.", "Try pwd and then ls."],
        xp: 50,
        done: "You're standing in /home/student/project — the Nexa web app.",
        validate: (_s, log) => typed(log, /^pwd$/) && typed(log, /^ls\b/),
      },
      {
        id: "l1m2",
        title: "Inspect the repository",
        brief: "Which branch are you on? Is the working tree clean? How many commits exist?",
        objectives: ["Check the repository status", "Read the commit history"],
        hints: ["Git can report the state of your working tree.", "Another command prints the history of snapshots.", "git status, then git log."],
        xp: 100,
        done: "Branch main, clean tree, three commits. You now know more than most new hires on day one.",
        validate: (_s, log) => typed(log, /^git\s+status$/) && typed(log, /^git\s+log/),
      },
    ],
    available: true,
  },
  {
    id: 2,
    title: "Commit to It",
    emoji: "📝",
    role: "Junior Developer",
    badge: "✅ Committer",
    story:
      "Design shipped a copy change: the hero must read 'Nexa — ship faster'. Edit app.js in the explorer, then prepare the change for review.",
    concepts: [
      {
        heading: "Three areas",
        body: "Working directory → staging area (index) → repository. git add promotes changes to staging; git commit records staged changes permanently.",
      },
      {
        heading: "Why staging exists",
        body: "It lets you build a commit deliberately, choosing which changes belong together instead of dumping everything at once.",
      },
      {
        heading: "Good messages",
        body: "Write what the change does, in the imperative: 'Update hero copy', not 'changed stuff'.",
      },
    ],
    setup: baseRepo,
    missions: [
      {
        id: "l2m1",
        title: "See what you changed",
        brief: "Edit app.js so the hero renders 'Nexa — ship faster', then review the difference before staging it.",
        objectives: ["app.js contains the new hero copy", "Inspect the change"],
        hints: ["Use the file explorer to edit app.js.", "Git can show you line-by-line changes.", "Try git diff."],
        xp: 75,
        done: "You reviewed your own diff. Do this before every commit.",
        validate: (s, log) => (s.workingTree["app.js"] ?? "").includes("ship faster") && typed(log, /^git\s+diff/),
      },
      {
        id: "l2m2",
        title: "Record the change",
        brief: "Stage the change and commit it with a meaningful message.",
        objectives: ["Nothing left unstaged", "A new commit exists on main"],
        hints: ["First promote the change to the staging area.", "Then record it permanently with a message.", 'git add app.js then git commit -m "Update hero copy".'],
        xp: 125,
        done: "Your first commit at Nexa is in the history. 🟢",
        validate: (s) => commitList(s).length > 3 && isClean(s),
      },
    ],
    available: true,
  },
  {
    id: 3,
    title: "Time Travel",
    emoji: "⏪",
    role: "Junior Developer",
    badge: "🕰️ Time Traveller",
    story:
      "The login page worked yesterday. This morning it lets anyone in with an empty password. Someone shipped a bad change — find it and restore a working state.",
    concepts: [
      {
        heading: "History is a chain",
        body: "Every commit points at its parent. Walking backwards from HEAD gives you the full story of the project.",
      },
      {
        heading: "Inspecting a commit",
        body: "git show <hash> prints a commit's message and exactly which lines it added or removed.",
      },
      {
        heading: "Undo without rewriting",
        body: "git revert <hash> creates a NEW commit that undoes an old one. Safe on shared branches, unlike deleting history.",
      },
    ],
    setup: () =>
      createRepo(
        {
          "README.md": README,
          "index.html": INDEX_HTML,
          "app.js": APP_JS,
          "src/login.js": LOGIN_JS.replace("if (!email) return false;\n  return password.length > 0;", "if (!email) return false;\n  return true; // TODO: re-add password check"),
        },
        [
          { message: "Initial project", files: { "README.md": README, "index.html": INDEX_HTML, "app.js": APP_JS } },
          { message: "Add login validation", files: { "src/login.js": LOGIN_JS } },
          {
            message: "Speed up login flow",
            files: {
              "src/login.js": LOGIN_JS.replace(
                "if (!email) return false;\n  return password.length > 0;",
                "if (!email) return false;\n  return true; // TODO: re-add password check"
              ),
            },
          },
        ]
      ),
    missions: [
      {
        id: "l3m1",
        title: "Find the culprit",
        brief: "Walk the history and open the commit that changed src/login.js most recently.",
        objectives: ["Read the history", "Show the offending commit"],
        hints: ["List the commits first.", "Then open one by its hash.", "git log --oneline, then git show <hash>."],
        xp: 100,
        done: "Found it: 'Speed up login flow' removed the password check.",
        validate: (_s, log) => typed(log, /^git\s+log/) && typed(log, /^git\s+show\s+\w+/),
      },
      {
        id: "l3m2",
        title: "Restore a working login",
        brief: "Undo the bad change so login.js validates passwords again — without deleting history.",
        objectives: ["src/login.js checks password length again", "The fix is recorded as a commit"],
        hints: ["You could edit the file, or let Git undo the commit for you.", "There's a command that creates an inverse commit.", "git revert <hash> of the bad commit."],
        xp: 200,
        done: "Production is safe again, and the history still tells the truth.",
        validate: (s) => (s.workingTree["src/login.js"] ?? "").includes("password.length > 0") && isClean(s),
      },
    ],
    available: true,
  },
  {
    id: 4,
    title: "Branch Out",
    emoji: "🌿",
    role: "Branch Wrangler",
    badge: "🌿 Branch Manager",
    story:
      "Nexa wants a payments feature, but main must stay deployable at all times. Do the work somewhere else.",
    concepts: [
      { heading: "A branch is a pointer", body: "Branches are just movable labels pointing at a commit. Creating one is instant and costs nothing." },
      { heading: "switch vs checkout", body: "git switch is the modern, focused way to change branches. git checkout still works and does more (files, commits, branches)." },
      { heading: "Isolation", body: "Commits on feature/payments do not touch main until you merge them." },
    ],
    setup: baseRepo,
    missions: [
      {
        id: "l4m1",
        title: "Open a feature branch",
        brief: "Create a branch called feature/payments and start working on it.",
        objectives: ["Branch feature/payments exists", "You are on it"],
        hints: ["You can create and switch in one step.", "The flag is -c on switch (or -b on checkout).", "git switch -c feature/payments"],
        xp: 100,
        done: "You're isolated from main. Break whatever you like.",
        validate: (s) => "feature/payments" in s.branches && s.head === "feature/payments",
      },
      {
        id: "l4m2",
        title: "Ship the feature",
        brief: "Create src/payment.js with a checkout function, commit it, then return to main and confirm main is untouched.",
        objectives: ["src/payment.js committed on feature/payments", "Back on main", "main has no payment.js"],
        hints: ["Add the file in the explorer, then stage and commit.", "Switch back with git switch main.", "git add . && git commit -m \"Add payment module\" then git switch main"],
        xp: 200,
        done: "Feature branch has the work, main is pristine. That's the whole point of branching.",
        validate: (s) => {
          const fb = s.branches["feature/payments"];
          const mb = s.branches["main"];
          return (
            !!fb && !!mb && "src/payment.js" in (s.commits[fb]?.tree ?? {}) && !("src/payment.js" in (s.commits[mb]?.tree ?? {})) && s.head === "main"
          );
        },
      },
    ],
    available: true,
  },
  {
    id: 5,
    title: "Parallel Universes",
    emoji: "🤝",
    role: "Team Contributor",
    badge: "🔀 Integrator",
    story:
      "While you built payments, a teammate finished feature/login. Both branches are ready. Bring them together on main and publish to the Forge.",
    concepts: [
      { heading: "Merging", body: "git merge takes the work from another branch and joins it into your current branch, creating a merge commit when needed." },
      { heading: "Remotes", body: "origin is just a nickname for another copy of the repository — here, DevOpsible Forge." },
      { heading: "Push", body: "git push uploads your branch's commits to the remote so the rest of the team can see them." },
    ],
    setup: () => {
      const s = baseRepo();
      const parent = s.branches.main;
      const hash = "a81f32";
      s.commits[hash] = {
        hash,
        message: "Add login validation",
        parent,
        tree: { ...s.commits[parent].tree, "src/login.js": LOGIN_JS },
        author: "sarah",
        timestamp: Date.now(),
      };
      s.branches["feature/login"] = hash;
      return s;
    },
    missions: [
      {
        id: "l5m1",
        title: "Integrate the login branch",
        brief: "From main, merge feature/login so its work lands on the mainline.",
        objectives: ["main contains src/login.js", "You are on main"],
        hints: ["Merges happen INTO the branch you're standing on.", "Switch to main first.", "git switch main then git merge feature/login"],
        xp: 150,
        done: "Sarah's login work is now part of main.",
        validate: (s) => s.head === "main" && "src/login.js" in (s.commits[s.branches.main]?.tree ?? {}),
      },
      {
        id: "l5m2",
        title: "Publish to the Forge",
        brief: "Push main to origin so the team's Forge shows the merged history.",
        objectives: ["Remote main matches local main"],
        hints: ["Send commits upward to the remote.", "The remote is called origin.", "git push origin main"],
        xp: 150,
        done: "Forge updated. 🚀 The rest of Nexa can pull your work.",
        validate: (s) => s.remote.main === s.branches.main,
      },
    ],
    available: true,
  },
  {
    id: 6,
    title: "Merge Mayhem",
    emoji: "💥",
    role: "Merge Specialist",
    badge: "🩹 Conflict Solver",
    story: "Two developers edited the same line of src/payment.js. Resolve the conflict and complete the merge.",
    concepts: [],
    setup: baseRepo,
    missions: [],
    available: false,
  },
  { id: 7, title: "The Rebase", emoji: "🧙", role: "Git Historian", badge: "🧙 History Bender", story: "Rewrite your branch on top of main for a clean history.", concepts: [], setup: baseRepo, missions: [], available: false },
  { id: 8, title: "Remote Control", emoji: "🌐", role: "Remote Runner", badge: "🌐 Remote Runner", story: "Your teammate pushed while you were working. Reconcile the histories.", concepts: [], setup: baseRepo, missions: [], available: false },
  { id: 9, title: "Pull Request Protocol", emoji: "🔀", role: "Reviewer", badge: "🔀 Reviewer", story: "Open a PR on the Forge and handle review feedback.", concepts: [], setup: baseRepo, missions: [], available: false },
  { id: 10, title: "Git Detective", emoji: "🕵️", role: "Incident Detective", badge: "🕵️ Detective", story: "Production incident: find the commit that broke authentication.", concepts: [], setup: baseRepo, missions: [], available: false },
  { id: 11, title: "Git Surgery", emoji: "🩺", role: "Git Surgeon", badge: "🩺 Surgeon", story: "Stash, cherry-pick, reset and revert under pressure.", concepts: [], setup: baseRepo, missions: [], available: false },
  { id: 12, title: "Ship It", emoji: "🚀", role: "Release Engineer", badge: "🏆 Git Engineer", story: "The full loop: branch, commit, push, review, merge, tag v1.0.0.", concepts: [], setup: baseRepo, missions: [], available: false },
];

export const RANKS = [
  { xp: 0, name: "Rookie" },
  { xp: 500, name: "Committer" },
  { xp: 1200, name: "Brancher" },
  { xp: 2000, name: "Collaborator" },
  { xp: 3000, name: "Integrator" },
  { xp: 4500, name: "Conflict Solver" },
  { xp: 6000, name: "History Bender" },
  { xp: 8000, name: "Remote Runner" },
  { xp: 10000, name: "Reviewer" },
  { xp: 13000, name: "Git Detective" },
  { xp: 16000, name: "Git Surgeon" },
  { xp: 20000, name: "Git Engineer" },
];

export function rankFor(xp: number) {
  let current = RANKS[0];
  let next: (typeof RANKS)[number] | null = null;
  for (const r of RANKS) {
    if (xp >= r.xp) current = r;
    else {
      next = r;
      break;
    }
  }
  return { current, next };
}

/** Hints cost XP, but never enough to make quitting attractive. */
export function xpAfterHints(base: number, hintsUsed: number) {
  const factor = [1, 0.8, 0.6, 0.3][Math.min(hintsUsed, 3)];
  return Math.round(base * factor);
}

export { changedFiles };
