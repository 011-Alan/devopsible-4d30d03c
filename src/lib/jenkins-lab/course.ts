import type { JenkinsLevel, JenkinsLabState } from "./models";

const defaultJenkinsState = (overrides: Partial<JenkinsLabState> = {}): JenkinsLabState => ({
  readiness: "ready",
  jenkinsUrl: "http://localhost:8080",
  username: "student",
  passwordHint: "devopsible",
  version: "2.479.1",
  activeJob: "sample-job",
  jobs: {
    "sample-job": {
      name: "sample-job",
      type: "freestyle",
      stages: [{ id: "build", name: "Build", status: "success", duration: "12s" }],
      builds: [
        { id: 1, branch: "main", commit: "a7f3c2d", status: "success", startedAt: "5m ago", duration: "12s" },
      ],
      console: [
        "Started by user student",
        "Running as SYSTEM",
        "Building in workspace /var/jenkins_home/workspace/sample-job",
        "[sample-job] $ /bin/sh -xe /tmp/jenkins84920.sh",
        "+ echo 'Jenkins build server operational'",
        "Jenkins build server operational",
        "Finished: SUCCESS",
      ],
    },
  },
  artifacts: [],
  credentials: ["nexa-deploy-token"],
  files: {},
  history: [],
  ...overrides,
});

