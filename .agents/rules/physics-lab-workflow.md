---
trigger: always_on
description: Essential Physics Lab workflow, verification, and Git conventions.
---

# Physics Lab — Workflow, Verification & Git Rules

This rule adds essential operational workflow constraints and avoids repeating architecture, physics, and TV UI requirements already defined in root `AGENTS.md`. Detailed multi-stage simulation procedures live in the `implement-simulation` skill (`.agents/skills/implement-simulation/SKILL.md`).

## 1. Risk-Based, Browser-First Development
- Default to browser-first iteration inside `simulation-web/` (`npm run dev` + URL hash `#<sim-id>`), scaling test depth to change risk.
- **During implementation:** Run focused Vitest suites (`npx vitest run <test-file>`). Run headless Chrome / CDP visual checks (patterned on `scripts/capture-work-energy-qa.mjs`) when Canvas visuals, graph layout, or 1080p readability change.
- **At integration, PR, or release milestones:** Run the full `simulation-web/` checks matching `.github/workflows/web-ci.yml`:
  `npm test`, `npm run typecheck`, `npm run build`.
- **Android build boundary:** Skip `scripts/copy-web-assets.ps1`, `scripts/build-all.ps1`, `./gradlew assembleDebug`, and ADB device checks for docs-only or `simulation-web/`-only changes. Run Android asset sync, APK builds, or device tests only when `android/` code/config/assets, bundled web packaging, or an Android release milestone requires them.

## 2. Scope Discipline & Anti-Churn
- Break large features or new simulations into independently reviewable stages rather than landing unreviewable multi-layer changes in one pass (follow `.agents/skills/implement-simulation/SKILL.md` for new simulations).
- Reuse an already-approved specification without re-auditing or rewriting it unless a concrete mathematical, numerical, or requirement flaw is discovered.
- Avoid speculative abstractions, oversized monolithic simulation files, unrequested refactors, redundant documentation updates, and repeated pre-code audit passes.
- Update `README.md` and `docs/curriculum-map.md` at integration or release milestones, reading parameter ranges, timesteps, and test counts directly from source files and command output rather than memory.

## 3. Git Conventions & Honest Reporting
- Respect branch boundaries (`main` vs `feat/<topic>`). Keep unrelated changes out of feature branches, and never rewrite shared history or force-push.
- Use focused conventional commits (`feat(scope):`, `fix(scope):`, `docs(scope):`, `test(scope):`, `chore(scope):`).
- Preserve the repository commit author (`gyr0byte <gqurav69@gmail.com>`) and SSH commit signing (`commit.gpgsign = true`, `gpg.format = ssh`); never pass `--no-gpg-sign` or override authorship.
- Never claim tests, typechecks, builds, CI runs, or hardware checks passed without direct observation after the final edit. State exact commands, observed counts, CI conclusions, and hardware limits (e.g., smartphone WebView checks vs untested physical Android TV hardware).
