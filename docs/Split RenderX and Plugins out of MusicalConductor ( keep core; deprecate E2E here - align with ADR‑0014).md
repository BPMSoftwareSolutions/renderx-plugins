Summary
This epic tracks the migration to separate RenderX and plugin code from the MusicalConductor repository while keeping the core conductor here. RenderX will move to its own repo (existing) and plugins to a new renderx-plugins repo. We will adopt the manifest‑driven panel‑slot‑plugin pattern (ADR‑0014) in RenderX, remove E2E tests from this repo, remove plugin‑dependent unit tests, and retain only conductor‑focused unit tests here.

Goals
- Keep MusicalConductor core in this repo with only its unit tests
- Move RenderX to its own repo and ensure it uses the manifest‑driven panel‑slot‑plugin pattern
- Create a renderx-plugins repo; move RenderX/public/plugins there, with build + manifest generator
- Deprecate and remove existing E2E tests in this repo; fresh E2E will live in the RenderX repo

References
- ADR‑0014: tools/docs/wiki/adr/0014-manifest-driven-panel-slot-plugins.md
- Current RenderX manifest: RenderX/public/plugins/manifest.json
- Vite alias (to be removed in RenderX): RenderX/vite.config.ts

Scope
In scope (this repo):
- Keep modules/communication/** and core conductor tests
- Remove e2e-tests/**
- Remove plugin‑dependent unit tests and setup
- Adjust Jest config and scripts accordingly

In scope (RenderX repo):
- Update to the version from this repo’s RenderX folder (ADR‑0014 implementation)
- Remove Vite alias for musical-conductor; depend on published package
- Continue using manifest-driven PanelSlot components

In scope (renderx-plugins repo):
- Move all RenderX/public/plugins/** into plugin repo
- Provide bundling per plugin to dist/{plugin}/index.js
- Generate a single manifest.json from built artifacts
- Publish artifacts for RenderX consumption (copy on build or CDN/Pages)

Out of scope:
- Any UI refactors not related to ADR‑0014
- Non-plugin features or data migration

Plan
1) MusicalConductor (this repo)
   - Remove e2e-tests/**
   - Remove plugin-dependent tests:
     - tests/unit/renderx/**
     - tests/unit/communication/cia-plugin-registration.test.ts
     - tests/setup/jest.cia-plugins.setup.ts
   - Update jest.config.js:
     - Remove jest.cia-plugins.setup.ts from setupFilesAfterEnv
     - Optionally remove RenderX path mapping if nothing references it
   - Update package.json scripts to drop e2e/plugin test scripts
   - Run unit tests and ensure remaining core tests pass

2) RenderX (separate repo; existing)
   - Sync RenderX/ from this repo (current ADR‑0014 version)
   - Ensure App shell only uses manifest‑driven panel-slot plugins
   - Remove Vite alias musical-conductor -> ../modules/communication
   - Add dependency on musical-conductor (npm package)
   - Keep src/types/plugins.d.ts for dynamic imports
   - Keep dev server config to serve /public/plugins

3) renderx-plugins (new repo)
   - Initialize repo: src/{plugin}/index.(ts|js)
   - Build each plugin to dist/{plugin}/index.js (tsup/Rollup)
   - Manifest generator to output manifest.json from dist/**
   - CI: build, validate exports (sequence + handlers), publish artifacts (release assets or Pages)

4) Integration between RenderX and renderx-plugins
   - Short-term: RenderX CI copies artifacts from renderx-plugins into renderx/public/plugins
   - Long-term: RenderX fetches manifest and plugin bundles from CDN/Pages URL

5) E2E strategy
   - Remove e2e-tests from this repo
   - Implement fresh E2E in RenderX repo to validate panel-slot plugin flows and manifest resolution per ADR‑0014

Checklists
MusicalConductor repo (this repo)
- [ ] Delete e2e-tests/**
- [ ] Delete tests/unit/renderx/**
- [ ] Delete tests/unit/communication/cia-plugin-registration.test.ts
- [ ] Delete tests/setup/jest.cia-plugins.setup.ts
- [ ] Update jest.config.js to remove the cia-plugins setup
- [ ] Update package.json scripts to remove e2e/plugin tests
- [ ] Run unit tests (core conductor only) and pass
- [ ] Update README to reflect scope (core only) and test commands

RenderX repo
- [ ] Replace RenderX/ with the version from this repo
- [ ] Ensure PanelSlot-only manifest-driven UI per ADR‑0014
- [ ] Remove alias to modules/communication; add musical-conductor dependency
- [ ] Keep types/plugins.d.ts
- [ ] Ensure dev server serves /public/plugins
- [ ] Add E2E tests from scratch covering library/canvas/control panel UIs and orchestration

renderx-plugins repo
- [ ] Initialize repo and move plugins (former RenderX/public/plugins/**)
- [ ] Build system for per-plugin dist/index.js
- [ ] Manifest generator
- [ ] CI to build/validate/publish artifacts
- [ ] Document local dev + consumption pattern for RenderX

Breaking/Behavioral Changes
- MusicalConductor repo will no longer include RenderX or plugins test scaffolding
- RenderX will depend on musical-conductor via npm (no local alias)
- Plugins are developed/bundled in renderx-plugins, not inside the RenderX repo’s public folder

Risks & Mitigations
- Version skew between RenderX and musical-conductor → SemVer discipline; caret range; CI checks
- Plugin availability for local dev/E2E → Provide copy-based integration first; add CDN later
- Test coverage gaps due to removals → Ensure RenderX E2E is added early and core unit tests stay green

Acceptance Criteria
- This repo builds and passes unit tests with only conductor-focused tests
- RenderX repo builds and uses manifest-driven panel-slot plugins without local alias
- renderx-plugins repo can build all plugins and produce a valid manifest consumed by RenderX
- E2E tests exist in RenderX repo validating ADR‑0014 flows

Rollback Plan
- If RenderX cannot consume the published musical-conductor immediately, temporarily use npm link/file: dependency until publish is complete
- Keep a branch with current monorepo layout for quick fallback

Owners & Coordination
- Core (this repo): [Musical Conductor](https://github.com/BPMSoftwareSolutions/MusicalConductor)
- RenderX repo: [RenderX](https://github.com/BPMSoftwareSolutions/RenderX)
- renderx-plugins repo: [RenderX Plugins](https://github.com/BPMSoftwareSolutions/renderx-plugins)

Next Actions
- Confirm plugin artifact consumption path for RenderX (copy vs CDN) for initial cutover
- Approve deletion of e2e-tests and plugin-dependent tests in this repo
- Provide RenderX repo URL/branch for sync

Additional Notes
A session dev log with strategy is available at ./.logs/dev-log-refactor-repo-split-2025-08-12.md