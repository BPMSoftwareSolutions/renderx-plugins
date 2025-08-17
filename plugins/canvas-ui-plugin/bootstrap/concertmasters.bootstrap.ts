// Bootstrap: registers Canvas concertmasters with the Conductor using the Prompt Book
// Note: Uses conductor.on/off if present; otherwise, falls back to subscribe/unsubscribe

import { canvasPromptBook } from "../state/canvas.prompt-book";
import { dragArrangement } from "../features/drag/drag.arrangement";
import { registerDragConcertmaster } from "../features/drag/drag.concertmaster";
import { registerSelectionConcertmaster } from "../features/selection/selection.concertmaster";
import { registerOverlayConcertmaster } from "../features/overlay/overlay.concertmaster";

export type ConductorLike = {
  play: (
    pluginId: string,
    sequenceId: string,
    context?: any,
    priority?: any
  ) => any;
  on?: (
    channel: string,
    action: string,
    handler: (payload: any) => void
  ) => any;
  off?: (
    channel: string,
    action: string,
    handler: (payload: any) => void
  ) => any;
  subscribe?: (
    eventName: string,
    cb: (payload: any) => void,
    context?: any
  ) => any;
  unsubscribe?: (eventName: string, cb: (payload: any) => void) => void;
};

function makeConductorAdapter(conductor: ConductorLike) {
  const hasOn = typeof (conductor as any).on === "function";
  const hasSub = typeof (conductor as any).subscribe === "function";
  if (hasOn) return conductor as any;
  if (!hasSub) {
    throw new Error("Conductor must expose on/off or subscribe/unsubscribe");
  }
  // Adapt subscribe/unsubscribe to support action-phase filtering using payload
  return {
    play: (conductor as any).play.bind(conductor),
    on(channel: string, action: string, handler: (payload: any) => void) {
      const eventName = `${channel}:${action}`;
      // Subscribe to explicit name if emitter uses namespaced events
      const unsub1 = (conductor.subscribe as any)(eventName, handler);
      // Also subscribe to base channel and filter by payload shape when phases are not in event name
      const phaseGuard = (p: any) => {
        if (action === "start" && p?.origin != null) return handler(p);
        if (action === "update" && p?.delta != null) return handler(p);
        if (action === "end" && (p?.end === true || p?.onDragEnd))
          return handler(p);
      };
      const unsub2 = (conductor.subscribe as any)(channel, phaseGuard);
      return () => {
        try {
          unsub1 && unsub1();
        } catch {}
        try {
          unsub2 && unsub2();
        } catch {}
      };
    },
    off(channel: string, action: string, handler: (payload: any) => void) {
      const eventName = `${channel}:${action}`;
      try {
        (conductor.unsubscribe as any)(eventName, handler);
      } catch {}
      // No-op for the base channel guard; it will be removed by the returned function from on()
    },
  } as ConductorLike & { on: any; off: any };
}

export function registerCanvasConcertmasters(
  conductor: ConductorLike,
  deps?: { store?: any }
) {
  const cx = makeConductorAdapter(conductor);
  const store = deps?.store || canvasPromptBook;

  // Drag
  registerDragConcertmaster(cx as any, { store, dragArrangement });

  // Selection
  registerSelectionConcertmaster(cx as any, { store });

  // Overlay (uses cssAdapter via DOM)
  const cssAdapter = {
    upsertStyle(id: string, css: string) {
      try {
        const d = (typeof document !== "undefined" && document) || null;
        if (!d) return;
        let el = d.getElementById(id) as HTMLStyleElement | null;
        if (!el) {
          el = d.createElement("style");
          el.id = id;
          d.head.appendChild(el);
        }
        if (el) el.textContent = css;
      } catch {}
    },
    removeStyle(id: string) {
      try {
        const d = (typeof document !== "undefined" && document) || null;
        if (!d) return;
        const el = d.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      } catch {}
    },
  };
  registerOverlayConcertmaster(cx as any, { store, cssAdapter });

  // Future: resize
  // registerResizeConcertmaster(cx as any, { store, resizeArrangement });
}
