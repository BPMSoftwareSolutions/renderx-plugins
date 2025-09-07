import {
  applyOverlayRectForEl,
  getCanvasRect,
} from "../select/select.overlay.dom.stage-crew";

function clamp(v: number, min = 1) {
  return v < min ? min : v;
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

// Helpers to read/write numeric CSS custom properties
function readCssNumber(el: HTMLElement, name: string, fallback: number) {
  const inline = el.style.getPropertyValue(name);
  if (inline) {
    const n = parseFloat(inline);
    if (Number.isFinite(n)) return n;
  }
  try {
    const v = getComputedStyle(el).getPropertyValue(name);
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  } catch {}
  return fallback;
}

function writeCssNumber(el: HTMLElement, name: string, value: number) {
  el.style.setProperty(name, String(Math.round(value)));
}

export const startResize = (data: any) => {
  const { id, onResizeStart } = data || {};
  // Capture base line endpoints to allow proportional scaling during resize
  try {
    const el = document.getElementById(String(id)) as HTMLElement | null;
    if (el && el.classList.contains("rx-line")) {
      const rect = el.getBoundingClientRect();
      el.dataset.lineBaseW = String(
        rect.width || parseFloat(el.style.width) || 0
      );
      el.dataset.lineBaseH = String(
        rect.height || parseFloat(el.style.height) || 0
      );
      // Read current endpoints/control as px (fallbacks mirror recompute defaults)
      const baseW = parseFloat(el.dataset.lineBaseW || "0") || 0;
      const baseH = parseFloat(el.dataset.lineBaseH || "0") || 0;
      const x1 = readCssNumber(el, "--x1", 0);
      const y1 = readCssNumber(el, "--y1", 0);
      const x2 = readCssNumber(el, "--x2", baseW || x1);
      const y2 = readCssNumber(el, "--y2", y1);
      const cx = readCssNumber(el, "--cx", (x1 + x2) / 2);
      const cy = readCssNumber(el, "--cy", (y1 + y2) / 2);
      el.dataset.lineBaseX1 = String(x1);
      el.dataset.lineBaseY1 = String(y1);
      el.dataset.lineBaseX2 = String(x2);
      el.dataset.lineBaseY2 = String(y2);
      el.dataset.lineBaseCx = String(cx);
      el.dataset.lineBaseCy = String(cy);
    }
  } catch {}

  if (typeof onResizeStart === "function") {
    try {
      onResizeStart({ id });
    } catch {}
  }
};

export const updateSize = (data: any, ctx?: any) => {
  const {
    id,
    dir,
    startLeft,
    startTop,
    startWidth,
    startHeight,
    dx,
    dy,
    onResize,
    phase,
  } = data || {};
  if (!id) throw new Error("Missing id for resize");
  const el =
    typeof document !== "undefined"
      ? (document.getElementById(String(id)) as HTMLElement | null)
      : null;
  if (!el) throw new Error(`Canvas component with id ${id} not found`);

  const cfg = getResizeConfig(el);
  if (!cfg.enabled) {
    const result = {
      id,
      left: startLeft,
      top: startTop,
      width: startWidth,
      height: startHeight,
    };
    if (ctx && ctx.payload) {
      ctx.payload.updatedLayout = {
        x: result.left,
        y: result.top,
        width: result.width,
        height: result.height,
      };
      ctx.payload.elementId = id;
    }
    return result;
  }

  const canvasRect = getCanvasRect();

  let left =
    typeof startLeft === "number"
      ? startLeft
      : el.getBoundingClientRect().left - canvasRect.left;
  let top =
    typeof startTop === "number"
      ? startTop
      : el.getBoundingClientRect().top - canvasRect.top;
  let width =
    typeof startWidth === "number"
      ? startWidth
      : el.getBoundingClientRect().width;
  let height =
    typeof startHeight === "number"
      ? startHeight
      : el.getBoundingClientRect().height;

  // Guard: if this invocation is not a move (e.g., start/end), don't recompute size
  if (phase && phase !== "move") {
    const result = {
      id,
      left: startLeft,
      top: startTop,
      width: startWidth,
      height: startHeight,
    };
    if (ctx && ctx.payload) {
      ctx.payload.updatedLayout = {
        x: result.left,
        y: result.top,
        width: result.width,
        height: result.height,
      };
      ctx.payload.elementId = id;
    }
    return result;
  }

  const _dx = Number(dx);
  const _dy = Number(dy);
  if (!Number.isFinite(_dx) || !Number.isFinite(_dy)) {
    // No deltas provided — ignore to avoid snap back
    const result = {
      id,
      left: startLeft,
      top: startTop,
      width: startWidth,
      height: startHeight,
    };
    if (ctx && ctx.payload) {
      ctx.payload.updatedLayout = {
        x: result.left,
        y: result.top,
        width: result.width,
        height: result.height,
      };
      ctx.payload.elementId = id;
    }
    return result;
  }

  if (String(dir).includes("e")) width = clamp(startWidth + _dx, cfg.minW);
  if (String(dir).includes("s")) height = clamp(startHeight + _dy, cfg.minH);
  if (String(dir).includes("w")) {
    width = clamp(startWidth - _dx, cfg.minW);
    left = startLeft + _dx;
    if (width <= cfg.minW) left = startLeft + (startWidth - cfg.minW);
  }
  if (String(dir).includes("n")) {
    height = clamp(startHeight - _dy, cfg.minH);
    top = startTop + _dy;
    if (height <= cfg.minH) top = startTop + (startHeight - cfg.minH);
  }

  el.style.position = "absolute";
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
  el.style.width = `${Math.round(width)}px`;
  el.style.height = `${Math.round(height)}px`;

  // Proportionally scale rx-line endpoints when the element is resized
  try {
    if (el.classList.contains("rx-line")) {
      const baseW =
        parseFloat(el.dataset.lineBaseW || String(startWidth) || "0") || 0;
      const baseH =
        parseFloat(el.dataset.lineBaseH || String(startHeight) || "0") || 0;
      if (baseW > 0 && baseH > 0) {
        const sx = width / baseW;
        const sy = height / baseH;
        const bx1 = parseFloat(el.dataset.lineBaseX1 || "0") || 0;
        const by1 = parseFloat(el.dataset.lineBaseY1 || "0") || 0;
        const bx2 = parseFloat(el.dataset.lineBaseX2 || String(baseW)) || baseW;
        const by2 = parseFloat(el.dataset.lineBaseY2 || String(by1)) || by1;
        const bcx = parseFloat(
          el.dataset.lineBaseCx || String((bx1 + bx2) / 2)
        );
        const bcy = parseFloat(
          el.dataset.lineBaseCy || String((by1 + by2) / 2)
        );
        writeCssNumber(el, "--x1", bx1 * sx);
        writeCssNumber(el, "--y1", by1 * sy);
        writeCssNumber(el, "--x2", bx2 * sx);
        writeCssNumber(el, "--y2", by2 * sy);
        writeCssNumber(el, "--cx", bcx * sx);
        writeCssNumber(el, "--cy", bcy * sy);
      }
    }
  } catch {}

  const ov = document.getElementById(
    "rx-selection-overlay"
  ) as HTMLDivElement | null;
  if (ov) applyOverlayRectForEl(ov, el);

  if (typeof onResize === "function") {
    try {
      onResize({ id, left, top, width, height });
    } catch {}
  }

  if (ctx && ctx.payload) {
    ctx.payload.updatedLayout = { x: left, y: top, width, height };
    ctx.payload.elementId = id;
  }

  return { id, left, top, width, height };
};

export const endResize = (data: any) => {
  const { id, onResizeEnd } = data || {};
  if (typeof onResizeEnd === "function") {
    try {
      onResizeEnd({ id });
    } catch {}
  }
  // resync overlay to final inline styles
  try {
    const el = document.getElementById(String(id)) as HTMLElement | null;
    if (el) {
      // Clear captured base metrics
      delete el.dataset.lineBaseW;
      delete el.dataset.lineBaseH;
      delete el.dataset.lineBaseX1;
      delete el.dataset.lineBaseY1;
      delete el.dataset.lineBaseX2;
      delete el.dataset.lineBaseY2;
      delete el.dataset.lineBaseCx;
      delete el.dataset.lineBaseCy;
    }
    const ov = document.getElementById(
      "rx-selection-overlay"
    ) as HTMLDivElement | null;
    if (el && ov) applyOverlayRectForEl(ov, el);
  } catch {}
};
