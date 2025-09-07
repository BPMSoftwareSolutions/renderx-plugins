import { ensureOverlayCss } from "./select.overlay.css.stage-crew";

export function getCanvasOrThrow(): HTMLElement {
  const canvas =
    typeof document !== "undefined"
      ? document.getElementById("rx-canvas")
      : null;
  if (!canvas) throw new Error("#rx-canvas not found");
  return canvas;
}

export function ensureOverlay(): HTMLDivElement {
  ensureOverlayCss();
  const canvas = getCanvasOrThrow();
  let ov = document.getElementById(
    "rx-selection-overlay"
  ) as HTMLDivElement | null;
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "rx-selection-overlay";
    ov.className = "rx-selection-overlay";
    // Ensure inline box-sizing so tests (which read inline style) and runtime both agree
    (ov.style as CSSStyleDeclaration).boxSizing = "border-box";
    const positions = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
    for (const p of positions) {
      const h = document.createElement("div");
      h.className = `rx-handle ${p}`;
      ov.appendChild(h);
    }
    canvas.appendChild(ov);
  }
  return ov;
}

export function getCanvasRect() {
  return getCanvasOrThrow().getBoundingClientRect();
}

export function applyOverlayRectForEl(ov: HTMLDivElement, el: HTMLElement) {
  const canvasRect = getCanvasRect();

  // Prefer inline styles when available for exact match
  const styleLeft = parseFloat(el.style.left || "");
  const styleTop = parseFloat(el.style.top || "");
  const styleWidth = parseFloat(el.style.width || "");
  const styleHeight = parseFloat(el.style.height || "");

  if (
    Number.isFinite(styleLeft) &&
    Number.isFinite(styleTop) &&
    Number.isFinite(styleWidth) &&
    Number.isFinite(styleHeight)
  ) {
    // Compute absolute position relative to canvas even if element is inside a container
    const parentRect = (
      el.parentElement || getCanvasOrThrow()
    ).getBoundingClientRect();
    const absLeft = styleLeft + (parentRect.left - canvasRect.left);
    const absTop = styleTop + (parentRect.top - canvasRect.top);
    Object.assign(ov.style, {
      left: `${Math.round(absLeft)}px`,
      top: `${Math.round(absTop)}px`,
      width: `${Math.round(styleWidth)}px`,
      height: `${Math.round(styleHeight)}px`,
      display: "block",
    } as Partial<CSSStyleDeclaration>);
    return;
  }

  // Fallback to bounding client rect
  const r = el.getBoundingClientRect();
  Object.assign(ov.style, {
    left: `${Math.round(r.left - canvasRect.left)}px`,
    top: `${Math.round(r.top - canvasRect.top)}px`,
    width: `${Math.round(r.width)}px`,
    height: `${Math.round(r.height)}px`,
    display: "block",
  } as Partial<CSSStyleDeclaration>);
}
