// Pointer-driven drag lifecycle for Canvas UI elements
// attachDragHandlers returns an object of event handlers to spread into element props
import { ensureCursorStylesInjected } from "../styles/cursors.js";
import { updateInstancePositionCSS } from "../styles/instanceCss.js";
import { DragCoordinator } from "../utils/DragCoordinator.js";

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
    onPointerDown: (e) => {
      try {
        e?.stopPropagation?.();
        try {
          e.currentTarget?.classList?.add("rx-comp-grabbing");
          if (e.currentTarget && e.currentTarget.style) {
            try {
              e.currentTarget.style.touchAction = "none";
              e.currentTarget.style.willChange = "transform";
            } catch {}
          }
        } catch {}
        try {
          e.target?.setPointerCapture?.(e.pointerId);
        } catch {}
        const origin = { x: e.clientX || 0, y: e.clientY || 0 };
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
        play("Canvas.component-drag-symphony", { elementId: node.id, origin });
      } catch {}
    },

    onPointerMove: (e) => {
      try {
        try {
          e.currentTarget?.classList?.add("rx-comp-grabbing");
        } catch {}
        const cur = { x: e.clientX || 0, y: e.clientY || 0 };
        const rec = getRec();
        if (!rec || !rec.active) return;
        DragCoordinator.move({
          id: node.id,
          cursor: cur,
          onFrame: ({ dx, dy }) => {
            // Notify overlay via callback and play move once per frame
            try {
              const w = (typeof window !== "undefined" && window) || {};
              const ui = w.__rx_canvas_ui__ || null;
              if (ui && typeof ui.onDragUpdate === "function") {
                ui.onDragUpdate({ elementId: node.id, delta: { dx, dy } });
              }
            } catch {}
            try {
              const system =
                (window && window.renderxCommunicationSystem) || null;
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
        try {
          e.currentTarget?.classList?.remove("rx-comp-grabbing");
          if (e.currentTarget && e.currentTarget.style) {
            try {
              e.currentTarget.style.willChange = "";
              e.currentTarget.style.touchAction = "";
              e.currentTarget.style.transform = "";
            } catch {}
          }
        } catch {}
        try {
          e.target?.releasePointerCapture?.(e.pointerId);
        } catch {}

        const upClient = { x: e.clientX || 0, y: e.clientY || 0 };
        const finalPos = DragCoordinator.end({
          id: node.id,
          upClient,
          onCommit: (pos) => {
            try {
              updateInstancePositionCSS(
                node.id,
                String(node.cssClass || node.id || ""),
                pos.x,
                pos.y
              );
            } catch {}
            try {
              const w = (typeof window !== "undefined" && window) || {};
              const ui = w.__rx_canvas_ui__ || null;
              if (ui && typeof ui.commitNodePosition === "function") {
                ui.commitNodePosition({ elementId: node.id, position: pos });
              }
              if (ui && typeof ui.onDragEnd === "function") {
                ui.onDragEnd({ elementId: node.id });
              }
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
