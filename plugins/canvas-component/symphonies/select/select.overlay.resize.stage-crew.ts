import { getCanvasRect } from "./select.overlay.dom.stage-crew";
import { resolveInteraction } from "../../../../src/interactionManifest";
import { EventRouter } from "../../../../src/EventRouter";

function readNumericPx(value: string): number | null {
  const n = parseFloat(value || "");
  return Number.isFinite(n) ? n : null;
}

function getResizeConfig(el: HTMLElement) {
  const enabled =
    (el.getAttribute("data-resize-enabled") || "true") !== "false";
  const minW = parseFloat(el.getAttribute("data-resize-min-w") || "1");
  const minH = parseFloat(el.getAttribute("data-resize-min-h") || "1");
  return {
    enabled,
    minW: Number.isFinite(minW) ? Math.max(1, minW) : 1,
    minH: Number.isFinite(minH) ? Math.max(1, minH) : 1,
  };
}

export function attachResizeHandlers(ov: HTMLDivElement, conductor?: any) {
  if ((ov as any)._rxResizeAttached) return;
  (ov as any)._rxResizeAttached = true;

  const onMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target || !target.classList.contains("rx-handle")) return;

    e.preventDefault();

    const dir = Array.from(target.classList).find((c) =>
      ["n", "s", "e", "w", "nw", "ne", "sw", "se"].includes(c)
    ) as string | undefined;
    const id = ov.dataset.targetId;
    if (!dir || !id) return;
    const el = document.getElementById(id) as HTMLElement | null;
    if (!el) return;

    // Respect per-element enable flag
    const cfg = getResizeConfig(el);
    if (!cfg.enabled) return;

    const canvasRect = getCanvasRect();
    const rect = el.getBoundingClientRect();
    const styleLeft = readNumericPx(el.style.left);
    const styleTop = readNumericPx(el.style.top);
    const styleWidth = readNumericPx(el.style.width);
    const styleHeight = readNumericPx(el.style.height);
    const startLeft = styleLeft ?? rect.left - canvasRect.left;
    const startTop = styleTop ?? rect.top - canvasRect.top;
    const startWidth = styleWidth ?? rect.width;
    const startHeight = styleHeight ?? rect.height;
    const startX = e.clientX;
    const startY = e.clientY;

    const call = (
      dx: number,
      dy: number,
      event: "start" | "move" | "end" = "move"
    ) => {
      // Conductor must always be available - no fallback
      if (!conductor?.play) {
        throw new Error(
          "Conductor is required for resize operations but was not provided"
        );
      }

      const base = { id, dir, startLeft, startTop, startWidth, startHeight };
      const payload =
        event === "move"
          ? { ...base, dx, dy, phase: "move" }
          : { ...base, phase: event };
      const key =
        event === "start"
          ? "canvas.component.resize.start"
          : event === "end"
          ? "canvas.component.resize.end"
          : "canvas.component.resize.move";

      try {
        EventRouter.publish(key, payload, conductor);
      } catch {
        // Fallback to direct interaction routing if EventRouter fails
        const r = resolveInteraction(key);
        conductor.play(r.pluginId, r.sequenceId, payload);
      }
    };

    let raf = 0;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      // Immediate update to keep tests and UI responsive
      call(dx, dy, "move");
      // Trailing batch update, if rAF available
      const rafFn =
        typeof requestAnimationFrame === "function"
          ? requestAnimationFrame
          : (fn: FrameRequestCallback) =>
              setTimeout(() => fn(performance.now() as any), 0) as any;
      if (raf) cancelAnimationFrame(raf as any);
      raf = rafFn(() => call(dx, dy, "move")) as any;
    };

    const onUp = () => {
      // cancel any pending trailing rAF move to avoid post-end calls
      try {
        if (raf) cancelAnimationFrame(raf as any);
      } catch {}
      raf = 0 as any;
      call(0, 0, "end");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    call(0, 0, "start");
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  ov.addEventListener("mousedown", onMouseDown);
}
