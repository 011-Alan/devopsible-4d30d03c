export type StageStatus = "queued" | "running" | "success" | "failed" | "skipped";
export type LabStatus = "idle" | "provisioning" | "ready" | "running" | "completed" | "destroyed";

export type PipelineStage = {
  id: string;
  name: string;
  status: StageStatus;
  duration?: string;
};

export type Build = {
  id: number;
  branch: string;
  commit: string;
  status: StageStatus;
  startedAt: string;
  duration: string;
};

export type Artifact = { name: string; size: string; fingerprint: string };

export type JenkinsLabState = {
  status: LabStatus;
  jobName: string;
  buildNumber: number;
  stages: PipelineStage[];
  builds: Build[];
  console: string[];
  artifacts: Artifact[];
  credentials: string[];
  actions: string[];
};

export type JenkinsMission = {
  id: string;
  title: string;
  problem: string;
  objective: string;
  difficulty: "Foundations" | "Intermediate" | "Advanced";
  xp: number;
  hints: string[];
  requiredActions: string[];
  successMessage: string;
};

export type JenkinsLevel = {
  id: number;
  title: string;
  role: string;
  badge: string;
  story: string;
  concepts: string[];
  missions: JenkinsMission[];
};

export type JenkinsProgress = {
  xp: number;
  completed: Record<string, number>;
  badges: string[];
};

export type ValidationResult = {
  success: boolean;
  xpEarned: number;
  message: string;
};