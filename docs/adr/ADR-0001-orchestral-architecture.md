# ADR-0001: Orchestral Architecture for Scalable Plugins

- Status: Proposed
- Date: 2025-08-16
- Owners: Plugin Architecture Working Group
- Related: Musical Conductor pattern; QA Theme Symphony tests

## Context

The current Canvas UI plugin concentrates many responsibilities in a single component (e.g., CanvasPage.js): bootstrapping, state, event handling, rendering, CSS injection, and conductor wiring. This increases cognitive load, hinders testability, and makes scaling difficult.

We want a scalable, testable, and comprehensible architecture that:

- Enforces single-responsibility boundaries
- Uses the Musical Conductor play()/callback pattern exclusively (no direct global listeners)
- Keeps UI components thin and logic side-effect-free where possible
- Is friendly to Red-Green-Refactor (TDD). In this domain, tests are “Rehearsals.”

## Decision

Adopt an “Orchestral Architecture” with three core actors and one testing convention:

- Controller → Concertmaster
  - Coordinates feature flow, interprets Conductor cues, orchestrates calls to Services and Adapters
- Service → Arrangement
  - Pure domain logic and rules (math, transforms, decisions); no side effects
- Adapter → StageCrew
  - Ports/adapters that interact with the environment (DOM, CSS, window). The only place for side effects
- Store → Prompt Book
  - The authoritative, annotated state of the performance (nodes, selection). Concertmasters write via actions; everyone reads via selectors
- Tests → Rehearsals
  - All tests are named and described as rehearsals; we practice the score before the performance

All event flows originate from UI elements as React events or from other symphonies, and are routed through the Conductor (play/callback). Concertmasters consult the Prompt Book (selectors), decide using Arrangements (pure logic), record outcomes in the Prompt Book (actions), and delegate side effects to StageCrew.

## Vocabulary Mapping

- Controller → Concertmaster / SectionLeader / Principal
- Service → Arrangement / Orchestration / ScoreEngine
- Adapter → StageCrew / InstrumentTech / FOH (SoundEngineer)
- Tests → Rehearsals

Recommended set used in code: Concertmaster, Arrangement, StageCrew, Rehearsal.

## High-level Structure (per plugin)

```
plugins/
  canvas-ui-plugin/
    index.ts                         # registers symphonies, mounts page
    symphonies/
      canvas.ui.symphony.ts
      drag.symphony.ts
      resize.symphony.ts
      selection.symphony.ts
      overlay.symphony.ts
      drop.symphony.ts
      theme.symphony.ts
    features/
      drag/
        drag.concertmaster.ts        # Controller
        drag.arrangement.ts          # Service
        drag.stage-crew.ts           # Adapter(s)
        drag.rehearsal.test.ts       # Tests
      resize/
        resize.concertmaster.ts
        resize.arrangement.ts
        resize.stage-crew.ts
        resize.rehearsal.test.ts
      overlay/
        overlay.concertmaster.ts
        overlay.arrangement.ts
        overlay.styles.ts
        overlay.stage-crew.ts
        overlay.rehearsal.test.ts
      selection/
        selection.concertmaster.ts
        selection.arrangement.ts
        selection.rehearsal.test.ts
      drop/
        drop.concertmaster.ts
        drop.arrangement.ts
        drop.rehearsal.test.ts
      theme/
        theme.concertmaster.ts
        theme.arrangement.ts
        theme.rehearsal.test.ts
    ui/
      pages/CanvasPage.tsx           # Thin composition; no side effects
      components/*.tsx               # Presentational; emit conductor.play
      hooks/*.ts                     # Read-only selectors, minor glue
    state/
      canvas.prompt-book.ts          # Shared store (Prompt Book) with selectors/actions
      selectors.ts
      actions.ts
    adapters/
      conductor.adapter.ts           # Typed facade
      env.adapter.ts                 # window/document guards
      css.adapter.ts                 # <style> management
    services/
      geometry.ts, css-utils.ts
    styles/
      global.css, overlay.css
    tests/harness/
      conductor.mock.ts, react.setup.ts
```

## Typical Flow

1. UI event → conductor.play('Canvas.component-drag-symphony','update', payload)
2. Symphony dispatch → Drag Concertmaster receives event
3. Concertmaster invokes Drag Arrangement (pure math) → next position
4. Concertmaster updates state and calls Overlay Concertmaster via play, or asks StageCrew to apply CSS via overlay channel

## Code Sketches

Concertmaster (Controller):

