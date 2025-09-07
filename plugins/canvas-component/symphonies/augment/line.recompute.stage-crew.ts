// Phase 2+3: Recompute SVG geometry for line based on CSS variables on the host element
// Idempotent and side-effect free beyond DOM attribute updates on child nodes.

const NS = "http://www.w3.org/2000/svg";

function ensureLine(svg: SVGSVGElement): SVGLineElement {
  let line = svg.querySelector("line.segment") as SVGLineElement | null;
  if (!line) {
    line = document.createElementNS(NS, "line") as SVGLineElement;
    line.setAttribute("class", "segment");
    line.setAttribute("vector-effect", "non-scaling-stroke");
    svg.appendChild(line);
  }
  return line;
}

function ensureCurve(svg: SVGSVGElement): SVGPathElement {
  let path = svg.querySelector("path.segment-curve") as SVGPathElement | null;
  if (!path) {
    path = document.createElementNS(NS, "path") as SVGPathElement;
    path.setAttribute("class", "segment-curve");
    path.setAttribute("vector-effect", "non-scaling-stroke");
    path.style.display = "none"; // hidden unless curve enabled
    svg.appendChild(path);
  }
  return path;
}

function readCssNumber(
  el: HTMLElement,
  name: string,
  fallback: number
): number {
  // Prefer inline style, fallback to computed style
  const inline = el.style.getPropertyValue(name);
  if (inline) {
    const n = parseFloat(inline);
    if (Number.isFinite(n)) return n;
  }
  try {
    const cs = getComputedStyle(el);
    const v = cs.getPropertyValue(name);
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  } catch {}
  return fallback;
}

function readBooleanVar(el: HTMLElement, name: string): boolean {
  const v = (el.style.getPropertyValue(name) || "").trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  if (v === "0" || v === "false" || v === "no") return false;
  // Try computed style as string
  try {
    const cs = getComputedStyle(el);
    const c = (cs.getPropertyValue(name) || "").trim().toLowerCase();
    if (c === "1" || c === "true" || c === "yes") return true;
    if (c === "0" || c === "false" || c === "no") return false;
  } catch {}
  return false;
}

function resolveSize(svg: SVGSVGElement): { w: number; h: number } {
  // Prefer inline style width/height (set by create.stage-crew)
  const wStr = (svg as unknown as HTMLElement).style.width || "";
  const hStr = (svg as unknown as HTMLElement).style.height || "";
  const w = parseFloat(wStr) || svg.getBoundingClientRect?.().width || 0 || 100;
  const h =
    parseFloat(hStr) || svg.getBoundingClientRect?.().height || 0 || 100;
  return { w: w || 100, h: h || 100 };
}

