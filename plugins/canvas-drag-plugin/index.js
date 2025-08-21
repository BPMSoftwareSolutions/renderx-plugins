/**
 * Canvas Component Drag Plugin (callback-first)
 */

import { updateInstancePositionCSSViaStageCrew } from "../canvas-ui-plugin/styles/instanceCss.js";

export const sequence = {
  id: "Canvas.component-drag-symphony",
  name: "Canvas Component Drag Symphony",
  description: "Drag/move a canvas component with callback updates",
  version: "1.0.0",
  key: "D Minor",
  tempo: 120,
  timeSignature: "4/4",
  category: "ui-interactions",
  movements: [
    {
      id: "drag",
      name: "Drag",
      beats: [
        {
          beat: 1,
          event: "canvas:element:drag:start",
          title: "Drag start",
          dynamics: "mf",
          timing: "immediate",
          errorHandling: "continue",
          handler: "handleDragStart",
        },
        {
          beat: 2,
          event: "canvas:element:moved",
          title: "Element moved",
          dynamics: "mf",
          timing: "immediate",
          errorHandling: "continue",
          handler: "handleDragMove",
        },
        {
          beat: 3,
          event: "canvas:element:drag:end",
          title: "Drag end",
          dynamics: "mf",
          timing: "immediate",
          errorHandling: "continue",
          handler: "handleDragEnd",
        },
      ],
    },
  ],
  events: {
    triggers: [
      "canvas:element:drag:start",
      "canvas:element:moved",
      "canvas:element:drag:end",
    ],
    emits: [
      "canvas:element:drag:start",
      "canvas:element:moved",
      "canvas:element:drag:end",
    ],
  },
};

export const handlers = {
  handleDragStart: ({ elementId, origin }, ctx) => {
    if (!elementId) return {};
    const res = { drag: { elementId, origin } };
    try {
      const sc = ctx && ctx.stageCrew;
      if (sc && typeof sc.beginBeat === "function") {
        const txn = sc.beginBeat(`drag:start:${elementId}`, {
          handlerName: "handleDragStart",
          plugin: "canvas-drag-plugin",
          sequenceId: ctx?.sequence?.id,
          nodeId: elementId,
        });
        txn.update(`#${elementId}`, {
          classes: { remove: ["rx-comp-draggable"], add: ["rx-comp-grabbing"] },
          style: { touchAction: "none", willChange: "transform" },
        });
        txn.commit();
      }
    } catch {}
    return res;
  },
  handleDragMove: ({ elementId, delta, onDragUpdate }, ctx) => {
    if (!elementId) return {};
    const o = (ctx &&
      ctx.payload &&
      ctx.payload.drag &&
      ctx.payload.drag.origin) || { x: 0, y: 0 };
    const dx = Math.round(delta?.dx || 0);
    const dy = Math.round(delta?.dy || 0);
    const position = { x: o.x + dx, y: o.y + dy };
    try {
      const sc = ctx && ctx.stageCrew;
      if (sc && typeof sc.beginBeat === "function") {
        const txn = sc.beginBeat(`drag:frame:${elementId}`, {
          handlerName: "handleDragMove",
          plugin: "canvas-drag-plugin",
          sequenceId: ctx?.sequence?.id,
          nodeId: elementId,
        });
        txn.update(`#${elementId}`, {
          classes: { remove: ["rx-comp-draggable"], add: ["rx-comp-grabbing"] },
          style: { transform: `translate3d(${dx}px, ${dy}px, 0)` },
        });
        txn.commit();
      }
    } catch {}
    try {
      onDragUpdate?.({ elementId, position });
    } catch {}
    return { elementId, position };
  },
  handleDragEnd: ({ elementId, position, instanceClass, onDragEnd }, ctx) => {
    if (!elementId) return {};
    try {
      const sc = ctx && ctx.stageCrew;
      if (sc && typeof sc.beginBeat === "function") {
        const cls = String(instanceClass || elementId || "");
        // First, emit a drag:end cleanup beat to clear inline styles/classes
        const endTxn = sc.beginBeat(`drag:end:${elementId}`, {
          handlerName: "handleDragEnd",
          plugin: "canvas-drag-plugin",
          sequenceId: ctx?.sequence?.id,
          nodeId: elementId,
        });
        endTxn.update(`#${elementId}`, {
          classes: { add: ["rx-comp-draggable"], remove: ["rx-comp-grabbing"] },
          style: { transform: "", willChange: "", touchAction: "" },
        });
        endTxn.commit();

        // Then, persist the per-instance absolute position CSS using UI helper (host BeatTxn has no upsertStyleTag)
        const hasValidPos =
          position &&
          typeof position.x === "number" &&
          typeof position.y === "number";
        if (hasValidPos) {
          const x = Math.round(position.x);
          const y = Math.round(position.y);
          try {
            updateInstancePositionCSSViaStageCrew(ctx, elementId, cls, x, y);
          } catch (e) {
            try {
              ctx?.logger?.error?.(
                "[dragEnd] failed to update instance CSS",
                e
              );
            } catch {}
            throw e;
          }
        } else {
          try {
            ctx?.logger?.info?.("[dragEnd] skip persist — missing position");
          } catch {}
        }
      }
    } catch {}
    try {
      onDragEnd?.({ elementId, position });
    } catch {}
    return {};
  },

  // Hover affordance handlers (StageCrew-only)
  handleHoverEnter: ({ elementId }, ctx) => {
    try {
      const sc = ctx && ctx.stageCrew;
      if (sc && typeof sc.beginBeat === "function") {
        const txn = sc.beginBeat(`hover:enter:${elementId}`, {
          handlerName: "handleHoverEnter",
          plugin: "canvas-drag-plugin",
          sequenceId: ctx?.sequence?.id,
          nodeId: elementId,
        });
        txn.update(`#${elementId}`, {
          classes: { add: ["rx-comp-draggable"], remove: ["rx-comp-grabbing"] },
        });
        txn.commit();
      }
    } catch {}
    return {};
  },
  handleHoverLeave: ({ elementId }, ctx) => {
    try {
      const sc = ctx && ctx.stageCrew;
      if (sc && typeof sc.beginBeat === "function") {
        const txn = sc.beginBeat(`hover:leave:${elementId}`, {
          handlerName: "handleHoverLeave",
          plugin: "canvas-drag-plugin",
          sequenceId: ctx?.sequence?.id,
          nodeId: elementId,
        });
        txn.update(`#${elementId}`, {
          classes: { remove: ["rx-comp-draggable", "rx-comp-grabbing"] },
        });
        txn.commit();
      }
    } catch {}
    return {};
  },
};