```ts
// features/drag/drag.concertmaster.ts
export function registerDragConcertmaster(
  conductor,
  { store, dragArrangement }
) {
  conductor.on("Canvas.component-drag-symphony", "start", ({ elementId }) => {
    store.actions.select(elementId);
    conductor.play("Overlay", "hide-handles", { elementId });
  });

  conductor.on(
    "Canvas.component-drag-symphony",
    "update",
    ({ elementId, delta }) => {
      const current = store.selectors.positionOf(elementId);
      const next = dragArrangement.applyDelta(current, delta);
      store.actions.move(elementId, next);
      conductor.play("Overlay", "transform", {
        elementId,
        dx: delta.dx,
        dy: delta.dy,
      });
    }
  );

  conductor.on("Canvas.component-drag-symphony", "end", ({ elementId }) => {
    const pos = store.selectors.positionOf(elementId);
    conductor.play("Overlay", "commit-position", { elementId, position: pos });
    conductor.play("Overlay", "show-handles", { elementId });
  });
}
```

Arrangement (Service):

```ts
// features/drag/drag.arrangement.ts
export const dragArrangement = {
  applyDelta(current, delta) {
    const x = (current?.x || 0) + (delta?.dx || 0);
    const y = (current?.y || 0) + (delta?.dy || 0);
    return { x, y };
  },
};
```

StageCrew (Adapter):

```ts
// features/overlay/overlay.stage-crew.ts
export function makeOverlayStageCrew(cssAdapter, overlayArrangement) {
  return {
    transform(elementId, dx, dy) {
      const css = overlayArrangement.transformRule(elementId, dx, dy);
      cssAdapter.upsertStyle(`overlay-transform-${elementId}`, css);
    },
    hide(elementId) {
      const css = overlayArrangement.hideRule(elementId);
      cssAdapter.upsertStyle(`overlay-visibility-${elementId}`, css);
    },
    show(elementId) {
      cssAdapter.removeStyle(`overlay-visibility-${elementId}`);
    },
    commitInstance(elementId, position, size) {
      const css = overlayArrangement.instanceRule(elementId, position, size);
      cssAdapter.upsertStyle(`overlay-instance-${elementId}`, css);
    },
  };
}
```

Rehearsal (Test):

```ts
// features/drag/drag.rehearsal.test.ts
import { dragArrangement } from "./drag.arrangement";

describe("Drag Rehearsal", () => {
  it("applies deltas", () => {
    const next = dragArrangement.applyDelta({ x: 10, y: 5 }, { dx: 3, dy: -2 });
    expect(next).toEqual({ x: 13, y: 3 });
  });
});
```

UI component (thin; emits play):

```tsx
// ui/components/CanvasNode.tsx
export function CanvasNode({ id, position, className, conductor }) {
  return (
    <div
      className={`rx-node ${className}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onPointerDown={() =>
        conductor.play("Canvas.component-drag-symphony", "start", {
          elementId: id,
        })
      }
      onPointerMove={(e) =>
        e.buttons === 1 &&
        conductor.play("Canvas.component-drag-symphony", "update", {
          elementId: id,
          delta: { dx: e.movementX, dy: e.movementY },
        })
      }
      onPointerUp={() =>
        conductor.play("Canvas.component-drag-symphony", "end", {
          elementId: id,
        })
      }
    />
  );
}
```

## Advantages

- Single-responsibility boundaries (UI vs logic vs side effects)
- Testability: arrangements are pure; stage-crew can be mocked; concertmasters are thin
- Scale: add features as new vertical slices without bloating shared files
- Conductor-first: consistent orchestration across plugins; no direct window listeners
- UX policy codified: hide handles during drag; show on drop; cursor states controlled centrally
- Theme propagation: AppShell theme symphony updates flow through concertmasters

## Risks & Mitigations

- More files: mitigated by clear naming and feature folders
- Initial refactor cost: mitigated by incremental migration and rehearsal coverage
- Naming confusion: “Conductor” (system) vs “Concertmaster” (controller) clarified in glossary

## Migration Plan (Incremental)

1. Introduce folders (features, symphonies, adapters, state, ui)
2. Extract Overlay into overlay/\* (arrangement + stage-crew). Replace direct DOM CSS with css.adapter
3. Extract Drag/Resize into drag/_, resize/_; move window callbacks into symphonies
4. Introduce canvas.store with selectors/actions. Concertmasters update state, not components directly
5. Add rehearsals for overlay rules, drag deltas, resize commits, and theme
6. Clean up CanvasPage to a thin page with presentational components

## Success Criteria

- All rehearsals pass (incl. QA theme symphony checks)
- No global listeners; all flows via conductor.play
- CanvasPage (and similar) < 200 lines and focused on composition only

## Alternatives Considered

- Keep “controller/service/adapter” names: acceptable but less domain-aligned
- MVC per plugin: tends to push side effects into controllers and mix concerns

## References

- Musical Conductor pattern in this repository
- Internal UX policy: hide handles on drag; show on drop; cursor states
