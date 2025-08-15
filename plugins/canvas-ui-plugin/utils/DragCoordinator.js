// DragCoordinator: centralizes rAF-coalesced drag scheduling and transform application
// Minimal API to keep attachDragHandlers thin; no direct Conductor dependency here

function createDragCoordinator(win) {
  const w =
    (typeof win !== "undefined" && win) ||
    (typeof window !== "undefined" && window) ||
    {};
  const recs = new Map(); // id -> { origin, start, active, lastCursor, rafScheduled, el }

  const getRec = (id) => recs.get(id) || null;
  const setRec = (id, rec) => {
    recs.set(id, rec);
    return rec;
  };

  return {
    start({ id, start, origin, el }) {
      if (!id) return;
      const rec = {
        origin,
        start,
        active: true,
        lastCursor: origin,
        rafScheduled: false,
        el: el || null,
      };
      setRec(id, rec);
      // Apply drag affordances
      try {
        if (el && el.style) {
          el.style.touchAction = "none";
          el.style.willChange = "transform";
        }
      } catch {}
    },

    move({ id, cursor, onFrame }) {
      const rec = getRec(id);
      if (!rec || !rec.active) return;
      rec.lastCursor = cursor;
      setRec(id, rec);
      if (rec.rafScheduled) return;
      rec.rafScheduled = true;
      setRec(id, rec);
      const el = rec.el;
      (w.requestAnimationFrame || ((cb) => setTimeout(cb, 16)))(() => {
        try {
          const cur = getRec(id);
          if (!cur || !cur.active) return;
          const dx = (cur.lastCursor.x || 0) - (cur.origin.x || 0);
          const dy = (cur.lastCursor.y || 0) - (cur.origin.y || 0);
          if (el && el.style) {
            try {
              el.style.transform = `translate3d(${Math.round(
                dx
              )}px, ${Math.round(dy)}px, 0)`;
            } catch {}
          }
          if (typeof onFrame === "function") {
            try {
              onFrame({ dx, dy });
            } catch {}
          }
        } finally {
          const r = getRec(id);
          if (r) {
            r.rafScheduled = false;
            setRec(id, r);
          }
        }
      });
    },

    end({ id, upClient, onCommit }) {
      const rec = getRec(id);
      if (!rec) return;
      rec.active = false;
      setRec(id, rec);
      const last = upClient || rec.lastCursor || rec.origin || { x: 0, y: 0 };
      const dx = (last.x || 0) - (rec.origin?.x || 0);
      const dy = (last.y || 0) - (rec.origin?.y || 0);
      const finalPos = {
        x: (rec.start?.x || 0) + dx,
        y: (rec.start?.y || 0) + dy,
      };
      // Clear affordances
      try {
        const el = rec.el;
        if (el && el.style) {
          el.style.transform = "";
          el.style.willChange = "";
          el.style.touchAction = "";
        }
      } catch {}
      if (typeof onCommit === "function") {
        try {
          onCommit(finalPos);
        } catch {}
      }
      recs.delete(id);
      return finalPos;
    },
  };
}

// Default shared coordinator (attach to global for tests that eval ESM to CJS)
export const DragCoordinator = createDragCoordinator();
// Back-compat for plugin loader eval: expose factory and singleton as globals
try {
  if (typeof window !== "undefined") {
    window.createDragCoordinator = createDragCoordinator;
    window.DragCoordinator = DragCoordinator;
  }
} catch {}

try {
  if (typeof window !== "undefined") {
    window.createDragCoordinator = createDragCoordinator;
    window.DragCoordinator = DragCoordinator;
  }
} catch {}
