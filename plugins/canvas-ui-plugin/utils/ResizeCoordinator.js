// ResizeCoordinator: coalesces pointer moves via rAF for resize gestures
// Similar to DragCoordinator but does not apply transforms; it only computes deltas

function createResizeCoordinator(win) {
  const w =
    (typeof win !== "undefined" && win) ||
    (typeof window !== "undefined" && window) ||
    {};
  const recs = new Map(); // id -> { origin, active, lastCursor }

  const getRec = (id) => recs.get(id) || null;
  const setRec = (id, rec) => {
    recs.set(id, rec);
    return rec;
  };

  return {
    start({ id, origin }) {
      if (!id) return;
      const rec = {
        origin,
        active: true,
        lastCursor: origin,
        rafScheduled: false,
      };
      setRec(id, rec);
    },

    move({ id, cursor, onFrame }) {
      const rec = getRec(id);
      if (!rec || !rec.active) return;
      rec.lastCursor = cursor;
      setRec(id, rec);
      if (rec.rafScheduled) return;
      rec.rafScheduled = true;
      setRec(id, rec);
      (w.requestAnimationFrame || ((cb) => setTimeout(cb, 16)))(() => {
        try {
          const cur = getRec(id);
          if (!cur || !cur.active) return;
          const dx = (cur.lastCursor.x || 0) - (cur.origin.x || 0);
          const dy = (cur.lastCursor.y || 0) - (cur.origin.y || 0);
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

    end({ id, upClient }) {
      const rec = getRec(id);
      if (!rec) return;
      rec.active = false;
      setRec(id, rec);
      const last = upClient || rec.lastCursor || rec.origin || { x: 0, y: 0 };
      const dx = (last.x || 0) - (rec.origin?.x || 0);
      const dy = (last.y || 0) - (rec.origin?.y || 0);
      recs.delete(id);
      return { dx, dy };
    },
  };
}

export const ResizeCoordinator = createResizeCoordinator();

