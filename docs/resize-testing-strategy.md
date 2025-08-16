# Canvas Resize: Unit/Integration Test Strategy

This document defines the test plan, expected DOM/CSS outcomes, and verification steps for component resizing via overlay handles in the canvas UI.

## Objectives
- Verify that using overlay resize handles updates the overlay (live preview) and commits final component width/height on mouse-up.
- Enforce the conductor play()/callback contract for resize across pointerdown/move/up.
- Ensure pointer-capture and post-up hover behavior are correct and robust.
- Validate cursor policy: rx-draggable on hover; rx-grabbing only during active gesture.

## Scope
- Canvas UI overlay and handles
- CanvasPage resize callbacks (onResizeUpdate/onResizeEnd)
- Per-instance CSS and overlay CSS style tags
- Interaction with resize plugin through Musical Conductor

## Key concepts
- startBox: The baseline box (x,y,w,h) at the moment of pointerdown; must be provided to the plugin for each move frame.
- delta: Pointer delta (dx,dy) used with startBox to compute new size during move.
- Callbacks: onResizeUpdate (live overlay update), onResizeEnd (final commit).
- Per-instance CSS tag: `component-instance-css-<elementId>` (applies to the component’s cssClass selector).
- Overlay CSS tag: `overlay-css-<elementId>` (positions and sizes the overlay).

## Expected DOM/CSS outcomes
- During move (live preview):
  - `overlay-css-<id>` contains `.rx-overlay-<id>{ position:absolute; left:<x>px; top:<y>px; width:<w>px; height:<h>px; ... }` where `<w>,<h>` = baseline + delta.
- On end (commit to instance):
  - `component-instance-css-<id>` contains selectors for the component cssClass (e.g., `.rx-comp-button-<hash>{width:<w>px;}` and `.rx-comp-button-<hash>{height:<h>px;}`).
  - Overlay remains in sync with committed `<w>,<h>`.

## Conductor contract (per frame)
- PointerDown play must include:
  - `elementId`, `handle`, `start`, `startBox`, `onResizeUpdate`, `onResizeEnd`
- PointerMove play must include:
  - `elementId`, `handle`, `delta`, `startBox`, `onResizeUpdate`
- PointerUp play must include:
  - `elementId`, `handle`, `end`, `onResizeEnd`

The plugin should compute the box using `startBox + delta` and call `onResizeUpdate`/`onResizeEnd` appropriately.

## UI callbacks
- `onResizeUpdate({ elementId, box })`:
  - Track latest `box` as lastBox
  - Update `overlay-css-<id>` width/height accordingly
- `onResizeEnd({ elementId, box })`:
  - Commit instance CSS width/height for the component’s `cssClass`
  - Resync `overlay-css-<id>` to the committed size

## Pointer lifecycle
- On pointerdown:
  - Call `setPointerCapture(pointerId)`
  - Determine `startBox` (parse instance CSS or use defaults)
- On pointermove:
  - Ignore events unless `e.buttons === 1` (prevents hover moves)
  - rAF-coalesce updates; compute width/height = baseline + delta; call `onResizeUpdate` and play move with `startBox`
- On pointerup:
  - Call `releasePointerCapture(pointerId)`
  - Clear baseline cache
  - Ensure `onResizeEnd` is called with final box (fallback to `lastBox` if plugin omits)

## Cursor policy
- Hover over resizable component/overlay: `rx-draggable`
- Active drag/resize (between down and up): `rx-grabbing` (or appropriate resize cursor)
- After up: revert to `rx-draggable`; no hover-only moves should change size

## Current test inventory

Implemented tests (TDD):
- Payload contract
  - `tests/unit/plugins/canvas-ui-plugin-resize-payload-contract.test.ts`
  - Verifies `startBox` + callbacks on down; `startBox` + `delta` + `onResizeUpdate` on move; `onResizeEnd` on up.

- Live overlay + commit (SE handle)
  - `tests/unit/flows/ui-resize-handle-e2e-dom.test.ts`
  - Defaults 120x40; move dx=20,dy=10; expect overlay 140x50 during move; instance commit 140x50 on up.

- Pointer capture
  - `tests/unit/plugins/canvas-ui-plugin-resize-pointer-capture.test.ts`
  - Asserts `setPointerCapture` on down and `releasePointerCapture` on up.

- Post-up inert behavior
  - `tests/unit/flows/ui-resize-post-up-inert.test.ts`
  - After up, hover `onPointerMove` with `buttons=0` emits no plays and does not change overlay CSS.

Related existing tests (cursor/drag policy):
- `tests/unit/flows/ui-drag-cursor-sync.test.js`
- `tests/unit/flows/cursor-state-on-hover-and-grab.test.js`

## Planned extensions
- Handle coverage: E, S, W, N, NE, NW, SW; include negative deltas
- Constraints/aspect ratio tests (min/max size; locked aspect)
- Cursor tests specific to resize handles (hover vs active)
- Class alignment test: confirm committed cssClass selector matches the element’s actual class list at runtime

## Example assertions
- Overlay during move:
  - Expect `overlay-css-<id>` to contain `.rx-overlay-<id>{ ... width:140px; height:50px; ... }`
- Commit on end:
  - Expect `component-instance-css-<id>` to contain `.<cssClass>{width:140px;}` and `.<cssClass>{height:50px;}`
- Contract on move:
  - Each move play payload includes `{ delta, startBox, onResizeUpdate }`
- Pointer lifecycle:
  - `setPointerCapture(pointerId)` called on down; `releasePointerCapture(pointerId)` on up
- Post-up inert:
  - No additional move plays (with `delta`) after up; overlay CSS unchanged

## How to run
- All tests: `npm test`
- Focused:
  - Payload contract: `npm test -- -i tests/unit/plugins/canvas-ui-plugin-resize-payload-contract.test.ts`
  - Live DOM resize: `npm test -- -i tests/unit/flows/ui-resize-handle-e2e-dom.test.ts`
  - Pointer capture: `npm test -- -i tests/unit/plugins/canvas-ui-plugin-resize-pointer-capture.test.ts`
  - Post-up inert: `npm test -- -i tests/unit/flows/ui-resize-post-up-inert.test.ts`

## Known failure modes and diagnosis
- Overlay doesn’t grow during move
  - Move plays lack `startBox` or UI fails to call `onResizeUpdate`
- Component doesn’t resize on up
  - `onResizeEnd` not invoked; `lastBox` missing; committed cssClass does not match the element’s actual class
- Keeps resizing on hover after up
  - Missing pointer capture release; missing `buttons===1` guard; baseline not cleared
- Cursor incorrect on hover
  - Cursor class toggled too early; missing separation between hover and active state

## Acceptance criteria
- Contract: All resize plays include required fields (down/move/up).
- Live preview: Overlay width/height reflect baseline + delta per move.
- Commit: Instance CSS width/height are written for the correct cssClass on up.
- Pointer lifecycle: Capture held during gesture; released on up; hover inert.
- Cursor policy: rx-draggable on hover; rx-grabbing only during active gesture.

## Notes
- This plan adheres to the Musical Conductor pattern (play()/callbacks) and avoids direct global listeners.
- Tests were written Red first and made to pass (TDD).