export function recomputeLineSvg(svg: SVGSVGElement) {
  const host = svg as unknown as HTMLElement;
  const line = ensureLine(svg);
  const curve = ensureCurve(svg);

  const { w, h } = resolveSize(svg);

  // Defaults: x1=0, y1=0, x2=w, y2=y1 to keep horizontal by default
  const x1 = readCssNumber(host, "--x1", 0);
  const y1 = readCssNumber(host, "--y1", 0);
  const x2 = readCssNumber(host, "--x2", w);
  const y2 = readCssNumber(host, "--y2", y1);

  // Optional curvature and rotation
  const cx = readCssNumber(host, "--cx", (x1 + x2) / 2);
  const cy = readCssNumber(host, "--cy", (y1 + y2) / 2);
  const curveOn = readBooleanVar(host, "--curve");
  const angle = readCssNumber(host, "--angle", 0); // degrees

  const toVbX = (px: number) =>
    Number(
      (w ? (px / w) * 100 : 0)
        .toFixed(3)
        .replace(/\.0+$/, "")
        .replace(/\.$/, "")
    );
  const toVbY = (px: number) =>
    Number(
      (h ? (px / h) * 100 : 0)
        .toFixed(3)
        .replace(/\.0+$/, "")
        .replace(/\.$/, "")
    );

  const nx1 = toVbX(x1);
  const ny1 = toVbY(y1);
  const nx2 = toVbX(x2);
  const ny2 = toVbY(y2);
  const ncx = toVbX(cx);
  const ncy = toVbY(cy);

  const setRotate = (elt: SVGElement) => {
    if (!elt) return;
    if (Math.abs(angle) > 0.0001) {
      // rotate around midpoint of endpoints in viewBox units
      const mx = (nx1 + nx2) / 2;
      const my = (ny1 + ny2) / 2;
      elt.setAttribute("transform", `rotate(${angle} ${mx} ${my})`);
    } else {
      elt.removeAttribute("transform");
    }
  };

  // --- Dynamic viewBox autosize to prevent clipping when endpoints extend or rotate ---
  const thickness = readCssNumber(host, "--thickness", 2);
  const padX = ((thickness * 4) / (w || 1)) * 100; // generous padding in percent
  const padY = ((thickness * 4) / (h || 1)) * 100;

  const rad = (angle * Math.PI) / 180;
  const mx = (nx1 + nx2) / 2;
  const my = (ny1 + ny2) / 2;
  const rotatePoint = (x: number, y: number) => {
    if (!rad) return { x, y };
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = x - mx;
    const dy = y - my;
    return { x: mx + dx * cos - dy * sin, y: my + dx * sin + dy * cos };
  };

  const p1r = rotatePoint(nx1, ny1);
  const p2r = rotatePoint(nx2, ny2);
  // If curved, include control point as a rough bound
  const cr = rotatePoint(ncx, ncy);

  let minX = Math.min(nx1, nx2, p1r.x, p2r.x, curveOn ? cr.x : nx1);
  let minY = Math.min(ny1, ny2, p1r.y, p2r.y, curveOn ? cr.y : ny1);
  let maxX = Math.max(nx1, nx2, p1r.x, p2r.x, curveOn ? cr.x : nx2);
  let maxY = Math.max(ny1, ny2, p1r.y, p2r.y, curveOn ? cr.y : ny2);

  minX -= padX;
  minY -= padY;
  maxX += padX;
  maxY += padY;

  const vbW = Math.max(1, maxX - minX);
  const vbH = Math.max(1, maxY - minY);
  svg.setAttribute(
    "viewBox",
    `${minX.toFixed(3).replace(/\.0+$/, "").replace(/\.$/, "")} ${minY
      .toFixed(3)
      .replace(/\.0+$/, "")
      .replace(/\.$/, "")} ${vbW
      .toFixed(3)
      .replace(/\.0+$/, "")
      .replace(/\.$/, "")} ${vbH
      .toFixed(3)
      .replace(/\.0+$/, "")
      .replace(/\.$/, "")}`
  );

  if (curveOn) {
    // Use quadratic Bezier through control point (cx, cy) in normalized coords
    const d = `M ${nx1} ${ny1} Q ${ncx} ${ncy} ${nx2} ${ny2}`;
    curve.setAttribute("d", d);
    curve.style.display = "";
    line.style.display = "none";
    // Arrow toggles on curve path
    const arrowStart = readBooleanVar(host, "--arrowStart");
    const arrowEnd = readBooleanVar(host, "--arrowEnd");
    if (arrowStart) curve.setAttribute("marker-start", "url(#rx-arrow-start)");
    else curve.removeAttribute("marker-start");
    if (arrowEnd) curve.setAttribute("marker-end", "url(#rx-arrow-end)");
    else curve.removeAttribute("marker-end");
    setRotate(curve);
  } else {
    // Straight line
    line.setAttribute("x1", String(nx1));
    line.setAttribute("y1", String(ny1));
    line.setAttribute("x2", String(nx2));
    line.setAttribute("y2", String(ny2));
    curve.style.display = "none";
    line.style.display = "";
    // Arrow toggles on line
    const arrowStart = readBooleanVar(host, "--arrowStart");
    const arrowEnd = readBooleanVar(host, "--arrowEnd");
    if (arrowStart) line.setAttribute("marker-start", "url(#rx-arrow-start)");
    else line.removeAttribute("marker-start");
    if (arrowEnd) line.setAttribute("marker-end", "url(#rx-arrow-end)");
    else line.removeAttribute("marker-end");
    setRotate(line);
  }
}
