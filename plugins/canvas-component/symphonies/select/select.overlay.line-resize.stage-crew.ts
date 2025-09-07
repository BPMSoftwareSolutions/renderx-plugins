import { getCanvasOrThrow } from "./select.overlay.dom.stage-crew";
import { resolveInteraction } from "../../../../src/interactionManifest";
import { EventRouter } from "../../../../src/EventRouter";

function ensureLineCss() {
  if (typeof document === "undefined") return;
  const id = "rx-line-overlay-styles";
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  const css = `
  .rx-line-overlay { position:absolute; pointer-events:none; z-index:11; }
  .rx-line-overlay .endpoint { position:absolute; width:10px; height:10px; background:#10b981; border:2px solid #fff; border-radius:50%; pointer-events:auto; box-sizing:border-box; }
  `;
  if (!(el.textContent || "").includes(".rx-line-overlay")) {
    el.appendChild(document.createTextNode(css));
  }
}

export function ensureLineOverlayFor(target: HTMLElement): HTMLDivElement {
  ensureLineCss();
  const canvas = getCanvasOrThrow();
  let ov = document.getElementById("rx-line-overlay") as HTMLDivElement | null;
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "rx-line-overlay";
    ov.className = "rx-line-overlay";
    const a = document.createElement("div");
    a.className = "endpoint a";
    const b = document.createElement("div");
    b.className = "endpoint b";
    ov.appendChild(a);
    ov.appendChild(b);
    canvas.appendChild(ov);
  }
  // Position overlay to match target's bounding box
  const r = target.getBoundingClientRect();
  const c = canvas.getBoundingClientRect();
  ov.style.left = `${Math.round(r.left - c.left)}px`;
  ov.style.top = `${Math.round(r.top - c.top)}px`;
  ov.style.width = `${Math.round(r.width)}px`;
  ov.style.height = `${Math.round(r.height)}px`;
  // Place endpoints at ends based on CSS vars (prefer computed styles over inline)
  try {
    const cs =
      typeof window !== "undefined" && target
        ? getComputedStyle(target)
        : ({} as any);
    const readVar = (name: string, fallback: string) => {
      const inline = target.style.getPropertyValue(name);
      const comp =
        typeof cs.getPropertyValue === "function"
          ? cs.getPropertyValue(name)
          : "";
      const val = inline || comp || fallback;
      const n = parseFloat(String(val));
      return Number.isFinite(n) ? n : parseFloat(fallback);
    };
    const ax = readVar("--x1", "0");
    const ay = readVar("--y1", "0");
    let bx = readVar("--x2", String(r.width));
    let by = readVar("--y2", String(ay)); // default y2 to y1 to keep line horizontal when unset
    const a = ov.querySelector(".endpoint.a") as HTMLDivElement;
    const b = ov.querySelector(".endpoint.b") as HTMLDivElement;
    if (a) {
      a.style.left = `${Math.round(ax - 5)}px`;
      a.style.top = `${Math.round(ay - 5)}px`;
    }
    if (b) {
      b.style.left = `${Math.round(bx - 5)}px`;
      b.style.top = `${Math.round(by - 5)}px`;
    }
  } catch {}
  return ov;
}

export function attachLineResizeHandlers(ov: HTMLDivElement, conductor?: any) {
  if ((ov as any)._rxLineResizeAttached) return;
  (ov as any)._rxLineResizeAttached = true;

  ov.addEventListener("mousedown", (e: MouseEvent) => {
    const t = e.target as HTMLElement | null;
    if (!t || !t.classList.contains("endpoint")) return;
    e.preventDefault();

    const isA = t.classList.contains("a");
    const id = ov.dataset.targetId;
    if (!id) return;
    const target = document.getElementById(id) as HTMLElement | null;
    if (!target) return;

    const start = { x: e.clientX, y: e.clientY };

    const call = (phase: "start" | "move" | "end", dx = 0, dy = 0) => {
      const key =
        phase === "start"
          ? "canvas.component.resize.line.start"
          : phase === "end"
          ? "canvas.component.resize.line.end"
          : "canvas.component.resize.line.move";
      const payload: any = {
        id,
        handle: isA ? "a" : "b",
        dx,
        dy,
        phase,
      };
      const play = conductor?.play || (window as any).RenderX?.conductor?.play;
      if (typeof play === "function") {
        try {
          // Try EventRouter first, fallback to direct routing
          try {
            EventRouter.publish(
              key,
              payload,
              conductor || (window as any).RenderX?.conductor
            );
            return;
          } catch {
            const r = resolveInteraction(key);
            play(r.pluginId, r.sequenceId, payload);
            return;
          }
        } catch {}
      }
      // Fallback: directly update CSS vars on target
      if (phase === "move") {
        const baseX = parseFloat(
          target.style.getPropertyValue(isA ? "--x1" : "--x2") || "0"
        );
        const baseY = parseFloat(
          target.style.getPropertyValue(isA ? "--y1" : "--y2") || "0"
        );
        const nx = Math.round(baseX + dx);
        const ny = Math.round(baseY + dy);
        target.style.setProperty(isA ? "--x1" : "--x2", `${nx}`);
        target.style.setProperty(isA ? "--y1" : "--y2", `${ny}`);
        // Update overlay endpoint positions
        const endpoint = ov.querySelector(
          isA ? ".endpoint.a" : ".endpoint.b"
        ) as HTMLDivElement;
        if (endpoint) {
          endpoint.style.left = `${nx - 5}px`;
          endpoint.style.top = `${ny - 5}px`;
        }
      }
    };

    let raf = 0 as any;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      call("move", dx, dy);
      const rafFn =
        typeof requestAnimationFrame === "function"
          ? requestAnimationFrame
          : (fn: FrameRequestCallback) =>
              setTimeout(() => fn(performance.now() as any), 0) as any;
      if (raf) cancelAnimationFrame(raf as any);
      raf = rafFn(() => call("move", dx, dy)) as any;
    };
    const onUp = () => {
      call("end");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    call("start");
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}
