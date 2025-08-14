// Pointer-driven drag lifecycle for Canvas UI elements
// attachDragHandlers returns an object of event handlers to spread into element props
import { ensureCursorStylesInjected } from "../styles/cursors.js";
import { updateInstancePositionCSS } from "../styles/instanceCss.js";

export function attachDragHandlers(node, deps = {}) {
  ensureCursorStylesInjected();

  const getStartPos = () => ({
    x: node?.position?.x || 0,
    y: node?.position?.y || 0,
  });

  const play = (id, payload) => {
    try {
      const system = (window && window.renderxCommunicationSystem) || null;
      const conductor = system && system.conductor;
      if (conductor && typeof conductor.play === "function") {
        conductor.play(id, id, payload);
      }
    } catch {}
  };

  const maybeOnMoveUpdate =
    deps && typeof deps.onDragUpdate === "function" ? deps.onDragUpdate : null;

  return {
    onPointerDown: (e) => {
      try {
        e?.stopPropagation?.();
        try {
          e.currentTarget?.classList?.add("rx-comp-grabbing");
        } catch {}
        try {
          e.target?.setPointerCapture?.(e.pointerId);
        } catch {}
        const origin = { x: e.clientX || 0, y: e.clientY || 0 };
        try {
          const w = (typeof window !== "undefined" && window) || {};
          w.__rx_drag = w.__rx_drag || {};
          w.__rx_drag[node.id] = { origin, start: getStartPos(), active: true };
        } catch {}
        play("Canvas.component-drag-symphony", { elementId: node.id, origin });
      } catch {}
    },

    onPointerMove: (e) => {
      try {
        try {
          e.currentTarget?.classList?.add("rx-comp-grabbing");
        } catch {}
        const cur = { x: e.clientX || 0, y: e.clientY || 0 };
        let origin = { x: 0, y: 0 };
        let startPos = { x: 0, y: 0 };
        let active = false;
        try {
          const w = (typeof window !== "undefined" && window) || {};
          const rec = (w.__rx_drag && w.__rx_drag[node.id]) || null;
          if (rec) {
            origin = rec.origin || origin;
            startPos = rec.start || startPos;
            active = !!rec.active;
          }
        } catch {}
        if (!active) return;
        const delta = {
          dx: (cur.x || 0) - (origin.x || 0),
          dy: (cur.y || 0) - (origin.y || 0),
        };
        const newPos = {
          x: (startPos.x || 0) + delta.dx,
          y: (startPos.y || 0) + delta.dy,
        };

        const onDragUpdate = ({ elementId: id }) => {
          try {
            updateInstancePositionCSS(
              id,
              String(node.cssClass || node.id || ""),
              newPos.x,
              newPos.y
            );
          } catch {}
          // Also notify UI overlay callback (no DOM events)
          try {
            const w = (typeof window !== "undefined" && window) || {};
            const ui = w.__rx_canvas_ui__ || null;
            if (ui && typeof ui.onDragUpdate === "function") {
              ui.onDragUpdate({ elementId: id, delta });
            }
          } catch {}
        };
        try {
          const system = (window && window.renderxCommunicationSystem) || null;
          const conductor = system && system.conductor;
          if (conductor && typeof conductor.play === "function") {
            conductor.play(
              "Canvas.component-drag-symphony",
              "Canvas.component-drag-symphony",
              { elementId: node.id, delta, onDragUpdate }
            );
          } else {
            updateInstancePositionCSS(
              node.id,
              String(node.cssClass || node.id || ""),
              newPos.x,
              newPos.y
            );
          }
        } catch {}
      } catch {}
    },

    onPointerUp: (e) => {
      try {
        try {
          e.currentTarget?.classList?.remove("rx-comp-grabbing");
        } catch {}
        try {
          e.target?.releasePointerCapture?.(e.pointerId);
        } catch {}
        try {
          const w = (typeof window !== "undefined" && window) || {};
          if (w.__rx_drag && w.__rx_drag[node.id])
            w.__rx_drag[node.id].active = false;
        } catch {}
        play("Canvas.component-drag-symphony", {
          elementId: node.id,
          end: true,
        });
      } catch {}
    },
  };
}
