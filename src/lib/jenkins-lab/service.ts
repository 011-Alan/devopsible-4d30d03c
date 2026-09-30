import type { JenkinsLabState, JenkinsMission, ValidationResult } from "./models";

export interface JenkinsLabService {
  create(levelId: number): JenkinsLabState;
  perform(state: JenkinsLabState, action: string): Promise<JenkinsLabState>;
  validate(state: JenkinsLabState, mission: JenkinsMission, xpEarned: number): Promise<ValidationResult>;
}

const baseStages = ["Checkout", "Install", "Build", "Test", "Package", "Deploy"];

function stageStatus(levelId: number, name: string) {
  if ((levelId === 1 || levelId === 3 || levelId === 6) && name === "Test") return "failed" as const;
  if (levelId === 11 && name === "Deploy") return "failed" as const;
  if (name === "Package" || name === "Deploy") return "skipped" as const;
  return "success" as const;
}

export const mockJenkinsLabService: JenkinsLabService = {
  create(levelId) {
    const failedStage = levelId === 11 ? "Deploy" : "Test";
    return {
      status: "idle",
      jobName: "nexa-web-main",
      buildNumber: 42 + levelId,
      stages: baseStages.map((name) => ({ id: name.toLowerCase(), name, status: stageStatus(levelId, name), duration: name === "Deploy" ? "—" : `${12 + name.length}s` })),
      builds: [
        { id: 42 + levelId, branch: "main", commit: "a7f3c2d", status: "failed", startedAt: "2 min ago", duration: "1m 42s" },
        { id: 41 + levelId, branch: "main", commit: "9e21ba0", status: "success", startedAt: "Yesterday", duration: "2m 08s" },
        { id: 40 + levelId, branch: "feature/checkout", commit: "3bc61f8", status: "success", startedAt: "2 days ago", duration: "1m 56s" },
      ],
      console: [
        "Started by GitHub push by maya@nexa.dev",
        "Checking out a7f3c2d on main",
        "[Pipeline] stage (Install) — dependencies restored",
        "[Pipeline] stage (Build) — bundle compiled",
        `[Pipeline] stage (${failedStage}) — process exited with code 1`,
        failedStage === "Deploy" ? "ERROR: credential 'nexa-prod-token' was not bound" : "FAIL src/checkout.test.ts — expected 200, received 500",
        "Finished: FAILURE",
      ],
      artifacts: [],
      credentials: ["nexa-staging-token"],
      actions: [],
    };
  },

  async perform(state, action) {
    await new Promise((resolve) => window.setTimeout(resolve, action === "run-build" ? 900 : 220));
    const actions = state.actions.includes(action) ? state.actions : [...state.actions, action];
    let stages = state.stages;
    let builds = state.builds;
    let consoleLines = state.console;
    let artifacts = state.artifacts;
    let credentials = state.credentials;
    let buildNumber = state.buildNumber;

    const stageForAction: Record<string, string> = {
      "enable-install": "Install", "enable-build": "Build", "enable-test": "Test",
      "enable-package": "Package", "enable-deploy": "Deploy",
    };
    const target = stageForAction[action];
    if (target) stages = stages.map((stage) => stage.name === target ? { ...stage, status: "queued" } : stage);
    if (action === "add-credential" && !credentials.includes("nexa-deploy-token")) credentials = [...credentials, "nexa-deploy-token"];
    if (action === "bind-production" && !credentials.includes("nexa-prod-token")) credentials = [...credentials, "nexa-prod-token"];
    if (action === "archive-artifact" && artifacts.length === 0) artifacts = [{ name: "nexa-web-1.0.0.tgz", size: "4.8 MB", fingerprint: "7c9e…21af" }];
    if (action === "apply-fix") {
      stages = stages.map((stage) => stage.status === "failed" ? { ...stage, status: "queued" } : stage);
      consoleLines = [...consoleLines, "Configuration patch applied and saved."];
    }
    if (action === "run-build") {
      buildNumber += 1;
      stages = stages.map((stage) => ({ ...stage, status: stage.status === "skipped" ? "skipped" : "success", duration: `${10 + stage.name.length}s` }));
      builds = [{ id: buildNumber, branch: "main", commit: "d84c1be", status: "success", startedAt: "Just now", duration: "1m 38s" }, ...builds];
      consoleLines = [...consoleLines, `Build #${buildNumber} started`, "All configured stages completed", "Finished: SUCCESS"];
    }

    return { ...state, status: "running", actions, stages, builds, console: consoleLines, artifacts, credentials, buildNumber };
  },

  async validate(state, mission, xpEarned) {
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    const success = mission.requiredActions.every((action) => state.actions.includes(action));
    return {
      success,
      xpEarned: success ? xpEarned : 0,
      message: success ? mission.successMessage : "The lab is not ready for validation yet. Review the objective and inspect the workspace.",
    };
  },
};