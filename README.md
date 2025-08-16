# RenderX Plugins

Official plugin repository for the RenderX platform. This repo contains all panel-slot UI plugins and orchestration logic that extend the RenderX core, built according to the Manifest‑Driven Panel Slot Plugin architecture (ADR‑0014).

Reference: https://github.com/BPMSoftwareSolutions/MusicalConductor/blob/main/tools/docs/wiki/adr/0014-manifest-driven-panel-slot-plugins.md

---

## Overview

RenderX plugins are modular, lazily-loaded components integrated into the RenderX shell via a manifest. Each plugin typically provides:

- UI component(s) mounted into named slots (left, center, right, header-left, header-center, header-right)
- Orchestration handlers registered with the Musical Conductor (sequence/movement/beat)
- Isolated build artifacts in dist/{plugin}/index.js
- A manifest entry consumed by RenderX at runtime

This repository builds and publishes:

1. All plugin bundles to dist/
2. A generated dist/manifest.json for RenderX to consume

---

## Quickstart

- Requirements: Node.js 18+
- Install deps: npm ci
- Build all plugins and manifest: npm run build
- Run tests: npm test

Artifacts are emitted to dist/, including dist/manifest.json.

---

## Repository Structure

- plugins/ — source for all plugins (each folder represents a plugin or plugin group)
  - component-library-plugin/
  - control-panel-plugin/
  - canvas-ui-plugin/
  - canvas-\*/ (drag, resize, selection, create)
  - library-\*/ (drag/drop)
  - header/ (left, center, right)
  - theme-management-plugin/
- scripts/
  - build-plugins.mjs — copies plugin source to dist/{plugin}/...
  - generate-manifest.mjs — scans dist and produces dist/manifest.json
- tests/ — unit tests (Jest, jsdom)
- jest.config.js — Jest configuration
- shims/communication — test shims for conductor communication
- docs/ — architecture and repo split notes

---

## NPM Scripts

- npm test — run unit tests (Jest)
- npm run test:ci — CI mode tests
- npm run build:plugins — copy-based build to dist/
- npm run build:manifest — generate dist/manifest.json
- npm run build — build plugins then generate manifest

### Build and Manifest Scripts

- Build plugins (copy from plugins/ to dist/):
  - Usage: node ./scripts/build-plugins.mjs
  - Output: dist/<plugin>/\*\* (all files copied; no bundling)
- Generate manifest (scan dist for plugin entries and write dist/manifest.json):
  - Usage: node ./scripts/generate-manifest.mjs
  - Notes:
    - A plugin is recognized if dist/<plugin>/index.js exists
    - Known UI slot hints are inferred by path; see slotHintsByRelPath in scripts/generate-manifest.mjs
    - Header UI plugins are marked autoMount: false; other plugins default to autoMount: true

---

## Manifest and Slot Mapping

The manifest is generated from dist/\*\*/index.js entries. Known UI slot mappings are inferred by path hints in scripts/generate-manifest.mjs:

- component-library-plugin/ → slot: left, export: LibraryPanel
- control-panel-plugin/ → slot: right, export: ControlPanelPanel
- canvas-ui-plugin/ → slot: center, export: CanvasPage
- header/left/ → slot: header-left, export: HeaderLeft
- header/center/ → slot: header-center, export: HeaderCenter
- header/right/ → slot: header-right, export: HeaderRight

If you add a new UI plugin that should auto-mount into a slot, either:

- Place it under one of the recognized paths above, or
- Update slotHintsByRelPath in scripts/generate-manifest.mjs to declare the mapping.

All other plugins will be included in the manifest without a ui slot hint by default.

---

## Development Conventions

- Callback-first orchestration: Use conductor.play("<Plugin>", "<symphony>", payload, callbacks) and handle results via provided callbacks. Avoid direct DOM event listeners in plugins.
- Follow repository TDD workflow: Red → Green → Refactor.
- Keep plugin bundles isolated; do not depend on RenderX internals. Interact via the Musical Conductor only.

---

## Adding a New Plugin

1. Create plugins/your-plugin-name/index.js and export your entry API/UI.
2. Run npm run build to copy to dist/ and update dist/manifest.json.
3. If your plugin should render UI in a specific slot, add a slot hint in scripts/generate-manifest.mjs.
4. Add unit tests under tests/ to validate your orchestration handlers and expected conductor interactions.

---

## Using with the RenderX App

Short-term integration (per repo split plan):

- After building this repo, copy dist/\* into the RenderX app’s public/plugins folder so the app can fetch dist/manifest.json and bundles.
- Alternatively, point RenderX to a CDN or static host that serves this repo’s dist/.

Long-term, RenderX will fetch the manifest and plugin bundles from a CDN/Pages URL.

---

## Testing

- Test runner: Jest (jsdom). See jest.config.js.
- Setup files: tests/setup/jest.setup.ts, tests/setup/jest.cia-plugins.setup.ts, global setup/teardown.
- Location: tests/\*_/_.test.(ts|js)

Run: npm test

---

## Contributing

- Use TDD (Red-Green-Refactor) for all fixes and features.
- Link changes to a GitHub issue and reference it in commit messages (e.g., feat(#123): short description).
- Architecture changes require an ADR under docs/adr or docs/wiki/adr (see ADR‑0014 as reference).

---

## Related Docs

- Repo split plan: docs/Split RenderX and Plugins out of MusicalConductor ( keep core; deprecate E2E here - align with ADR‑0014).md
- ADR‑0014 (Manifest‑Driven Panel Slot Plugins): external link above

---

## License

MIT
