import type { JenkinsLevel, JenkinsMission } from "./models";

const mission = (
  id: string,
  title: string,
  problem: string,
  objective: string,
  difficulty: JenkinsMission["difficulty"],
  xp: number,
  requiredActions: string[],
  hints: string[],
  successMessage: string,
): JenkinsMission => ({ id, title, problem, objective, difficulty, xp, requiredActions, hints, successMessage });

export const jenkinsLevels: JenkinsLevel[] = [
  {
    id: 1, title: "Welcome to the Factory", role: "Pipeline Recruit", badge: "Pipeline Recruit",
    story: "It is your first morning at Nexa. The web team needs you to understand the delivery factory before the next release train starts.",
    concepts: ["Jobs turn source changes into repeatable work.", "Build history is the audit trail for every pipeline run."],
    missions: [
      mission("j1m1", "Inspect the factory", "The team has handed you the nexa-web pipeline with no context.", "Open the job and inspect its latest build history.", "Foundations", 100, ["open-job", "view-history"], ["Start from Jobs.", "Build history shows the newest run first."], "You mapped the job to its latest build."),
      mission("j1m2", "Read the last run", "Build #42 failed overnight and the handover note is missing.", "Open the console and identify the failed Test stage.", "Foundations", 150, ["view-console", "inspect-test"], ["Failed stages are marked in red.", "The console preserves output in execution order."], "You traced the failure to the test gate."),
    ],
  },
  {
    id: 2, title: "Build It", role: "Build Engineer", badge: "Build Engineer",
    story: "Nexa needs a clean, reproducible build before anyone can trust the release artifact.",
    concepts: ["A build should start from a clean checkout.", "Artifacts are immutable outputs, not files left on an agent."],
    missions: [
      mission("j2m1", "Configure the build", "The job checks out code but never creates the application bundle.", "Enable Install and Build, then save the pipeline.", "Foundations", 150, ["enable-install", "enable-build", "save-pipeline"], ["Dependencies must be installed before compiling.", "Save the pipeline after changing its stages."], "The pipeline now produces a reproducible build."),
      mission("j2m2", "Archive the bundle", "Successful builds disappear when the agent is recycled.", "Run the job and archive the generated bundle.", "Foundations", 200, ["run-build", "archive-artifact"], ["Run the corrected pipeline first.", "Artifacts belong to a specific build."], "Nexa can now retrieve the build output."),
    ],
  },
  {
    id: 3, title: "Don't Ship Broken Code", role: "Test Runner", badge: "Test Runner",
    story: "A green build is meaningless if the test suite never runs. Put quality between compilation and delivery.",
    concepts: ["Quality gates stop bad work before packaging.", "Test reports make failures visible beyond raw logs."],
    missions: [
      mission("j3m1", "Add the test gate", "The pipeline packages code immediately after Build.", "Enable Test and place it before Package.", "Foundations", 200, ["enable-test", "order-test"], ["Tests should run after compilation.", "A failed Test must block Package."], "Broken code can no longer pass the pipeline."),
      mission("j3m2", "Repair the suite", "A checkout regression fails the new gate.", "Inspect the test failure, apply the prepared fix, and rerun successfully.", "Intermediate", 250, ["inspect-test", "apply-fix", "run-build"], ["The assertion name is in Console Output.", "Use the reviewed fix, then rerun the job."], "The suite is green and the gate is working."),
    ],
  },
  {
    id: 4, title: "Pipeline as Code", role: "Pipeline Architect", badge: "Pipeline Architect",
    story: "Manual job configuration has drifted across environments. Nexa wants the pipeline versioned beside the application.",
    concepts: ["A Jenkinsfile makes delivery reviewable and repeatable.", "Declarative pipelines express agents, stages, steps, and post actions."],
    missions: [
      mission("j4m1", "Adopt a Jenkinsfile", "The job configuration only exists in the controller UI.", "Switch the job definition to Pipeline from SCM.", "Intermediate", 250, ["pipeline-from-scm", "save-pipeline"], ["Source control should own the definition.", "Select Jenkinsfile as the script path."], "The pipeline definition is now versioned."),
      mission("j4m2", "Validate the definition", "The new Jenkinsfile has not been tested by the controller.", "Validate the syntax and run the pipeline.", "Intermediate", 250, ["validate-jenkinsfile", "run-build"], ["Validate before consuming an agent.", "A valid definition can still fail at runtime."], "The versioned pipeline runs successfully."),
    ],
  },
  {
    id: 5, title: "The Assembly Line", role: "Automation Engineer", badge: "Automation Engineer",
    story: "The release path is growing. Make each responsibility visible from checkout to package.",
    concepts: ["Small stages reveal where time and failures accumulate.", "Parallel work can shorten independent checks."],
    missions: [
      mission("j5m1", "Complete the line", "The pipeline has no packaging stage or retained output.", "Enable Package and archive its artifact.", "Intermediate", 250, ["enable-package", "archive-artifact"], ["Package belongs after Test.", "Archive only after the package exists."], "The assembly line now creates a traceable release."),
      mission("j5m2", "Run end to end", "The new stage graph has never completed as one delivery flow.", "Run all configured stages successfully.", "Intermediate", 300, ["run-build", "view-history"], ["Review the stage order first.", "Confirm the successful run in Build History."], "Every stage completed in sequence."),
    ],
  },
  {
    id: 6, title: "When the Pipeline Breaks", role: "Pipeline Fixer", badge: "Pipeline Fixer",
    story: "A dependency upgrade has turned the release board red. Restore service using evidence, not guesses.",
    concepts: ["Console output narrows a failure to the responsible step.", "Reruns prove a repair; they do not replace diagnosis."],
    missions: [
      mission("j6m1", "Find the fault", "Build #47 failed after a dependency update.", "Inspect the failed stage and its console output.", "Intermediate", 250, ["view-console", "inspect-build"], ["Start with the first failed stage.", "Search the output around the non-zero exit."], "You found the incompatible build command."),
      mission("j6m2", "Repair and verify", "The pipeline still contains the incompatible command.", "Apply the reviewed correction and rerun the pipeline.", "Intermediate", 300, ["apply-fix", "run-build"], ["Use the prepared configuration patch.", "Verification requires a new successful build."], "The release board is green again."),
    ],
  },
  {
    id: 7, title: "Meet the Environment", role: "Agent Commander", badge: "Agent Commander",
    story: "Nexa's builds are competing for the wrong machines. Route work to agents with the right capabilities.",
    concepts: ["Labels match pipeline work to suitable agents.", "Environment variables configure builds without changing source."],
    missions: [
      mission("j7m1", "Choose the right agent", "Container builds are queued on agents without Docker.", "Assign the docker agent label and save the pipeline.", "Intermediate", 300, ["select-agent", "save-pipeline"], ["Inspect the available agent labels.", "The docker label exposes the required daemon."], "Container builds now reach capable agents."),
      mission("j7m2", "Set the environment", "The application bundle is missing its target environment.", "Configure NEXA_ENV and run a successful build.", "Intermediate", 300, ["set-environment", "run-build"], ["Use pipeline environment settings.", "The value for this mission is staging."], "The artifact now carries the staging configuration."),
    ],
  },
  {
    id: 8, title: "Secrets Don't Belong in Code", role: "Pipeline Guardian", badge: "Pipeline Guardian",
    story: "A deployment token was committed in plain text. Remove it and wire the pipeline to Jenkins credentials.",
    concepts: ["Credentials should be scoped and injected only when needed.", "Logs must never expose secret values."],
    missions: [
      mission("j8m1", "Store the credential", "The deploy token is embedded in the Jenkinsfile.", "Create a scoped credential named nexa-deploy-token.", "Advanced", 350, ["add-credential"], ["Open Credentials in the workspace.", "Use the exact ID requested by the deployment step."], "The token is now held outside source control."),
      mission("j8m2", "Bind it safely", "The deployment step still reads the old plain-text value.", "Bind the stored credential, remove the exposed value, and validate.", "Advanced", 350, ["bind-credential", "validate-jenkinsfile"], ["Reference the credential ID, not its value.", "Validate that logs only show masked output."], "The pipeline now handles its deployment secret safely."),
    ],
  },
  {
    id: 9, title: "Build Automatically", role: "Automation Master", badge: "Automation Master",
    story: "Developers are waiting for someone to click Build Now. Connect source changes to the pipeline.",
    concepts: ["Webhooks start work immediately after a push.", "Branch rules prevent feature work from deploying to production."],
    missions: [
      mission("j9m1", "Connect the webhook", "Commits can sit untested for hours.", "Enable the repository webhook trigger.", "Advanced", 300, ["enable-webhook"], ["Open Triggers for the pipeline.", "Prefer a push webhook over aggressive polling."], "Every push now starts validation automatically."),
      mission("j9m2", "Protect deployment", "Feature branches can currently reach Deploy.", "Add the main-branch deployment condition and validate it.", "Advanced", 350, ["protect-main", "validate-jenkinsfile"], ["Build every branch, deploy only main.", "Use a stage condition rather than skipping the whole job."], "Feature branches are tested without being deployed."),
    ],
  },
  {
    id: 10, title: "Deploy It", role: "Deployment Engineer", badge: "Deployment Engineer",
    story: "The pipeline is ready to deliver the Nexa web app into staging for the first time.",
    concepts: ["Deployment stages should be explicit and observable.", "Artifacts link what was tested to what was released."],
    missions: [
      mission("j10m1", "Add deployment", "The pipeline stops after packaging.", "Enable Deploy and bind the staging environment.", "Advanced", 350, ["enable-deploy", "set-environment"], ["Deploy consumes the archived package.", "Target staging before production."], "The release path now reaches staging."),
      mission("j10m2", "Release to staging", "The deployment stage is configured but unproven.", "Run the pipeline and verify the deployment result.", "Advanced", 400, ["run-build", "verify-deploy"], ["Run from the main branch.", "Verify the deployment after the stage succeeds."], "Nexa is live in staging from a traceable build."),
    ],
  },
  {
    id: 11, title: "The Broken Deployment", role: "Incident Responder", badge: "Incident Responder",
    story: "Production deployment failed after packaging succeeded. Diagnose the environment boundary and recover safely.",
    concepts: ["Deployment failures need separate diagnosis from build failures.", "Recovery should preserve the audit trail."],
    missions: [
      mission("j11m1", "Triage production", "Deploy cannot authenticate to the production target.", "Inspect deployment output and credential binding.", "Advanced", 400, ["view-console", "inspect-deploy", "view-credentials"], ["The package is healthy; focus on Deploy.", "Compare the credential ID with the production binding."], "You isolated the incident to a credential mismatch."),
      mission("j11m2", "Recover safely", "The job points at the staging credential during production delivery.", "Bind the production credential and rerun the failed pipeline.", "Advanced", 450, ["bind-production", "run-build"], ["Correct the binding without exposing the token.", "Create a new run so history remains intact."], "Production recovered with a complete audit trail."),
    ],
  },
  {
    id: 12, title: "Ship It", role: "Jenkins Engineer", badge: "Jenkins Engineer",
    story: "Release v1.0.0 is ready. Operate the entire Nexa delivery system and prove you can ship with confidence.",
    concepts: ["A release is the result of every guardrail working together.", "Operational confidence comes from observable, repeatable delivery."],
    missions: [
      mission("j12m1", "Release readiness", "The release candidate needs one final pipeline and security review.", "Validate the Jenkinsfile, credentials, trigger, and stage graph.", "Advanced", 500, ["validate-jenkinsfile", "view-credentials", "enable-webhook", "review-pipeline"], ["Review configuration before spending build time.", "Check both automation and secret handling."], "The release candidate passes operational review."),
      mission("j12m2", "Ship Nexa v1.0.0", "Nexa is waiting for its first production release.", "Run the complete pipeline, verify production, and archive the release artifact.", "Advanced", 600, ["run-build", "verify-deploy", "archive-artifact"], ["Do not skip the final verification.", "The release artifact should remain attached to the successful build."], "You shipped Nexa v1.0.0. The factory is yours."),
    ],
  },
];

export const JENKINS_RANKS = [
  { xp: 0, name: "Pipeline Recruit" }, { xp: 500, name: "Build Engineer" },
  { xp: 1200, name: "Test Runner" }, { xp: 2000, name: "Pipeline Architect" },
  { xp: 3000, name: "Automation Engineer" }, { xp: 4200, name: "Pipeline Fixer" },
  { xp: 5600, name: "Agent Commander" }, { xp: 7200, name: "Pipeline Guardian" },
  { xp: 9000, name: "Automation Master" }, { xp: 11000, name: "Deployment Engineer" },
  { xp: 13500, name: "Incident Responder" }, { xp: 16500, name: "Jenkins Engineer" },
];

export function rankForJenkins(xp: number) {
  let current = JENKINS_RANKS[0];
  let next: (typeof JENKINS_RANKS)[number] | null = null;
  for (const rank of JENKINS_RANKS) {
    if (xp >= rank.xp) current = rank;
    else { next = rank; break; }
  }
  return { current, next };
}

export function jenkinsXpAfterHints(base: number, hintsUsed: number) {
  return Math.round(base * [1, 0.8, 0.6][Math.min(hintsUsed, 2)]);
}