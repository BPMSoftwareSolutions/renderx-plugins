// Pointer-driven drag lifecycle for Canvas UI elements
// attachDragHandlers returns an object of event handlers to spread into element props
import { ensureCursorStylesInjected } from "../styles/cursors.js";

import { DragCoordinator } from "../utils/DragCoordinator.js";
import { buildInstancePositionCssText } from "../styles/instanceCss.js";

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
          // Stash currentTarget for StageCrew stubs fallback
          setRec({ ...(rec || {}), el: e.currentTarget || null });
          // Route hover affordance via StageCrew
          play("Canvas.component-drag-symphony", {
            elementId: node.id,
            event: "canvas:element:hover:enter",
          });
        }
      } catch {}
    },

    onPointerLeave: (e) => {
      try {
        const rec = getRec();
        if (!rec || !rec.active) {
          // Route hover leave affordance via StageCrew
          play("Canvas.component-drag-symphony", {
            elementId: node.id,
            event: "canvas:element:hover:leave",
          });
        }
      } catch {}
    },

    onPointerDown: (e) => {
      try {
        e?.stopPropagation?.();
        // Begin drag: minimal local affordance; StageCrew work occurs in handlers
        try {
          e.target?.setPointerCapture?.(e.pointerId);
        } catch {}
        const origin = { x: e.clientX || 0, y: e.clientY || 0 };
        // Set rec BEFORE committing so StageCrew DOM-applier can fallback to currentTarget when selector not found
        DragCoordinator.start({
          id: node.id,
          start: getStartPos(),
          origin,
          el: e.currentTarget || null,
        });
        setRec({
          origin,
          start: getStartPos(),
          active: true,
          lastCursor: origin,
          rafScheduled: false,
          el: e.currentTarget || null,
        });
        // Minimal local affordance; StageCrew-driven side effects now happen in handlers
        // UI drag listeners no longer mutate DOM directly; StageCrew handlers apply classes/styles
        // Notify UI overlay to hide handles during drag
        try {
          const w = (typeof window !== "undefined" && window) || {};
          const ui = w.__rx_canvas_ui__ || null;
          if (ui && typeof ui.onDragStart === "function")
            ui.onDragStart({ elementId: node.id });
        } catch {}
        play("Canvas.component-drag-symphony", {
          elementId: node.id,
          origin,
          event: "canvas:element:drag:start",
        });
      } catch {}
    },

    onPointerMove: (e) => {
      try {
        const cur = { x: e.clientX || 0, y: e.clientY || 0 };
        const rec = getRec();
        if (!rec || !rec.active) return;
        // Schedule rAF-driven transform via StageCrew inside onFrame to align with tests
        DragCoordinator.move({
          id: node.id,
          cursor: cur,
          onFrame: ({ dx, dy }) => {
            // StageCrew side effects moved to handler; here we only emit play once per frame
            try {
              const w = (typeof window !== "undefined" && window) || {};
              const ui = w.__rx_canvas_ui__ || null;
              if (ui && typeof ui.onDragUpdate === "function")
                ui.onDragUpdate({ elementId: node.id, delta: { dx, dy } });
            } catch {}
            try {
              const system =
                (window && window.renderxCommunicationSystem) || null;
              const conductor = system && system.conductor;
              if (conductor && typeof conductor.play === "function") {
                conductor.play(
                  "Canvas.component-drag-symphony",
                  "Canvas.component-drag-symphony",
                  {
                    elementId: node.id,
                    delta: { dx, dy },
                    event: "canvas:element:moved",
                  }
                );
              }
            } catch {}
          },
        });
      } catch {}
    },

    onPointerUp: (e) => {
      try {
        // Minimal local affordance; StageCrew-driven cleanup happens in handlers
        // UI drag listeners no longer clear classes/styles directly; StageCrew handleDragEnd applies cleanup
        try {
          e.target?.releasePointerCapture?.(e.pointerId);
        } catch {}

        const upClient = { x: e.clientX || 0, y: e.clientY || 0 };
        DragCoordinator.end({
          id: node.id,
          upClient,
          onCommit: (pos) => {
            try {
              const cls = String(node.cssClass || node.id || "");
              const cssText = buildInstancePositionCssText(
                node.id,
                cls,
                pos.x,
                pos.y
              );
              // Emit end with position and cssText for handler to persist via StageCrew
              play("Canvas.component-drag-symphony", {
                elementId: node.id,
                position: pos,
                instanceClass: cls,
                cssText,
                event: "canvas:element:drag:end",
              });
            } catch {}
            try {
              const w = (typeof window !== "undefined" && window) || {};
              const ui = w.__rx_canvas_ui__ || null;
              if (ui && typeof ui.commitNodePosition === "function")
                ui.commitNodePosition({ elementId: node.id, position: pos });
              if (ui && typeof ui.onDragEnd === "function")
                ui.onDragEnd({ elementId: node.id, position: pos });
            } catch {}
          },
        });

        play("Canvas.component-drag-symphony", {
          elementId: node.id,
          end: true,
        });
      } catch {}
    },
  };
}
