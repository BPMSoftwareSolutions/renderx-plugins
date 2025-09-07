import { recomputeLineSvg } from "../augment/line.recompute.stage-crew";

function updateEndpoint(
  host: HTMLElement,
  handle: "a" | "b",
  dx: number,
  dy: number
) {
  const isA = handle === "a";
  const xVar = isA ? "--x1" : "--x2";
  const yVar = isA ? "--y1" : "--y2";
  const baseX = parseFloat(host.style.getPropertyValue(xVar) || "0");
  const baseY = parseFloat(host.style.getPropertyValue(yVar) || "0");
  const nx = Math.round(baseX + (dx || 0));
  const ny = Math.round(baseY + (dy || 0));
  host.style.setProperty(xVar, `${nx}`);
  host.style.setProperty(yVar, `${ny}`);
}

function updateCurve(host: HTMLElement, dx: number, dy: number) {
  const x1 = parseFloat(host.style.getPropertyValue("--x1") || "0");
  const y1 = parseFloat(host.style.getPropertyValue("--y1") || "0");
  const x2 = parseFloat(host.style.getPropertyValue("--x2") || "0");
  const y2 = parseFloat(host.style.getPropertyValue("--y2") || String(y1));
  const baseCX = parseFloat(
    host.style.getPropertyValue("--cx") || String((x1 + x2) / 2)
  );
  const baseCY = parseFloat(
    host.style.getPropertyValue("--cy") || String((y1 + y2) / 2)
  );
  const ncx = Math.round(baseCX + (dx || 0));
  const ncy = Math.round(baseCY + (dy || 0));
  host.style.setProperty("--cx", `${ncx}`);
  host.style.setProperty("--cy", `${ncy}`);
  host.style.setProperty("--curve", "1");
}

function updateRotate(host: HTMLElement, dx: number) {
  const baseAngle = parseFloat(host.style.getPropertyValue("--angle") || "0");
  const next = Math.round(baseAngle + (dx || 0));
  host.style.setProperty("--angle", `${next}`);
}

export function startLineManip(data: any) {
  // For future use (e.g., snapshot for undo). No-op for now.
  return data;
}

export function moveLineManip(data: any) {
  try {
    const { id, handle, dx = 0, dy = 0 } = data || {};
    if (!id) return;
    const el = document.getElementById(String(id)) as SVGSVGElement | null;
    if (!el) return;
    const host = el as unknown as HTMLElement;
    if (handle === "a" || handle === "b") {
      updateEndpoint(host, handle, dx, dy);
      recomputeLineSvg(el);
    } else if (handle === "curve") {
      updateCurve(host, dx, dy);
      recomputeLineSvg(el);
    } else if (handle === "rotate") {
      updateRotate(host, dx);
      recomputeLineSvg(el);
    }
  } catch {}
}

export function endLineManip(_data: any) {
  // For future use (e.g., commit, snapping). No-op for now.
}
