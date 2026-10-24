export type StageStatus = "queued" | "running" | "success" | "failed" | "skipped";
export type LabReadiness = "stopped" | "provisioning" | "waiting-for-jenkins" | "ready" | "error";

export type PipelineStage = {
  id: string;
  name: string;
  status: StageStatus;
  duration?: string;
};

export type JenkinsBuild = {
  id: number;
  branch: string;
  commit: string;
  status: StageStatus;
  startedAt: string;
  duration: string;
  cause?: string;
};

export type JenkinsArtifact = {
  name: string;
  size: string;
  fingerprint: string;
};

export type JenkinsJob = {
  name: string;
  type: "freestyle" | "pipeline";
  stages: PipelineStage[];
  lastBuild?: JenkinsBuild;
  builds: JenkinsBuild[];
  console: string[];
  scm?: { url: string; branch: string };
  triggers?: string[];
  jenkinsfile?: string;
};

export type JenkinsLabState = {
  readiness: LabReadiness;
  jenkinsUrl: string;
  username: string;
  passwordHint: string;
  version: string;
  activeJob: string;
  jobs: Record<string, JenkinsJob>;
  artifacts: JenkinsArtifact[];
  credentials: string[];
  files: Record<string, string>;
  history: string[];
};

export type JenkinsCheck = {
  label: string;
  test: (state: JenkinsLabState) => boolean;
};

export type JenkinsMission = {
  id: string;
  title: string;
  scenario: string;
  problem: string;
  objective: string;
  difficulty: "Foundations" | "Intermediate" | "Advanced";
  xp: number;
  hints: string[];
  suggested: string[];
  checks: JenkinsCheck[];
  check: (state: JenkinsLabState) => boolean;
  successMessage: string;
};

export type JenkinsLevel = {
  id: number;
  title: string;
  role: string;
  badge: string;
  story: string;
  concepts: { heading: string; body: string }[];
  setup: () => JenkinsLabState;
  missions: JenkinsMission[];
};
