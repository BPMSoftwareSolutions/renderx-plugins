# RenderX Plugins

**Official plugin repository for the RenderX platform** — This repo contains all panel-slot UI plugins and orchestration logic that extend the RenderX core, built according to the [Manifest-Driven Panel Slot Plugin architecture (ADR-0014)](https://github.com/BPMSoftwareSolutions/MusicalConductor/blob/main/tools/docs/wiki/adr/0014-manifest-driven-panel-slot-plugins.md).

---

## Overview

RenderX plugins are modular, lazily-loaded React components that integrate with the RenderX shell via a manifest.
Each plugin provides:

* **UI Component(s)** mounted into named slots (`left`, `center`, `right`)
* **Orchestration Handlers** registered with the Musical Conductor for sequence/movement/beat workflows
* **Isolated Build Artifacts** (`dist/{plugin}/index.js`) for production delivery
* **Manifest Entries** describing slot position and export mapping

This repo builds and publishes:

1. **All plugin bundles**
2. **A generated `manifest.json`** for RenderX to consume at runtime

---

## Architecture

* **Manifest-Driven Loading**: The RenderX shell fetches `manifest.json` and mounts plugin UIs in the correct slots
* **Thin Shell + Orchestrated Panels**: All orchestration logic lives in plugins, not in the RenderX core
* **Callback-First Data Flow**: Plugins initiate workflows via `conductor.play(...)` and receive explicit callbacks

Reference: [ADR-0014](https://github.com/BPMSoftwareSolutions/MusicalConductor/blob/main/tools/docs/wiki/adr/0014-manifest-driven-panel-slot-plugins.md)

---

## Repository Structure
