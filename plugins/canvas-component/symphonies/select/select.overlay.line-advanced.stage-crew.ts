import { getCanvasOrThrow } from "./select.overlay.dom.stage-crew";
import { resolveInteraction } from "../../../../src/interactionManifest";
import { EventRouter } from "../../../../src/EventRouter";
import { recomputeLineSvg } from "../augment/line.recompute.stage-crew";

function ensureAdvancedLineCss() {
  if (typeof document === "undefined") return;
  const id = "rx-adv-line-overlay-styles";
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  const css = `
  .rx-adv-line-overlay { position:absolute; pointer-events:none; z-index:12; }
  .rx-adv-line-overlay .handle { position:absolute; width:12px; height:12px; border:2px solid #3b82f6; background:#fff; border-radius:50%; pointer-events:auto; box-sizing:border-box; box-shadow:0 0 0 2px rgba(59,130,246,0.35); }
  `;
  if (!(el.textContent || "").includes(".rx-adv-line-overlay")) {
    el.appendChild(document.createTextNode(css));
  }
}

export function ensureAdvancedLineOverlayFor(
  target: HTMLElement
): HTMLDivElement {
  ensureAdvancedLineCss();
  const canvas = getCanvasOrThrow();
  let ov = document.getElementById(
    "rx-adv-line-overlay"
  ) as HTMLDivElement | null;
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "rx-adv-line-overlay";
    ov.className = "rx-adv-line-overlay";
    const a = document.createElement("div");
    a.className = "handle a";
    const b = document.createElement("div");
    b.className = "handle b";
    ov.appendChild(a);
    ov.appendChild(b);
    canvas.appendChild(ov);
  }
  // Ensure only endpoint handles are present (cleanup legacy curve/rotate)
  Array.from(ov.querySelectorAll(".handle.curve, .handle.rotate")).forEach(
    (n) => n.remove()
  );
  if (!ov.querySelector(".handle.a")) {
    const a = document.createElement("div");
    a.className = "handle a";
    ov.appendChild(a);
  }
  if (!ov.querySelector(".handle.b")) {
    const b = document.createElement("div");
    b.className = "handle b";
    ov.appendChild(b);
  }

  // Position overlay to match target's bounding box
  const r = target.getBoundingClientRect();
  const cbox = canvas.getBoundingClientRect();
  ov.style.left = `${Math.round(r.left - cbox.left)}px`;
  ov.style.top = `${Math.round(r.top - cbox.top)}px`;
  ov.style.width = `${Math.round(r.width)}px`;
  ov.style.height = `${Math.round(r.height)}px`;

  try {
    // Ensure latest geometry, then derive endpoints from actual SVG + viewBox
    try {
      const svg = target as unknown as SVGSVGElement;
      recomputeLineSvg(svg);
    } catch {}

    const svg = target as unknown as SVGSVGElement;
    const vb = (svg.getAttribute("viewBox") || "0 0 100 100")
      .split(/\s+/)
      .map((v) => parseFloat(v));
    const [minX, minY, vbW, vbH] = [
      vb[0] || 0,
      vb[1] || 0,
      vb[2] || 100,
      vb[3] || 100,
    ];

    const line = svg.querySelector("line.segment") as SVGLineElement | null;
    const path = svg.querySelector(
      "path.segment-curve"
    ) as SVGPathElement | null;

    const toPx = (nx: number, ny: number) => ({
      x: ((nx - minX) / vbW) * r.width,
      y: ((ny - minY) / vbH) * r.height,
    });

    let pA = { x: 0, y: 0 };
    let pB = { x: r.width, y: r.height };

    if (line && line.style.display !== "none") {
      const nx1 = parseFloat(line.getAttribute("x1") || "0");
      const ny1 = parseFloat(line.getAttribute("y1") || "0");
      const nx2 = parseFloat(line.getAttribute("x2") || String(100));
      const ny2 = parseFloat(line.getAttribute("y2") || String(0));
      pA = toPx(nx1, ny1);
      pB = toPx(nx2, ny2);
    } else if (path && path.style.display !== "none") {
      // Use path sampling for accurate endpoints (handles curvature + rotation)
      const total =
        typeof path.getTotalLength === "function" ? path.getTotalLength() : 0;
      if (total > 0 && typeof path.getPointAtLength === "function") {
        const s = path.getPointAtLength(0);
        const e = path.getPointAtLength(total);
        pA = toPx(s.x, s.y);
        pB = toPx(e.x, e.y);
      }
    } else {
      // Fallback to CSS variables if available
      const cs =
        typeof window !== "undefined" ? getComputedStyle(target) : ({} as any);
      const readVar = (name: string, fallback: string) => {
        const inline = (target as HTMLElement).style.getPropertyValue(name);
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
      const bx = readVar("--x2", String(r.width));
      const by = readVar("--y2", String(ay));
      pA = { x: ax, y: ay };
      pB = { x: bx, y: by };
    }

    // Apply rotation if present (rotate around midpoint)
    const cs =
      typeof window !== "undefined" ? getComputedStyle(target) : ({} as any);
    const angleStr =
      (target as HTMLElement).style.getPropertyValue("--angle") ||
      (typeof cs.getPropertyValue === "function"
        ? cs.getPropertyValue("--angle")
        : "0");
    const angle = parseFloat(angleStr || "0");
    if (Number.isFinite(angle) && Math.abs(angle) > 0.0001) {
      const rad = (angle * Math.PI) / 180;
      const mx = (pA.x + pB.x) / 2;
      const my = (pA.y + pB.y) / 2;
      const rot = (p: { x: number; y: number }) => {
        const dx = p.x - mx;
        const dy = p.y - my;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return { x: mx + dx * cos - dy * sin, y: my + dx * sin + dy * cos };
      };
      pA = rot(pA);
      pB = rot(pB);
    }

    const a = ov.querySelector(".handle.a") as HTMLDivElement;
    const b = ov.querySelector(".handle.b") as HTMLDivElement;

    if (a) {
      a.style.left = `${Math.round(pA.x - 5)}px`;
      a.style.top = `${Math.round(pA.y - 5)}px`;
    }
    if (b) {
      b.style.left = `${Math.round(pB.x - 5)}px`;
      b.style.top = `${Math.round(pB.y - 5)}px`;
    }
  } catch {}
  return ov;
}

