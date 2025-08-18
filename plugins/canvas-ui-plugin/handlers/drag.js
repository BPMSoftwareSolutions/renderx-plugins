// Pointer-driven drag lifecycle for Canvas UI elements
// attachDragHandlers returns an object of event handlers to spread into element props
import { ensureCursorStylesInjected } from "../styles/cursors.js";

import { DragCoordinator } from "../utils/DragCoordinator.js";
import { buildInstancePositionCssText, updateInstancePositionCSS } from "../styles/instanceCss.js";

export function attachDragHandlers(node, deps = {}) {
  ensureCursorStylesInjected();

  const getStartPos = () => {
    // Prefer committed position from UI state (set by CanvasPage.commitNodePosition)
    try {
      const w = (typeof window !== "undefined" && window) || {};
      const p = w.__rx_canvas_ui__?.positions?.[node.id];
      if (p && typeof p.x === "number" && typeof p.y === "number") {
        return { x: p.x, y: p.y };
      }
    } catch {}
    return {
      x: node?.position?.x || 0,
      y: node?.position?.y || 0,
    };
  };

  const play = (id, payload) => {
    try {
      const system = (window && window.renderxCommunicationSystem) || null;
      const conductor = system && system.conductor;
      if (conductor && typeof conductor.play === "function") {
        conductor.play(id, id, payload);
      }
    } catch {}
  };

  const getRec = () => {
    try {
      const w = (typeof window !== "undefined" && window) || {};
      w.__rx_drag = w.__rx_drag || {};
      return w.__rx_drag[node.id] || null;
    } catch {
      return null;
    }
  };
  const setRec = (rec) => {
    try {
      const w = (typeof window !== "undefined" && window) || {};
      w.__rx_drag = w.__rx_drag || {};
      w.__rx_drag[node.id] = rec;
    } catch {}
  };

  return {
    onPointerEnter: (e) => {
      try {
        const rec = getRec();
        if (!rec || !rec.active) {
          // Ensure only hover affordance is present
          e.currentTarget?.classList?.remove("rx-comp-grabbing");
          e.currentTarget?.classList?.add("rx-comp-draggable");
        }
      } catch {}
    },

    onPointerLeave: (e) => {
      try {
        const rec = getRec();
        if (!rec || !rec.active) {
          e.currentTarget?.classList?.remove("rx-comp-draggable");
          e.currentTarget?.classList?.remove("rx-comp-grabbing");
        }
      } catch {}
    },

    onPointerDown: (e) => {
      try {
        e?.stopPropagation?.();
        // Prefer StageCrew for UI state classes/styles when available
        const system = (typeof window !== "undefined" && window.renderxCommunicationSystem) || null;
        const stageCrew = (system?.stageCrew) || (system?.conductor?.getStageCrew?.());
        try { e.target?.setPointerCapture?.(e.pointerId); } catch {}
        const origin = { x: e.clientX || 0, y: e.clientY || 0 };
        // Set rec BEFORE committing so StageCrew DOM-applier can fallback to currentTarget when selector not found
        DragCoordinator.start({ id: node.id, start: getStartPos(), origin, el: e.currentTarget || null });
        setRec({ origin, start: getStartPos(), active: true, lastCursor: origin, rafScheduled: false, el: e.currentTarget || null });
        if (stageCrew?.beginBeat) {
          try {
            const txn = stageCrew.beginBeat(`drag:start:${node.id}`, {
              handlerName: "dragStart",
              plugin: "canvas-ui-plugin",
              nodeId: node.id,
            });
            if (typeof txn.update === "function")
              txn.update(`#${node.id}`, {
                classes: { remove: ["rx-comp-draggable"], add: ["rx-comp-grabbing"] },
                style: { touchAction: "none", willChange: "transform" },
              });
            if (typeof txn.commit === "function") txn.commit();
          } catch {}
        } else {
          // No StageCrew available: minimally toggle classes on the current target
          try {
            e.currentTarget?.classList?.remove("rx-comp-draggable");
            e.currentTarget?.classList?.add("rx-comp-grabbing");
            if (e.currentTarget && e.currentTarget.style) {
              e.currentTarget.style.touchAction = "none";
              e.currentTarget.style.willChange = "transform";
            }
          } catch {}
        }
        // Notify UI overlay to hide handles during drag
        try {
          const w = (typeof window !== "undefined" && window) || {};
          const ui = w.__rx_canvas_ui__ || null;
          if (ui && typeof ui.onDragStart === "function") ui.onDragStart({ elementId: node.id });
        } catch {}
        play("Canvas.component-drag-symphony", { elementId: node.id, origin });
      } catch {}
    },

    onPointerMove: (e) => {
      try {
        const system = (typeof window !== "undefined" && window.renderxCommunicationSystem) || null;
        const stageCrew = (system?.stageCrew) || (system?.conductor?.getStageCrew?.());
        const cur = { x: e.clientX || 0, y: e.clientY || 0 };
        const rec = getRec();
        if (!rec || !rec.active) return;
        // Schedule rAF-driven transform via StageCrew inside onFrame to align with tests
        DragCoordinator.move({
          id: node.id,
          cursor: cur,
          onFrame: ({ dx, dy }) => {
            // Apply visual transform and grabbing class via StageCrew
            try {
              if (stageCrew?.beginBeat) {
                const txn = stageCrew.beginBeat(`drag:frame:${node.id}`, {
                  handlerName: "dragFrame",
                  plugin: "canvas-ui-plugin",
                  nodeId: node.id,
                });
                txn.update(`#${node.id}`, {
                  classes: { remove: ["rx-comp-draggable"], add: ["rx-comp-grabbing"] },
                  style: { transform: `translate3d(${Math.round(dx)}px, ${Math.round(dy)}px, 0)` },
                });
                txn.commit();
              }
            } catch {}
            // Notify overlay via callback and play move once per frame
            try {
              const w = (typeof window !== "undefined" && window) || {};
              const ui = w.__rx_canvas_ui__ || null;
              if (ui && typeof ui.onDragUpdate === "function") ui.onDragUpdate({ elementId: node.id, delta: { dx, dy } });
            } catch {}
            try {
              const system = (window && window.renderxCommunicationSystem) || null;
              const conductor = system && system.conductor;
              if (conductor && typeof conductor.play === "function") {
                conductor.play(
                  "Canvas.component-drag-symphony",
                  "Canvas.component-drag-symphony",
                  { elementId: node.id, delta: { dx, dy } }
                );
              }
            } catch {}
          },
        });
      } catch {}
    },

    onPointerUp: (e) => {
      try {
        const system = (typeof window !== "undefined" && window.renderxCommunicationSystem) || null;
        const stageCrew = (system?.stageCrew) || (system?.conductor?.getStageCrew?.());
        if (stageCrew?.beginBeat) {
          try {
            const txn = stageCrew.beginBeat(`drag:end:${node.id}`, {
              handlerName: "dragEnd",
              plugin: "canvas-ui-plugin",
              nodeId: node.id,
            });
            if (typeof txn.update === "function")
              txn.update(`#${node.id}`, {
                classes: { remove: ["rx-comp-grabbing"], add: ["rx-comp-draggable"] },
                style: { willChange: "", touchAction: "", transform: "" },
              });
            if (typeof txn.commit === "function") txn.commit();
          } catch {}
        } else {
          // No StageCrew available: restore classes inline on pointerup
          try {
            e.currentTarget?.classList?.remove("rx-comp-grabbing");
            e.currentTarget?.classList?.add("rx-comp-draggable");
            if (e.currentTarget && e.currentTarget.style) {
              e.currentTarget.style.willChange = "";
              e.currentTarget.style.touchAction = "";
              e.currentTarget.style.transform = "";
            }
          } catch {}
        }
        try { e.target?.releasePointerCapture?.(e.pointerId); } catch {}

        const upClient = { x: e.clientX || 0, y: e.clientY || 0 };
        DragCoordinator.end({
          id: node.id,
          upClient,
          onCommit: (pos) => {
            try {
              const cls = String(node.cssClass || node.id || "");
              if (stageCrew?.beginBeat) {
                const txn = stageCrew.beginBeat(`instance:pos:${node.id}`, {
                  handlerName: "commitNodePosition",
                  plugin: "canvas-ui-plugin",
                  nodeId: node.id,
                });
                const cssText = buildInstancePositionCssText(node.id, cls, pos.x, pos.y);
                if (typeof txn.upsertStyleTag === "function")
                  txn.upsertStyleTag("component-instance-css-" + node.id, cssText);
                if (typeof txn.commit === "function") txn.commit();
              } else {
                // No StageCrew: update overlay and instance CSS directly for baseline persistence in tests
                try {
                  const cls = String(node.cssClass || node.id || "");
                  updateInstancePositionCSS(node.id, cls, pos.x, pos.y);
                  const w = (typeof window !== "undefined" && window) || {};
                  const ui = w.__rx_canvas_ui__ || {};
                  if (ui && ui.setSelectedId) {
                    // Trigger overlay re-render path by toggling selection
                    ui.setSelectedId(node.id);
                  }
                } catch {}
              }
            } catch {}
            try {
              const w = (typeof window !== "undefined" && window) || {};
              const ui = w.__rx_canvas_ui__ || null;
              if (ui && typeof ui.commitNodePosition === "function") ui.commitNodePosition({ elementId: node.id, position: pos });
              if (ui && typeof ui.onDragEnd === "function") ui.onDragEnd({ elementId: node.id, position: pos });
            } catch {}
          },
        });

        play("Canvas.component-drag-symphony", { elementId: node.id, end: true });
      } catch {}
    },
  };
}
