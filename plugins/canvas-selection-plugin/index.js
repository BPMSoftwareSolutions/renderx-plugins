/**
 * Canvas Component Selection Plugin (callback-first)
 */

export const sequence = {
  id: "Canvas.component-select-symphony",
  name: "Canvas Component Selection Symphony",
  description: "Select/deselect a canvas component and notify via callback",
  version: "1.0.0",
  key: "C Major",
  tempo: 120,
  timeSignature: "4/4",
  category: "ui-interactions",
  movements: [
    {
      id: "selection",
      name: "Selection",
      description: "Select or clear selection",
      beats: [
        {
          beat: 1,
          event: "canvas:selection:show",
          title: "Show selection",
          dynamics: "mf",
          timing: "immediate",
          errorHandling: "continue",
          handler: "handleSelect",
        },
        {
          beat: 2,
          event: "canvas:selection:hide",
          title: "Hide selection",
          dynamics: "mf",
          timing: "immediate",
          errorHandling: "continue",
          handler: "handleFinalize",
        },
      ],
    },
  ],
  events: {
    triggers: ["canvas:selection:show", "canvas:selection:hide"],
    emits: ["canvas:selection:show", "canvas:selection:hide"],
  },
};

export const handlers = {
  handleSelect: ({ elementId, onSelectionChange, position, defaults }, ctx) => {
    // Notify selection change
    try {
      onSelectionChange?.(elementId);
    } catch {}
    // StageCrew: mark element as selected (classes/styles can be extended later)
    try {
      const sc = ctx && ctx.stageCrew;
      if (sc && typeof sc.beginBeat === "function" && elementId) {
        const txn = sc.beginBeat(`selection:show:${elementId}`, {
          handlerName: "handleSelect",
          plugin: "canvas-selection-plugin",
          sequenceId: ctx?.sequence?.id,
          nodeId: elementId,
        });
        txn.update(`#${elementId}`, { classes: { add: ["rx-comp-selected"] } });
        txn.commit();
        // Ensure overlay CSS (global + instance) via StageCrew
        try {
          const effDefaults =
            defaults ||
            ctx?.payload?.defaults ||
            ctx?.component?.integration?.canvasIntegration ||
            {};
          const pos = position || ctx?.payload?.position || { x: 0, y: 0 };
          const w =
            typeof effDefaults?.defaultWidth === "number"
              ? effDefaults.defaultWidth
              : 0;
          const h =
            typeof effDefaults?.defaultHeight === "number"
              ? effDefaults.defaultHeight
              : 0;
          const txnG = sc.beginBeat(`overlay:global`, {
            handlerName: "overlayEnsure",
            plugin: "canvas-selection-plugin",
            sequenceId: ctx?.sequence?.id,
          });
          try {
            // Use UI overlayCss builders for now; later move into canvas-component overlay feature
            const {
              buildOverlayGlobalCssText,
            } = require("../canvas-ui-plugin/constants/overlayCss.js");
            txnG.upsertStyleTag(
              "overlay-css-global",
              buildOverlayGlobalCssText()
            );
          } catch {
            txnG.upsertStyleTag(
              "overlay-css-global",
              ".rx-resize-overlay{position:absolute;pointer-events:none;}.rx-resize-handle{position:absolute;}"
            );
          }
          txnG.commit();
          const txnI = sc.beginBeat(`overlay:${elementId}`, {
            handlerName: "overlayEnsure",
            plugin: "canvas-selection-plugin",
            sequenceId: ctx?.sequence?.id,
            nodeId: elementId,
          });
          try {
            const {
              buildOverlayInstanceCssText,
            } = require("../canvas-ui-plugin/constants/overlayCss.js");
            txnI.upsertStyleTag(
              `overlay-css-${elementId}`,
              buildOverlayInstanceCssText(
                { id: elementId, position: pos },
                w,
                h
              )
            );
          } catch {
            const cls = `.rx-overlay-${elementId}{position:absolute;left:${
              pos.x || 0
            }px;top:${pos.y || 0}px;width:${w}px;height:${h}px;z-index:10;}`;
            txnI.upsertStyleTag(`overlay-css-${elementId}`, cls);
          }
          txnI.commit();
        } catch {}
      }
    } catch {}
    return { elementId, selected: true };
  },
  handleFinalize: ({ elementId, clearSelection, onSelectionChange }, ctx) => {
    // Optionally clear selection via callback
    try {
      if (clearSelection === true) onSelectionChange?.(null);
    } catch {}
    // StageCrew: remove selected class if clearing selection
    try {
      const sc = ctx && ctx.stageCrew;
      if (
        sc &&
        typeof sc.beginBeat === "function" &&
        elementId &&
        clearSelection === true
      ) {
        const txn = sc.beginBeat(`selection:hide:${elementId}`, {
          handlerName: "handleFinalize",
          plugin: "canvas-selection-plugin",
          sequenceId: ctx?.sequence?.id,
          nodeId: elementId,
        });
        txn.update(`#${elementId}`, {
          classes: { remove: ["rx-comp-selected"] },
        });
        txn.commit();
      }
    } catch {}
    return { elementId: elementId ?? null, cleared: clearSelection === true };
  },
};