export const jenkinsLevels: JenkinsLevel[] = [
  {
    id: 1,
    title: "Wake Up the Build Server",
    role: "Pipeline Recruit",
    badge: "Pipeline Recruit",
    story:
      "A development team has received a Jenkins instance, but a developer does not know how to inspect its status or identify available jobs. Verify that the service is operational.",
    concepts: [
      { heading: "Jenkins Controller", body: "The central server coordinating build queues, executors, plugins, and the web UI." },
      { heading: "Build History", body: "The immutable record of every execution, including logs, status, artifacts, and parameters." },
    ],
    setup: () => defaultJenkinsState(),
    missions: [
      {
        id: "j1",
        title: "Wake Up the Build Server",
        scenario: "Verify that the build server is responsive, healthy, and ready to accept CI/CD automation workloads.",
        problem: "The handover documentation is missing. Verify Jenkins version, access the dashboard, and inspect existing jobs.",
        objective: "Access the Jenkins dashboard, inspect available jobs, and confirm service readiness.",
        difficulty: "Foundations",
        xp: 100,
        hints: [
          "Open the Jenkins Web UI tab or open http://localhost:8080 in a new window.",
          "Check the build history of 'sample-job'.",
          "Use the terminal to verify the Jenkins HTTP response with `curl -I http://localhost:8080/login`.",
        ],
        suggested: ["curl -I http://localhost:8080/login", "jenkins-cli version", "curl -s http://localhost:8080/api/json"],
        checks: [
          {
            label: "Genuine Jenkins service is reachable and operational",
            test: (s) => s.readiness === "ready",
          },
          {
            label: "Inspect available jobs on the Jenkins dashboard",
            test: (s) => Object.keys(s.jobs).length > 0,
          },
          {
            label: "Locate build history for the existing job",
            test: (s) => (s.jobs["sample-job"]?.builds.length ?? 0) > 0,
          },
        ],
        check: (s) => s.readiness === "ready" && Object.keys(s.jobs).length > 0,
        successMessage: "Jenkins controller is live and operational. Build server ready for automated jobs.",
      },
    ],
  },
  {
    id: 2,
    title: "Your First Build",
    role: "Build Apprentice",
    badge: "Build Apprentice",
    story:
      "A team wants to automate a simple application build but currently runs the process manually. Create and execute a Freestyle job.",
    concepts: [
      { heading: "Freestyle Project", body: "The fundamental job type in Jenkins for running linear shell tasks and build steps." },
      { heading: "Console Output", body: "Live streaming log of stdout and stderr captured during build step execution." },
    ],
    setup: () =>
      defaultJenkinsState({
        files: {
          "build.sh": `#!/bin/bash\necho "DevOpsible Jenkins build successful"\nexit 0`,
        },
      }),
    missions: [
      {
        id: "j2",
        title: "Your First Build",
        scenario: "Create a Freestyle project named 'first-build' that runs an automated shell command.",
        problem: "Manual developer scripts fail due to environment differences. Centralize build execution in Jenkins.",
        objective: "Create job 'first-build', add build step `echo \"DevOpsible Jenkins build successful\"`, and achieve a SUCCESS build.",
        difficulty: "Foundations",
        xp: 120,
        hints: [
          "In Jenkins, click 'New Item' -> select 'Freestyle project' -> name it 'first-build'.",
          "Under 'Build Steps', add 'Execute shell' with: echo \"DevOpsible Jenkins build successful\".",
          "Click 'Build Now' and verify console output ends with 'Finished: SUCCESS'.",
        ],
        suggested: [
          "jenkins-cli build first-build -s -v",
          "cat build.sh",
          "curl -s http://localhost:8080/job/first-build/api/json",
        ],
        checks: [
          {
            label: "Job 'first-build' exists in Jenkins",
            test: (s) => !!s.jobs["first-build"],
          },
          {
            label: "Configured build step outputs required success message",
            test: (s) => s.jobs["first-build"]?.console.some((c) => c.includes("DevOpsible Jenkins build successful")) ?? false,
          },
          {
            label: "Build completed with status SUCCESS",
            test: (s) => s.jobs["first-build"]?.lastBuild?.status === "success",
          },
        ],
        check: (s) =>
          !!s.jobs["first-build"] &&
          s.jobs["first-build"].lastBuild?.status === "success" &&
          s.jobs["first-build"].console.some((c) => c.includes("DevOpsible Jenkins build successful")),
        successMessage: "First automated build executed cleanly! Your build step passed with status SUCCESS.",
      },
    ],
  },
  {
    id: 3,
    title: "Pipeline as Code",
    role: "Pipeline Author",
    badge: "Pipeline Author",
    story:
      "The development team has several manually configured build steps. They want the workflow to be stored in source control as a declarative Jenkinsfile.",
    concepts: [
      { heading: "Declarative Pipeline", body: "Structured Groovy syntax with pipeline { agent any; stages { ... } } for versioned delivery." },
      { heading: "Stages & Steps", body: "Stages represent logical gates (Build, Test), containing granular execution steps." },
    ],
    setup: () =>
      defaultJenkinsState({
        files: {
          Jenkinsfile: `pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                echo 'Building application bundle'
            }
        }
        stage('Test') {
            steps {
                echo 'Running automated tests'
            }
        }
    }
}`,
        },
      }),
    missions: [
      {
        id: "j3",
        title: "Pipeline as Code",
        scenario: "Declare a versioned CI pipeline with Build and Test stages in a Jenkinsfile.",
        problem: "UI-configured jobs drift and lack code reviews. Version the delivery pipeline in a Jenkinsfile.",
        objective: "Create a Pipeline job 'declarative-pipeline' with Build and Test stages, and verify both stages pass.",
        difficulty: "Foundations",
        xp: 150,
        hints: [
          "Create a 'Pipeline' job named 'declarative-pipeline'.",
          "Paste or load the Declarative Pipeline definition with 'Build' and 'Test' stages.",
          "Run the build and verify the Stage View shows both stages green.",
        ],
        suggested: ["cat Jenkinsfile", "jenkins-cli build declarative-pipeline", "curl http://localhost:8080/job/declarative-pipeline/wfapi/runs"],
        checks: [
          {
            label: "Pipeline job 'declarative-pipeline' created",
            test: (s) => s.jobs["declarative-pipeline"]?.type === "pipeline",
          },
          {
            label: "Pipeline includes both 'Build' and 'Test' stages",
            test: (s) => {
              const stages = s.jobs["declarative-pipeline"]?.stages || [];
              return stages.some((st) => st.name === "Build") && stages.some((st) => st.name === "Test");
            },
          },
          {
            label: "Pipeline executes and finishes with SUCCESS",
            test: (s) => s.jobs["declarative-pipeline"]?.lastBuild?.status === "success",
          },
        ],
        check: (s) => {
          const job = s.jobs["declarative-pipeline"];
          return (
            job?.type === "pipeline" &&
            job.lastBuild?.status === "success" &&
            job.stages.some((st) => st.name === "Build") &&
            job.stages.some((st) => st.name === "Test")
          );
        },
        successMessage: "Pipeline as Code mastered! Declarative stages executed and verified in Stage View.",
      },
    ],
  },
  {
    id: 4,
    title: "Fix the Broken Pipeline",
    role: "Pipeline Troubleshooter",
    badge: "Pipeline Troubleshooter",
    story:
      "A developer pushed a syntax error into the Jenkinsfile, turning the release board red. Open the console output, diagnose the failure, and fix the script.",
    concepts: [
      { heading: "Console Diagnostics", body: "Tracing failure logs backwards from the non-zero exit code to pinpoint syntax or command errors." },
      { heading: "Pipeline Resiliency", body: "Fixing regressions and re-triggering builds while preserving historical failure audit trails." },
    ],
    setup: () =>
      defaultJenkinsState({
        activeJob: "broken-pipeline",
        jobs: {
          "broken-pipeline": {
            name: "broken-pipeline",
            type: "pipeline",
            stages: [
              { id: "build", name: "Build", status: "success", duration: "10s" },
              { id: "compile", name: "Compile", status: "failed", duration: "2s" },
            ],
            builds: [
              { id: 1, branch: "main", commit: "b890fa1", status: "failed", startedAt: "3m ago", duration: "12s" },
            ],
            console: [
              "[Pipeline] stage (Build)",
              "[Pipeline] stage (Compile)",
              "/tmp/jenkins.sh: line 4: npmm: command not found",
              "[Pipeline] } // stage",
              "ERROR: script returned exit code 127",
              "Finished: FAILURE",
            ],
            jenkinsfile: `pipeline {
    agent any
    stages {
        stage('Build') {
            steps { echo 'Initializing' }
        }
        stage('Compile') {
            steps { sh 'npmm run build' } // TYPO: npmm instead of npm
        }
    }
}`,
          },
        },
        files: {
          Jenkinsfile: `pipeline {
    agent any
    stages {
        stage('Build') {
            steps { echo 'Initializing' }
        }
        stage('Compile') {
            steps { sh 'npm run build' }
        }
    }
}`,
        },
      }),
    missions: [
      {
        id: "j4",
        title: "Fix the Broken Pipeline",
        scenario: "Diagnose why 'broken-pipeline' build #1 failed, repair the typo in the Jenkinsfile, and rerun.",
        problem: "The release train is blocked by a typo in the compile stage ('npmm'). Correct it to 'npm'.",
        objective: "Identify the failure in console output, correct 'npmm' to 'npm' in the Jenkinsfile, and get a green build.",
        difficulty: "Intermediate",
        xp: 180,
        hints: [
          "Check the console output of build #1 — notice 'npmm: command not found'.",
          "Open the Pipeline tab / Jenkinsfile editor and fix the command to 'npm run build'.",
          "Trigger a new build (Build #2) and confirm it passes.",
        ],
        suggested: ["cat Jenkinsfile", "jenkins-cli build broken-pipeline", "curl http://localhost:8080/job/broken-pipeline/1/consoleText"],
        checks: [
          {
            label: "Inspect failed build console output",
            test: (s) => (s.jobs["broken-pipeline"]?.builds.length ?? 0) >= 1,
          },
          {
            label: "Correct the broken command in the Jenkinsfile",
            test: (s) => !(s.jobs["broken-pipeline"]?.jenkinsfile || s.files["Jenkinsfile"] || "").includes("npmm"),
          },
          {
            label: "Rerun pipeline and achieve a SUCCESS build",
            test: (s) => s.jobs["broken-pipeline"]?.lastBuild?.status === "success",
          },
        ],
        check: (s) =>
          !(s.jobs["broken-pipeline"]?.jenkinsfile || s.files["Jenkinsfile"] || "").includes("npmm") &&
          s.jobs["broken-pipeline"]?.lastBuild?.status === "success",
        successMessage: "Pipeline repaired! Console error diagnosed, typo fixed, and Build #2 is green.",
      },
    ],
  },
  {
    id: 5,
    title: "Test Before You Ship",
    role: "Quality Guardian",
    badge: "Quality Guardian",
    story:
      "An application builds successfully, but broken code reached staging because tests were skipped. Add an automated test gate that blocks delivery on failure.",
    concepts: [
      { heading: "Quality Gates", body: "Automated test stages that prevent broken artifacts from moving down the deployment pipeline." },
      { heading: "Test Reports", body: "Publishing JUnit/TAP test summaries directly to the Jenkins build report." },
    ],
    setup: () =>
      defaultJenkinsState({
        files: {
          "src/app.test.js": `const assert = require('assert');\nassert.strictEqual(2 + 2, 4);`,
          Jenkinsfile: `pipeline {
    agent any
    stages {
        stage('Build') { steps { echo 'Building...' } }
        stage('Test') { steps { sh 'npm test' } }
    }
}`,
        },
      }),
    missions: [
      {
        id: "j5",
        title: "Test Before You Ship",
        scenario: "Configure an automated test stage that executes test suites and gates pipeline progression.",
        problem: "Broken features slip into releases when tests are not enforced in CI.",
        objective: "Configure a 'Test' stage, run unit tests, and verify that passing tests produce a successful build.",
        difficulty: "Intermediate",
        xp: 200,
        hints: [
          "Ensure the Jenkinsfile contains a 'Test' stage running 'npm test'.",
          "Ensure your test suite in 'src/app.test.js' passes cleanly.",
          "Run the build and verify the Test stage executes successfully.",
        ],
        suggested: ["npm test", "cat src/app.test.js", "jenkins-cli build tested-app"],
        checks: [
          {
            label: "Pipeline definition includes an active 'Test' stage",
            test: (s) =>
              (s.files["Jenkinsfile"] || "").includes("stage('Test')") ||
              Object.values(s.jobs).some((j) => j.stages.some((st) => st.name === "Test")),
          },
          {
            label: "Automated test suite executes during the build",
            test: (s) => Object.values(s.jobs).some((j) => j.console.some((c) => c.includes("test") || c.includes("npm test"))),
          },
          {
            label: "Pipeline completes with verified green test gate",
            test: (s) => Object.values(s.jobs).some((j) => j.lastBuild?.status === "success"),
          },
        ],
        check: (s) =>
          Object.values(s.jobs).some(
            (j) => j.lastBuild?.status === "success" && j.stages.some((st) => st.name === "Test")
          ),
        successMessage: "Quality gate enforced! Automated tests verified and passing before build artifact creation.",
      },
    ],
  },
  {
    id: 6,
    title: "The Git-to-Jenkins Connection",
    role: "SCM Integrator",
    badge: "SCM Integrator",
    story:
      "A developer pushes code to Git, but Jenkins cannot fetch the repository. Configure the Git SCM repository URL and branch to pull source into the workspace.",
    concepts: [
      { heading: "SCM Checkout", body: "Jenkins clones source from Git directly into the agent workspace on every build." },
      { heading: "Branch Specifier", body: "Configuring target branches (e.g., */main) to control what gets built." },
    ],
    setup: () =>
      defaultJenkinsState({
        files: {
          "repo-config.txt": "url: https://github.com/nexa-cloud/nexa-web.git\nbranch: main",
        },
      }),
    missions: [
      {
        id: "j6",
        title: "The Git-to-Jenkins Connection",
        scenario: "Configure Jenkins to retrieve application source code from a Git repository.",
        problem: "Pipelines relying on local files cannot build code from distributed team members.",
        objective: "Configure Git SCM in job 'git-pipeline' with repository URL and main branch, and execute a checkout.",
        difficulty: "Intermediate",
        xp: 220,
        hints: [
          "In job configuration, choose 'Git' under Source Code Management (or `git url: ...` in pipeline).",
          "Set Repository URL to 'https://github.com/nexa-cloud/nexa-web.git' and Branch to '*/main'.",
          "Execute the build and confirm Git checkout succeeds in console output.",
        ],
        suggested: ["git status", "git log -n 1", "curl http://localhost:8080/job/git-pipeline/api/json"],
        checks: [
          {
            label: "Git SCM configured with target repository URL",
            test: (s) =>
              (s.jobs["git-pipeline"]?.scm?.url || "").includes("nexa-web") ||
              (s.files["Jenkinsfile"] || "").includes("git "),
          },
          {
            label: "Target branch specified as 'main'",
            test: (s) =>
              s.jobs["git-pipeline"]?.scm?.branch === "main" ||
              s.jobs["git-pipeline"]?.lastBuild?.branch === "main",
          },
          {
            label: "Build checks out source code successfully",
            test: (s) =>
              s.jobs["git-pipeline"]?.console.some((c) => c.includes("Cloning repository") || c.includes("Checking out")) ||
              s.jobs["git-pipeline"]?.lastBuild?.status === "success",
          },
        ],
        check: (s) =>
          !!s.jobs["git-pipeline"] && s.jobs["git-pipeline"].lastBuild?.status === "success",
        successMessage: "SCM connected! Jenkins is now cloning and synchronizing source directly from Git.",
      },
    ],
  },
  {
    id: 7,
    title: "Credentials and Secure Configuration",
    role: "Secret Guardian",
    badge: "Secret Guardian",
    story:
      "A deployment token was committed in plain text inside the Jenkinsfile! Move the token to Jenkins Credentials Store and bind it safely with withCredentials.",
    concepts: [
      { heading: "Credentials Store", body: "Encrypted vault in Jenkins for storing passwords, tokens, and SSH keys securely." },
      { heading: "Secret Masking", body: "Jenkins automatically masks bound credentials with '****' in console output." },
    ],
    setup: () =>
      defaultJenkinsState({
        credentials: ["nexa-deploy-token"],
        files: {
          Jenkinsfile: `pipeline {
    agent any
    environment {
        DEPLOY_TOKEN = credentials('nexa-deploy-token')
    }
    stages {
        stage('Deploy') {
            steps {
                echo "Deploying with token: \${DEPLOY_TOKEN}"
            }
        }
    }
}`,
        },
      }),
    missions: [
      {
        id: "j7",
        title: "Credentials and Secure Configuration",
        scenario: "Protect production secrets by binding credentials without exposing plain-text tokens.",
        problem: "Committed secrets in Git leak to public logs and breach compliance rules.",
        objective: "Configure credential 'nexa-deploy-token' in Jenkins and bind it in the pipeline using credentials().",
        difficulty: "Advanced",
        xp: 250,
        hints: [
          "Navigate to 'Manage Jenkins' -> 'Credentials' -> System -> Global.",
          "Verify credential ID 'nexa-deploy-token' is registered.",
          "Use `withCredentials([string(credentialsId: 'nexa-deploy-token', variable: 'TOKEN')])` or `credentials()`.",
          "Confirm logs show '****' instead of the plain-text secret.",
        ],
        suggested: ["jenkins-cli list-credentials system::system::jenkins", "cat Jenkinsfile"],
        checks: [
          {
            label: "Credential 'nexa-deploy-token' registered in Jenkins",
            test: (s) => s.credentials.includes("nexa-deploy-token"),
          },
          {
            label: "Jenkinsfile references credentials without plain text secrets",
            test: (s) =>
              (s.files["Jenkinsfile"] || "").includes("credentials('nexa-deploy-token')") ||
              (s.files["Jenkinsfile"] || "").includes("nexa-deploy-token"),
          },
          {
            label: "Pipeline executes with credential binding",
            test: (s) => Object.values(s.jobs).some((j) => j.lastBuild?.status === "success"),
          },
        ],
        check: (s) =>
          s.credentials.includes("nexa-deploy-token") &&
          Object.values(s.jobs).some((j) => j.lastBuild?.status === "success"),
        successMessage: "Secret secured! Credential safely bound and masked in build logs.",
      },
    ],
  },
  {
    id: 8,
    title: "Docker Build and Image Pipeline",
    role: "Container Pipeline Pro",
    badge: "Container Pipeline Pro",
    story:
      "Automate container packaging. Configure Jenkins to build an application Docker image and apply a version tag after tests pass.",
    concepts: [
      { heading: "Docker in CI", body: "Building, tagging, and scanning container images directly inside the automated build lifecycle." },
      { heading: "Image Tagging", body: "Labeling images with semantic versions (nexa-web:1.0) and git commit hashes." },
    ],
    setup: () =>
      defaultJenkinsState({
        files: {
          Dockerfile: "FROM nginx:alpine\nCOPY index.html /usr/share/nginx/html/\nEXPOSE 80",
          "index.html": "<h1>Nexa Containerized Release</h1>",
          Jenkinsfile: `pipeline {
    agent any
    stages {
        stage('Build Image') {
            steps {
                sh 'docker build -t nexa-web:1.0 .'
            }
        }
    }
}`,
        },
      }),
    missions: [
      {
        id: "j8",
        title: "Docker Build and Image Pipeline",
        scenario: "Automate container image generation by executing 'docker build' in the Jenkins pipeline.",
        problem: "Building images manually on developer laptops leads to non-reproducible artifacts.",
        objective: "Add a Docker build stage to Jenkinsfile, build image 'nexa-web:1.0', and verify image creation.",
        difficulty: "Advanced",
        xp: 280,
        hints: [
          "In the Jenkinsfile, add a stage: `sh 'docker build -t nexa-web:1.0 .'`.",
          "Run the build and verify the Docker step finishes successfully.",
          "Check terminal with `docker images` to confirm image 'nexa-web:1.0' exists.",
        ],
        suggested: ["docker images", "cat Dockerfile", "cat Jenkinsfile"],
        checks: [
          {
            label: "Dockerfile present in build workspace",
            test: (s) => (s.files["Dockerfile"] || "").includes("FROM"),
          },
          {
            label: "Pipeline executes 'docker build' command",
            test: (s) =>
              (s.files["Jenkinsfile"] || "").includes("docker build") ||
              Object.values(s.jobs).some((j) => j.console.some((c) => c.includes("docker build"))),
          },
          {
            label: "Docker image 'nexa-web:1.0' created and tagged",
            test: (s) =>
              Object.values(s.jobs).some((j) => j.lastBuild?.status === "success") &&
              (s.files["Jenkinsfile"] || "").includes("nexa-web:1.0"),
          },
        ],
        check: (s) =>
          (s.files["Jenkinsfile"] || "").includes("docker build") &&
          Object.values(s.jobs).some((j) => j.lastBuild?.status === "success"),
        successMessage: "Container pipeline active! Docker image built, tagged, and ready for deployment.",
      },
    ],
  },
  {
    id: 9,
    title: "Continuous Integration Trigger",
    role: "Automation Master",
    badge: "Automation Master",
    story:
      "Developers are tired of manually clicking 'Build Now'. Configure automated build triggers so git pushes automatically start verification.",
    concepts: [
      { heading: "Poll SCM", body: "Periodically querying source control for commits when webhooks cannot reach private workers." },
      { heading: "Webhooks", body: "Immediate push notifications from Git repositories triggering instant builds." },
    ],
    setup: () =>
      defaultJenkinsState({
        files: {
          Jenkinsfile: `pipeline {
    agent any
    triggers {
        pollSCM('H/5 * * * *')
    }
    stages {
        stage('Build') { steps { echo 'Triggered automatically!' } }
    }
}`,
        },
      }),
    missions: [
      {
        id: "j9",
        title: "Continuous Integration Trigger",
        scenario: "Automate build execution using Poll SCM triggers or webhook event listeners.",
        problem: "Delayed test feedback occurs when developers forget to trigger builds manually.",
        objective: "Configure a build trigger in Jenkins, trigger a build automatically, and verify the build cause.",
        difficulty: "Advanced",
        xp: 300,
        hints: [
          "In job configuration -> 'Build Triggers', select 'Poll SCM' (e.g. `H/5 * * * *`) or GitHub hook trigger.",
          "In Declarative syntax, use `triggers { pollSCM('H/5 * * * *') }`.",
          "Trigger a build and check the build cause shows automated polling.",
        ],
        suggested: ["cat Jenkinsfile", "curl http://localhost:8080/job/sample-job/api/json"],
        checks: [
          {
            label: "Pipeline configuration defines automated build triggers",
            test: (s) =>
              (s.files["Jenkinsfile"] || "").includes("triggers") ||
              (s.files["Jenkinsfile"] || "").includes("pollSCM") ||
              Object.values(s.jobs).some((j) => (j.triggers?.length ?? 0) > 0),
          },
          {
            label: "Automated trigger registered on the job",
            test: (s) => true,
          },
          {
            label: "Build executes successfully with trigger metadata",
            test: (s) => Object.values(s.jobs).some((j) => j.lastBuild?.status === "success"),
          },
        ],
        check: (s) =>
          ((s.files["Jenkinsfile"] || "").includes("triggers") || (s.files["Jenkinsfile"] || "").includes("pollSCM")) &&
          Object.values(s.jobs).some((j) => j.lastBuild?.status === "success"),
        successMessage: "Continuous Integration automated! Builds now start automatically whenever code changes.",
      },
    ],
  },
  {
    id: 10,
    title: "The CI/CD Boss Mission",
    role: "CI/CD Master",
    badge: "CI/CD Master",
    story:
      "Final Boss Challenge! Construct a complete production-grade delivery pipeline from scratch: SCM Checkout, Compile, Automated Tests, Docker Packaging, and Artifact Archiving.",
    concepts: [
      { heading: "End-to-End Pipeline", body: "Orchestrating the complete software supply chain from raw commit to deployable artifact." },
      { heading: "Archive Artifacts", body: "Storing build binaries, container digests, and test logs as permanent release assets." },
    ],
    setup: () =>
      defaultJenkinsState({
        files: {
          Jenkinsfile: `pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps { echo 'Cloning repository' }
        }
        stage('Build') {
            steps { echo 'Compiling application' }
        }
        stage('Test') {
            steps { echo 'Running automated test suite' }
        }
        stage('Docker') {
            steps { echo 'Building and tagging container image' }
        }
        stage('Archive') {
            steps { echo 'Archiving release artifact' }
        }
    }
}`,
        },
      }),
    missions: [
      {
        id: "j10",
        title: "The CI/CD Boss Mission",
        scenario: "Build and execute an end-to-end 5-stage delivery pipeline passing all quality and packaging gates.",
        problem: "The legacy release process is fragmented and slow. Unify all steps into one cohesive, automated pipeline.",
        objective: "Execute a 5-stage pipeline (Checkout -> Build -> Test -> Docker -> Archive) and achieve a 100% green release build.",
        difficulty: "Advanced",
        xp: 500,
        hints: [
          "Check the Jenkinsfile in the Files editor.",
          "Ensure stages: 'Checkout', 'Build', 'Test', 'Docker', and 'Archive' are defined.",
          "Run the build and verify all 5 stages display green in Stage View.",
        ],
        suggested: ["cat Jenkinsfile", "jenkins-cli build full-pipeline", "curl http://localhost:8080/job/full-pipeline/wfapi/runs"],
        checks: [
          {
            label: "Declarative pipeline with 5 core delivery stages",
            test: (s) => {
              const jf = s.files["Jenkinsfile"] || "";
              return (
                jf.includes("Checkout") &&
                jf.includes("Build") &&
                jf.includes("Test") &&
                jf.includes("Docker") &&
                jf.includes("Archive")
              );
            },
          },
          {
            label: "All quality and packaging gates execute without error",
            test: (s) => Object.values(s.jobs).some((j) => j.lastBuild?.status === "success"),
          },
          {
            label: "Release artifact archived and certified for production",
            test: (s) => Object.values(s.jobs).some((j) => j.lastBuild?.status === "success"),
          },
        ],
        check: (s) => {
          const jf = s.files["Jenkinsfile"] || "";
          return (
            jf.includes("Checkout") &&
            jf.includes("Build") &&
            jf.includes("Test") &&
            jf.includes("Docker") &&
            jf.includes("Archive") &&
            Object.values(s.jobs).some((j) => j.lastBuild?.status === "success")
          );
        },
        successMessage: "Boss defeated! You have constructed an enterprise-grade automated CI/CD pipeline. The factory is yours!",
      },
    ],
  },
];
