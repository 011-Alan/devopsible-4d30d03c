import { describe, it, expect } from "vitest";
import { emptyDocker, runDocker } from "@/lib/docker-lab/engine";
import { dockerLevels } from "@/lib/docker-lab/course";
import { emptyK8s, runK8s } from "@/lib/k8s-lab/engine";
import { k8sLevels } from "@/lib/k8s-lab/course";
import { jenkinsLevels } from "@/lib/jenkins-lab/course";
import type { JenkinsLabState } from "@/lib/jenkins-lab/models";

describe("Docker Lab Workflow", () => {
  it("completes Level 1 (The Container Recruit) with docker run command", () => {
    const level1 = dockerLevels[0];
    const initial = level1.setup();

    // Run the mission command
    const res = runDocker(initial, "docker run -d --name web-lab -p 8080:80 nginx");
    expect(res.error).toBeFalsy();

    // Verify all objectives pass
    const mission = level1.missions[0];
    const checks = mission.checks!;
    expect(checks[0].test(res.state)).toBe(true); // Image available
    expect(checks[1].test(res.state)).toBe(true); // Container named web-lab running
    expect(checks[2].test(res.state)).toBe(true); // Port 8080:80 published
    expect(checks[3].test(res.state)).toBe(true); // Application answers on 8080
    expect(mission.check(res.state)).toBe(true);
  });
});

describe("Kubernetes Lab Workflow", () => {
  it("completes Level 1 (Enter the Kingdom) by exploring nodes, namespaces, and pods", () => {
    const level1 = k8sLevels[0];
    let state = level1.setup();

    state = runK8s(state, "kubectl get nodes").state;
    state = runK8s(state, "kubectl get namespaces").state;
    state = runK8s(state, "kubectl get pods").state;

    const mission = level1.missions[0];
    expect(mission.check(state)).toBe(true);
  });

  it("deploys application with replicas in Level 2", () => {
    const level2 = k8sLevels[1];
    let state = level2.setup();

    state = runK8s(state, "kubectl create deployment web --image=nginx --replicas=2").state;
    const mission = level2.missions[0];
    expect(mission.check(state)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Jenkins Lab Workflow
// ---------------------------------------------------------------------------

describe("Jenkins Lab Workflow", () => {
  it("exports 10 levels with required fields", () => {
    expect(jenkinsLevels).toHaveLength(10);
    for (const level of jenkinsLevels) {
      expect(level.id).toBeGreaterThan(0);
      expect(level.title).toBeTruthy();
      expect(level.badge).toBeTruthy();
      expect(typeof level.setup).toBe("function");
      expect(level.missions).toHaveLength(1);
    }
  });

  it("Level 1 — Wake Up the Build Server: initial state passes readiness and jobs checks", () => {
    const level1 = jenkinsLevels[0];
    const state: JenkinsLabState = level1.setup();
    const mission = level1.missions[0];

    // The setup state should already satisfy the level 1 checks (service is up, jobs exist)
    expect(mission.checks[0].test(state)).toBe(true); // readiness === "ready"
    expect(mission.checks[1].test(state)).toBe(true); // at least one job
    expect(mission.checks[2].test(state)).toBe(true); // sample-job has build history
    expect(mission.check(state)).toBe(true);
  });

  it("Level 2 — Your First Build: check fails without the first-build job", () => {
    const level2 = jenkinsLevels[1];
    const state: JenkinsLabState = level2.setup();
    const mission = level2.missions[0];

    // Initial state has sample-job but NOT first-build → check should fail
    expect(mission.check(state)).toBe(false);
  });

  it("Level 2 — Your First Build: check passes after adding first-build with SUCCESS", () => {
    const level2 = jenkinsLevels[1];
    const baseState: JenkinsLabState = level2.setup();
    const mission = level2.missions[0];

    // Simulate a student successfully creating and running the first-build job
    const state: JenkinsLabState = {
      ...baseState,
      jobs: {
        ...baseState.jobs,
        "first-build": {
          name: "first-build",
          type: "freestyle",
          stages: [],
          builds: [{ id: 1, branch: "main", commit: "abc1234", status: "success", startedAt: "1m ago", duration: "5s" }],
          lastBuild: { id: 1, branch: "main", commit: "abc1234", status: "success", startedAt: "1m ago", duration: "5s" },
          console: [
            "Started by user student",
            "DevOpsible Jenkins build successful",
            "Finished: SUCCESS",
          ],
        },
      },
    };

    expect(mission.checks[0].test(state)).toBe(true); // first-build job exists
    expect(mission.checks[1].test(state)).toBe(true); // console includes success message
    expect(mission.checks[2].test(state)).toBe(true); // lastBuild status === success
    expect(mission.check(state)).toBe(true);
  });

  it("Level 3 — Pipeline as Code: check fails without declarative-pipeline job", () => {
    const level3 = jenkinsLevels[2];
    const state: JenkinsLabState = level3.setup();
    const mission = level3.missions[0];

    expect(mission.check(state)).toBe(false);
  });

  it("Level 3 — Pipeline as Code: check passes after adding declarative-pipeline with Build+Test stages", () => {
    const level3 = jenkinsLevels[2];
    const baseState: JenkinsLabState = level3.setup();
    const mission = level3.missions[0];

    const state: JenkinsLabState = {
      ...baseState,
      jobs: {
        ...baseState.jobs,
        "declarative-pipeline": {
          name: "declarative-pipeline",
          type: "pipeline",
          stages: [
            { id: "build", name: "Build", status: "success", duration: "3s" },
            { id: "test", name: "Test", status: "success", duration: "5s" },
          ],
          builds: [{ id: 1, branch: "main", commit: "def5678", status: "success", startedAt: "2m ago", duration: "8s" }],
          lastBuild: { id: 1, branch: "main", commit: "def5678", status: "success", startedAt: "2m ago", duration: "8s" },
          console: ["Finished: SUCCESS"],
        },
      },
    };

    expect(mission.checks[0].test(state)).toBe(true); // pipeline job exists
    expect(mission.checks[1].test(state)).toBe(true); // has Build and Test stages
    expect(mission.check(state)).toBe(true);
  });

  it("total XP across all 10 levels equals 2300", () => {
    const totalXp = jenkinsLevels.reduce((sum, lvl) => {
      return sum + lvl.missions.reduce((mSum, m) => mSum + m.xp, 0);
    }, 0);
    expect(totalXp).toBe(2300);
  });

  it("all levels have unique IDs and non-empty badges", () => {
    const ids = jenkinsLevels.map((l) => l.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);

    const badges = jenkinsLevels.map((l) => l.badge);
    const uniqueBadges = new Set(badges);
    expect(uniqueBadges.size).toBe(10);
  });

  it("every level's setup() returns a valid JenkinsLabState with readiness === 'ready'", () => {
    for (const level of jenkinsLevels) {
      const state = level.setup();
      expect(state.readiness).toBe("ready");
      expect(state.jenkinsUrl).toBeTruthy();
      expect(state.username).toBeTruthy();
      expect(typeof state.jobs).toBe("object");
    }
  });
});
