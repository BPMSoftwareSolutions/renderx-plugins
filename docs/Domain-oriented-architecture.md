## Short answer
- Yes: after a user click, the very first play() is from the UI’s select handler.
- It calls: play("Canvas.component-select-symphony", "Canvas.component-select-symphony", { elementId, ... }).
- Business logic should not live in CanvasPage. It should only call play(); each beat’s handler (selection, then overlay) performs StageCrew transactions.

## Where the click starts today
- The Canvas UI wires the click to handlers/select.js, which performs the first play():

````js path=plugins/canvas-ui-plugin/handlers/select.js mode=EXCERPT
conductor.play(
  "Canvas.component-select-symphony",
  "Canvas.component-select-symphony",
  { elementId: node.id, onSelectionChange: ... }
);
````

- The selection symphony/handlers exist here:

````js path=plugins/canvas-selection-plugin/index.js mode=EXCERPT
export const sequence = { id: "Canvas.component-select-symphony", ... };
export const handlers = {
  handleSelect: ({ elementId }, ctx) => {
    const txn = ctx.stageCrew.beginBeat(`selection:show:${elementId}`, ...);
    txn.update(`#${elementId}`, { classes: { add: ["rx-comp-selected"] } });
    txn.commit();
  },
};
````

- Today, overlay ensure (CSS) is still driven from the UI layer (CanvasPage / UI utils), which we are migrating into handlers.

## Target flow (after migration)
- CanvasPage stays thin: it renders, and on click calls play("Canvas.component-select-symphony", …). No DOM writes or business rules.
- The selection handler then triggers overlay via StageCrew, either:
  - directly inside handleSelect, or
  - by internally calling another sequence (Canvas.overlay-symphony) via conductor.play

The overlay handler(s) do:
- Ensure overlay global CSS once
- Ensure overlay instance CSS for the selected element’s bounds
- Subsequent interactions (drag/resize) update overlay via their own handlers

## Visual: Current vs Target

Current (what exists today)
- Click → UI select handler → play(select)
- select.handleSelect → StageCrew: add rx-comp-selected
- UI (CanvasPage/useEffect) → overlay CSS ensure + transform/visibility DOM writes

Target (after migration)
- Click → UI select handler → play(select)
- select.handleSelect → StageCrew: add rx-comp-selected
- select.handleSelect → play(overlay.ensure) OR directly StageCrew: upsert overlay-css-global + overlay-css-<id>
- Drag/Resize handlers → StageCrew: overlay hide/transform/show + instance position/size commits

### Sequence diagram (target)
- High level: UI only emits play; all DOM via StageCrew in handlers

Participant list:
- User
- CanvasPage (UI)
- Conductor
- Selection handlers
- Overlay handlers
- StageCrew

Flow:
1) User clicks element in Canvas
2) CanvasPage.onClick → play("Canvas.component-select-symphony", { elementId })
3) Conductor routes to selection.handleSelect
4) selection.handleSelect:
   - StageCrew: add rx-comp-selected
   - play("Canvas.overlay-symphony", { ensureGlobal: true, ensureInstance: { id, pos, w, h } })
5) Conductor routes to overlay handlers
6) overlay.ensureGlobal/Instance:
   - StageCrew: upsertStyleTag("overlay-css-global", ...), upsertStyleTag(`overlay-css-${id}`, ...)
7) UI overlay element is just presentational; no DOM writes; styles are applied by StageCrew

## Confirmation on “no business logic in CanvasPage”
- That’s the goal. Retrieval shows CanvasPage still has DOM style injections and instance CSS updates today. Those are the pieces to remove in the migration.
- After migration, CanvasPage:
  - renders nodes and overlay element
  - wires UI events to conductor.play only
  - contains no useEffects that mutate DOM; no overlayEnsure*; no instance CSS updates


## Overview
You’re correct: CanvasPage should only render and call conductor.play on user actions. All DOM updates (overlay, instance CSS, cursors) must be StageCrew ops executed inside sequence handlers.

Below is a precise cut‑over mapping from each remaining CanvasPage side‑effect to the handler that should own it, including the StageCrew operations each handler will perform.

## What kicks off the operation
- First play() after a user click:
  - Canvas UI click handler calls:
    - play("Canvas.component-select-symphony", "Canvas.component-select-symphony", { elementId, onSelectionChange })
- From there, handlers do all the work via StageCrew. CanvasPage contains no business logic or DOM manipulation.

Code today:
````js path=plugins/canvas-ui-plugin/handlers/select.js mode=EXCERPT
conductor.play(
  "Canvas.component-select-symphony",
  "Canvas.component-select-symphony",
  { elementId: node.id, onSelectionChange: ... }
);
````

## Side‑effects in CanvasPage and who should own them

1) Overlay transform during drag (apply/clear)
- Current UI code
  - Creates overlay-transform-<id> style tag and updates CSS on move; clears on end
  - Location:
````js path=plugins/canvas-ui-plugin/core/CanvasPage.js mode=EXCERPT
    const styleId = `overlay-transform-${selectedId}`;
    let tag = document.getElementById(styleId) || document.createElement("style");
    tag.textContent = `.rx-overlay-${selectedId}{transform:translate(${dx}px,${dy}px);}`;
````
- Move to
  - Canvas.component-drag-symphony handlers
    - handleDragMove: StageCrew upsertStyleTag(`overlay-transform-${id}`, `.rx-overlay-${id}{transform:translate(dx,dy);}`)
    - handleDragEnd: StageCrew removeStyleTag(`overlay-transform-${id}`)
- StageCrew sketch
  - beginBeat("overlay:transform:<id>", meta).upsertStyleTag(`overlay-transform-${id}`, css).commit()
  - beginBeat("overlay:clear-transform:<id>", meta).removeStyleTag(`overlay-transform-${id}`).commit()

2) Overlay visibility toggle (hide on drag start, show on drop)
- Current UI code
  - Hides overlay during drag, shows on end (now partially stubbed)
  - Location:
````js path=plugins/canvas-ui-plugin/core/CanvasPage.js mode=EXCERPT
    const onDragStart = ({ elementId }) => { /* setOverlayHidden(true) */ };
    const onDragEnd = ({ elementId }) => { /*

## Overview
You’re correct: CanvasPage should contain no business logic. The UI should only call play(), and handlers in the selection/overlay/drag/resize sequences should do all DOM changes via StageCrew. Below is a precise mapping from remaining CanvasPage side-effects to the exact handler(s) that should own them, plus a cut-over checklist and flow visuals.

## Inventory: remaining CanvasPage side-effects (what to move)
- Overlay transform style tag creation/cleanup during drag
````js path=plugins/canvas-ui-plugin/core/CanvasPage.js mode=EXCERPT
const styleId = `overlay-transform-${selectedId}`;
let tag = document.getElementById(styleId) || document.createElement("style");
tag.textContent = `.rx-overlay-${selectedId}{transform:translate(...);}`;
````

- Overlay visibility toggles during drag
````js path=plugins/canvas-ui-plugin/core/CanvasPage.js mode=EXCERPT
const onDragStart = ({ elementId }) => { /* setOverlayHidden(true) */ };
const onDragEnd = ({ elementId }) => { /* setOverlayHidden(false) */ };
````

- Instance CSS updates (position/size) from UI callbacks, esp. resize
````js path=plugins/canvas-ui-plugin/core/CanvasPage.js mode=EXCERPT
updateInstanceSizeCSS(elementId, cls, widthPx, heightPx, { x: posX, y: posY });
````

- UI global for state and callbacks (drag/resize overlay coordination)
````js path=plugins/canvas-ui-plugin/core/CanvasPage.js mode=EXCERPT
w.__rx_canvas_ui__.onDragStart = onDragStart;
w.__rx_canvas_ui__.onDragUpdate = onDragUpdate;
w.__rx_canvas_ui__.onDragEnd = onDragEnd;
````

- Overlay ensure imports in CanvasPage (should be removed)
````js path=plugins/canvas-ui-plugin/core/CanvasPage.js mode=EXCERPT
import { overlayEnsureGlobalCSS, overlayEnsureInstanceCSS } from "../utils/styles.js";
````

## Exact ownership mapping (target)
- Selection click → Ensure overlay CSS (global + instance)
  - From: CanvasPage (indirectly today)
  - To: plugins/canvas-selection-plugin/index.js handleSelect OR a dedicated Canvas.overlay-symphony.ensure handler invoked from handleSelect
    - StageCrew ops:
      - upsertStyleTag("overlay-css-global", globalCss)
      - upsertStyleTag(`overlay-css-${id}`, instanceCss for left/top/width/height)

- Drag start → Hide overlay handles
  - From: CanvasPage onDragStart/setOverlayHidden(true)
  - To: plugins/canvas-drag-plugin/index.js handleDragStart
    - StageCrew ops:
      - upsertStyleTag(`overlay-visibility-${id}`, `.rx-overlay-${id}{display:none;}`)

- Drag move → Apply overlay transform (follow cursor)
  - From: CanvasPage applyOverlayTransform()
  - To: plugins/canvas-drag-plugin/index.js handleDragMove
    - StageCrew ops:
      - upsertStyleTag(`overlay-transform-${id}`, `.rx-overlay-${id}{transform:translate(dx,dy);}`)

- Drag end → Show overlay, clear transform, re-base overlay, persist instance position CSS
  - From: CanvasPage onDragEnd, clearOverlayTransform(), overlayEnsureInstanceCSS(), updateInstancePositionCSS/size
  - To: plugins/canvas-drag-plugin/index.js handleDragEnd
    - StageCrew ops:
      - removeStyleTag(`overlay-visibility-${id}`)
      - upsertStyleTag(`overlay-css-${id}`, instanceCss using final position and default size)
      - removeStyleTag(`overlay-transform-${id}`)
      - upsertStyleTag(`component-instance-css-${id}`, instance position CSS)
    - Note: UI’s drag handler already sends instanceClass and cssText in payload; handler can upsert cssText directly

