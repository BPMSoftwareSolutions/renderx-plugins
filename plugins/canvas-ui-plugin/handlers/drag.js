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
        const rec = {
          origin,
          start: getStartPos(),
          active: true,
          lastCursor: origin,
          rafScheduled: false,
          el: e.currentTarget || null,
        };
        setRec(rec);
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
        rec.lastCursor = cur;
        setRec(rec);

        if (!rec.rafScheduled) {
          rec.rafScheduled = true;
          setRec(rec);
          const el = rec.el || e.currentTarget || null;
          const cls = String(node.cssClass || node.id || "");
          const elementId = node.id;
          window.requestAnimationFrame(() => {
            try {
              const current = getRec();
              if (!current || !current.active) return;
              const dx = (current.lastCursor.x || 0) - (current.origin.x || 0);
              const dy = (current.lastCursor.y || 0) - (current.origin.y || 0);
              if (el && el.style) {
                try {
                  el.style.transform = `translate3d(${Math.round(
                    dx
                  )}px, ${Math.round(dy)}px, 0)`;
                } catch {}
              }
              // Notify overlay via callback and play move once per frame
              try {
                const w = (typeof window !== "undefined" && window) || {};
                const ui = w.__rx_canvas_ui__ || null;
                if (ui && typeof ui.onDragUpdate === "function") {
                  ui.onDragUpdate({ elementId, delta: { dx, dy } });
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
                    { elementId, delta: { dx, dy } }
                  );
                }
              } catch {}
            } finally {
              const r = getRec();
              if (r) {
                r.rafScheduled = false;
                setRec(r);
              }
            }
          });
        }
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

        let origin = { x: 0, y: 0 };
        let startPos = { x: 0, y: 0 };
        let last = { x: e.clientX || 0, y: e.clientY || 0 };
        try {
          const rec = getRec();
          if (rec) {
            rec.active = false;
            setRec(rec);
            origin = rec.origin || origin;
            startPos = rec.start || startPos;
            if (rec.lastCursor) last = rec.lastCursor;
          }
        } catch {}
        const dx = (last.x || 0) - (origin.x || 0);
        const dy = (last.y || 0) - (origin.y || 0);
        const newPos = {
          x: (startPos.x || 0) + dx,
          y: (startPos.y || 0) + dy,
        };

        // Commit absolute position once
        try {
          updateInstancePositionCSS(
            node.id,
            String(node.cssClass || node.id || ""),
            newPos.x,
            newPos.y
          );
        } catch {}
        try {
          const w = (typeof window !== "undefined" && window) || {};
          const ui = w.__rx_canvas_ui__ || null;
          if (ui && typeof ui.commitNodePosition === "function") {
            ui.commitNodePosition({ elementId: node.id, position: newPos });
          }
          if (ui && typeof ui.onDragEnd === "function") {
            ui.onDragEnd({ elementId: node.id });
          }
        } catch {}

        play("Canvas.component-drag-symphony", {
          elementId: node.id,
          end: true,
        });
      } catch {}
    },
  };
}
