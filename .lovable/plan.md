# Pipeline Panic — Jenkins Learning Experience

## Goal
Replace the static Jenkins lesson with a serious, interactive 12-level Nexa training journey that mirrors the Git course’s progression while representing Jenkins through a backend-ready workspace rather than a fake terminal.

## What I’ll build
- A dedicated `/learn/jenkins` course with all 12 levels, missions, objectives, difficulty, tiered hints, XP, badges, locks, completion states, continue controls, and saved progress.
- A lab lifecycle from provisioning to ready/running/completed, including an animated setup checklist and a restart confirmation that preserves course progress.
- A responsive Jenkins workspace with dashboard, jobs, pipeline stages, build history, console output, artifacts, credentials, and status views.
- Interactive pipeline actions appropriate to each mission, such as inspecting output, repairing configuration, adding test gates, configuring credentials/triggers, rerunning builds, and deploying.
- State-based mission validation through a separate mock service contract shaped for replacement by real backend validation later.

## Architecture
- Define reusable course, level, mission, lab, build, pipeline, artifact, badge, and validation models.
- Keep course data, mock Jenkins service, mission validator, and visual workspace components separate from the page shell.
- Route the Jenkins dashboard card to the new experience without changing the existing Git course or other tools.

## Validation
- Check progression, hints, XP, restart behavior, pipeline transitions, and saved completion state.
- Verify the Jenkins journey in the live preview at desktop and mobile widths and resolve any build/runtime errors.