- Resize move → Live overlay box update + live instance size CSS update
  - From: CanvasPage onResizeUpdate updateInstanceSizeCSS
  - To: plugins/canvas-resize-plugin/index.js handleResizeMove
    - StageCrew ops:
      - upsertStyleTag(`overlay-css-${id}`, instanceCss for current x,y,w,h)
      - upsertStyleTag(`component-instance-css-${id}`, width/height (and possibly left/top when handles invert)

- Resize end → Finalize instance size CSS (and re-ensure overlay if needed)
  - From: CanvasPage onResizeEnd updateInstanceSizeCSS
  - To: plugins/canvas-resize-plugin/index.js handleResizeEnd
    - StageCrew ops:
      - upsertStyleTag(`component-instance-css-${id}`, final width/height/pos)
      - upsertStyleTag(`overlay-css-${id}`, final x,y,w,h (optional if unchanged)

- Remove UI globals for overlay coordination
  - From: window.__rx_canvas_ui__.onDrag*/onResize*
  - To: conductor.play within UI handlers only; all coordination done by handlers via StageCrew (no UI callbacks)

## Kickoff: first play() call (confirmed)
- The first call after a user click is in the UI select handler:

````js path=plugins/canvas-ui-plugin/handlers/select.js mode=EXCERPT
conductor.play("Canvas.component-select-symphony", "Canvas.component-select-symphony", { elementId: node.id, onSelectionChange: ... });
````

- After migration, selection.handleSelect also triggers overlay ensure (either directly or by playing Canvas.overlay-symphony).

## Visual flow: selection and drag (target)

Selection (click)
- CanvasPage.onClick → play("Canvas.component-select-symphony", { elementId })
- selection.handleSelect:
  - StageCrew: add rx-comp-selected to element
  - StageCrew: upsert overlay-css-global (once)
  - StageCrew: upsert overlay-css-<id> with left/top/w/h

Drag
- CanvasPage.onPointerDown → play("Canvas.component-drag-symphony", { elementId, origin })
- drag.handleDragStart:
  - StageCrew: hide overlay (overlay-visibility-<id>)
  - StageCrew: apply grabbing class on element
- CanvasPage.onPointerMove → play("Canvas.component-drag-symphony", { elementId, delta })
- drag.handleDragMove:
  - StageCrew: upsert overlay-transform-<id> with translate(dx,dy)
  - StageCrew: element inline transform (if desired)
- CanvasPage.onPointerUp → play("Canvas.component-drag-symphony", { elementId, position, instanceClass, cssText, event: "drag:end" })
- drag.handleDragEnd:
  - StageCrew: clear transform/hide styles
  - StageCrew: re-ensure overlay-css-<id> at final position
  - StageCrew: upsert component-instance-css-<id> with final left/top
  - StageCrew: show overlay (remove visibility style)

Resize
- Overlay handle onPointerDown/Move/Up → play("Canvas.component-resize-symphony", ...)
- resize.handleResizeMove/End:
  - StageCrew: upsert overlay-css-<id> for live x,y,w,h
  - StageCrew: upsert component-instance-css-<id> width/height (and left/top when needed)

## Cut-over checklist (incremental)
1) Selection ensures overlay
- Add overlay ensure in selection.handleSelect (or call overlay symphony)
- Remove any overlayEnsure* calls/imports from CanvasPage

2) Drag moves overlay via handlers
- In drag.handleDragStart: overlay hidden (visibility tag)
- In drag.handleDragMove: overlay transform tag upsert
- In drag.handleDragEnd: clear transform/visibility, re-ensure overlay at final pos, upsert instance position css
- Remove CanvasPage applyOverlayTransform/clearOverlayTransform and onDrag* wiring

3) Resize controls overlay and instance CSS
- In resize.handleResizeMove: upsert overlay instance CSS and component-instance css (w/h)
- In resize.handleResizeEnd: finalize instance css (and overlay if necessary)
- Remove CanvasPage onResizeUpdate/onResizeEnd DOM writes

4) Thin CanvasPage
- Delete remaining DOM mutations and globals; keep only rendering and conductor.play calls
- Target <100 LOC

5) Tests
- Update overlay-follow test to assert StageCrew upserts overlay-transform-<id> rather than UI side-effects
- Ensure policy tests pass (no UI-origin overlay beats, beats carry sequenceId)
- Keep selection overlay bounds tests green (ensured by selection handlers)

## Notes on current code that already aligns
- First play() is already in UI select handler (correct kickoff point).
- Drag UI already forwards cssText+instanceClass to handlers on drop; drag.handleDragEnd should upsert that cssText (owned by handler).
- Selection plugin already uses StageCrew to add rx-comp-selected; it’s the right place to add overlay ensures.