export function attachAdvancedLineManipHandlers(
  ov: HTMLDivElement,
  conductor?: any
) {
  if ((ov as any)._rxAdvLineManipAttached) return;
  (ov as any)._rxAdvLineManipAttached = true;

  ov.addEventListener("mousedown", (e: MouseEvent) => {
    const t = e.target as HTMLElement | null;
    if (!t || !t.classList.contains("handle")) return;
    e.preventDefault();

    const handle: "a" | "b" = t.classList.contains("a") ? "a" : "b";

    const id = ov.dataset.targetId;
    if (!id) return;
    const target = document.getElementById(id) as HTMLElement | null;
    if (!target) return;

    const start = { x: e.clientX, y: e.clientY };

    let last = { x: start.x, y: start.y };
    const call = async (phase: "start" | "move" | "end", dx = 0, dy = 0) => {
      const key =
        phase === "start"
          ? "canvas.component.manip.line.start"
          : phase === "end"
          ? "canvas.component.manip.line.end"
          : "canvas.component.manip.line.move";
      const payload: any = { id, handle, dx, dy, phase };
      const play = conductor?.play || (window as any).RenderX?.conductor?.play;
      if (typeof play === "function") {
        // Prefer EventRouter when topic exists; fall back to direct resolveInteraction
        try {
          await EventRouter.publish(
            key,
            payload,
            conductor || (window as any).RenderX?.conductor
          );
          return;
        } catch {
          try {
            const r = resolveInteraction(key);
            await play(r.pluginId, r.sequenceId, payload);
            return;
          } catch {}
        }
      }
      // Fallback: directly update CSS vars on target + recompute (endpoints only)
      if (phase === "move") {
        const isA = handle === "a";
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
        const svg = target as unknown as SVGSVGElement;
        try {
          recomputeLineSvg(svg);
        } catch {}
        // Reposition both handles based on actual SVG geometry to avoid drift
        try {
          const vb = (svg.getAttribute("viewBox") || "0 0 100 100")
            .split(/\s+/)
            .map((v) => parseFloat(v));
          const [minX, minY, vbW, vbH] = [
            vb[0] || 0,
            vb[1] || 0,
            vb[2] || 100,
            vb[3] || 100,
          ];
          const r = (target as HTMLElement).getBoundingClientRect();
          const toPx = (nx: number, ny: number) => ({
            x: ((nx - minX) / vbW) * r.width,
            y: ((ny - minY) / vbH) * r.height,
          });
          const line = svg.querySelector(
            "line.segment"
          ) as SVGLineElement | null;
          const path = svg.querySelector(
            "path.segment-curve"
          ) as SVGPathElement | null;
          let pA = { x: 0, y: 0 };
          let pB = { x: r.width, y: r.height };
          if (line && line.style.display !== "none") {
            const nx1 = parseFloat(line.getAttribute("x1") || "0");
            const ny1 = parseFloat(line.getAttribute("y1") || "0");
            const nx2 = parseFloat(line.getAttribute("x2") || "100");
            const ny2 = parseFloat(line.getAttribute("y2") || "0");
            pA = toPx(nx1, ny1);
            pB = toPx(nx2, ny2);
          } else if (path && path.style.display !== "none") {
            const total =
              typeof path.getTotalLength === "function"
                ? path.getTotalLength()
                : 0;
            if (total > 0 && typeof path.getPointAtLength === "function") {
              const s = path.getPointAtLength(0);
              const e = path.getPointAtLength(total);
              pA = toPx(s.x, s.y);
              pB = toPx(e.x, e.y);
            }
          }
          const aEl = ov.querySelector(".handle.a") as HTMLDivElement | null;
          const bEl = ov.querySelector(".handle.b") as HTMLDivElement | null;
          if (aEl) {
            aEl.style.left = `${Math.round(pA.x - 5)}px`;
            aEl.style.top = `${Math.round(pA.y - 5)}px`;
          }
          if (bEl) {
            bEl.style.left = `${Math.round(pB.x - 5)}px`;
            bEl.style.top = `${Math.round(pB.y - 5)}px`;
          }
        } catch {
          const endpoint = ov.querySelector(
            isA ? ".handle.a" : ".handle.b"
          ) as HTMLDivElement;
          if (endpoint) {
            endpoint.style.left = `${nx - 5}px`;
            endpoint.style.top = `${ny - 5}px`;
          }
        }
      }
    };

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - last.x;
      const dy = ev.clientY - last.y;
      last = { x: ev.clientX, y: ev.clientY };
      void call("move", dx, dy);
    };
    const onUp = () => {
      void call("end");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    void call("start");
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}
