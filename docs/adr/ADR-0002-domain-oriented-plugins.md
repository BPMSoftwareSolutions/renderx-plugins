# ADR-0002: Domain-Oriented Plugin Structure (Conductor/StageCrew/Performer)

- Status: Proposed
- Date: 2025-08-19
- Owner: Plugin Architecture Working Group
- Related: ADR-0001 Orchestral Architecture; ADR‑0014 Manifest‑Driven Panel Slot Plugins; Issue #25

## Context

The repository currently mixes domain UI plugins (e.g., canvas-ui-plugin, component-library-plugin) with capability plugins (canvas-*-plugin, library-*-plugin). This creates redundancy and obscures ownership, and it violates the new boundary:

- No DOM writes in UI (plugins like CanvasPage).
- All DOM changes via StageCrew.
- All StageCrew ops occur inside play() sequence handlers.

## Decision

Restructure plugins around domains, exposing capabilities within each domain as symphonies and feature slices (Concertmaster/Arrangement/StageCrew/Rehearsal). Top-level plugin set:

- app-shell/
- app-header/
- theme/
- library/
- library-component/
- canvas/
- canvas-component/

## Structure

```
plugins/
  canvas/
    index.ts                 # UI-only; exports CanvasPage
    ui/
      pages/CanvasPage.tsx   # Thin (<100 lines); emits conductor.play only
      components/*.tsx       # Presentational only
  canvas-component/
    index.ts
    symphonies/
      select.symphony.ts
      overlay.symphony.ts
      drag.symphony.ts
      resize.symphony.ts
      create.symphony.ts
    features/
      selection/
        selection.concertmaster.ts
        selection.arrangement.ts
        selection.stage-crew.ts
        selection.rehearsal.test.ts
      overlay/
        overlay.concertmaster.ts
        overlay.arrangement.ts
        overlay.styles.ts
        overlay.stage-crew.ts
        overlay.rehearsal.test.ts
      drag/
        drag.concertmaster.ts
        drag.arrangement.ts
        drag.stage-crew.ts
        drag.rehearsal.test.ts
      resize/
        resize.concertmaster.ts
        resize.arrangement.ts
        resize.stage-crew.ts
        resize.rehearsal.test.ts
      create/
        create.concertmaster.ts
        create.arrangement.ts
        create.stage-crew.ts
        create.rehearsal.test.ts
  library/
    index.ts
    symphonies/
      load.symphony.ts
    ui/
      panels/LibraryPanel.tsx
      components/*.tsx
  library-component/
    index.ts
    symphonies/
      drag.symphony.ts
      drop.symphony.ts
    features/
      drag/*
      drop/*
  app-header/
    index.ts
    ui/*
  app-shell/
    index.ts
  theme/
    index.ts
    symphonies/theme.symphony.ts
    features/theme/*
```

## Manifest

- Fewer, domain-named entries:
  - Canvas (UI slot center)
  - Canvas Component (handlers only)
  - Library (UI slot left)
  - Library Component (handlers only)
  - Theme, App Header, App Shell

## Migration Plan (Incremental)

1) Author this ADR and open tracking issue (#25).
2) Scaffold domain folders and minimal index exports.
3) Move overlay feature to canvas-component handlers; remove UI-origin overlay beats.
4) Migrate drag/resize/create to canvas-component handlers.
5) Migrate library drag/drop to library-component handlers.
6) Update manifest generator/tests; keep CI green.
7) Trim CanvasPage to <100 lines; remove DOM writes and StageCrew calls.

## Acceptance Criteria

- CanvasPage contains no DOM writes or StageCrew calls; <100 LOC.
- Overlay/drag/resize StageCrew beats originate only in sequence handlers (meta.sequenceId present).
- Policy tests pass (stageCrew scope + no UI-origin beats).
- Manifest reflects domain-oriented plugins.

## Risks & Mitigations

- Refactor churn → Small PRs per feature; strong rehearsal coverage.
- Manifest/tooling drift → Manifest validation test; script updates.
- Naming confusion → Domain > capability convention, consistent across repo.

## Alternatives Considered

- Keep capability plugins top-level → confusing ownership and navigation.
- Flat monolith per slot → high coupling and lower testability.

## References

- ADR-0001 Orchestral Architecture
- ADR‑0014 Manifest‑Driven Panel Slot Plugins
- Issue #25

