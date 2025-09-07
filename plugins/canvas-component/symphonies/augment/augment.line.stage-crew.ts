import { isFlagEnabled } from "../../../../src/feature-flags/flags";

// Add basic SVG defs (arrow markers). Keep minimal; more will be added in later phases.
function ensureLineMarkers(svg: SVGSVGElement) {
  const ns = "http://www.w3.org/2000/svg";
  let defs = svg.querySelector("defs#rx-line-markers") as SVGDefsElement | null;
  if (!defs) {
    defs = document.createElementNS(ns, "defs") as SVGDefsElement;
    defs.id = "rx-line-markers";

    // Minimal example marker. In future phases, we will add start/end variants and styling.
    const markerEnd = document.createElementNS(ns, "marker");
    markerEnd.setAttribute("id", "rx-arrow-end");
    markerEnd.setAttribute("markerWidth", "6");
    markerEnd.setAttribute("markerHeight", "6");
    markerEnd.setAttribute("refX", "5");
    markerEnd.setAttribute("refY", "3");
    markerEnd.setAttribute("orient", "auto");

    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", "M0,0 L6,3 L0,6 Z");
    path.setAttribute("fill", "currentColor");
    markerEnd.appendChild(path);

    defs.appendChild(markerEnd);
    svg.appendChild(defs);
  }
}

export function enhanceLine(_data: any, ctx: any) {
  try {
    if (!isFlagEnabled("lineAdvanced")) return;
    const id = ctx?.payload?.nodeId;
    if (!id) return;
    const el = document.getElementById(String(id));
    if (!el) return;
    if (!(el instanceof SVGSVGElement)) return;
    if (!el.classList.contains("rx-line")) return;

    // Ensure base SVG attributes are present (idempotent)
    el.setAttribute("width", el.getAttribute("width") || "100%");
    el.setAttribute("height", el.getAttribute("height") || "100%");
    el.setAttribute("viewBox", el.getAttribute("viewBox") || "0 0 100 100");
    el.setAttribute(
      "preserveAspectRatio",
      el.getAttribute("preserveAspectRatio") || "none"
    );

    // Phase 1: add defs (markers) once. Idempotent if already present.
    ensureLineMarkers(el);
  } catch {}
}

