export type GhostSize = {
  width: number;
  height: number;
  targetEl: HTMLElement | null;
};

export function ensurePayload(dt: DataTransfer | undefined, component: any) {
  dt?.setData("application/rx-component", JSON.stringify({ component }));
}

export function computeGhostSize(e: any, component: any): GhostSize {
  const targetEl = (e?.target as HTMLElement) || null;
  const tplDim = (component as any)?.template?.dimensions;
  let width: number | undefined;
  let height: number | undefined;

  if (tplDim) {
    if (Number.isFinite(tplDim.width)) width = tplDim.width;
    if (Number.isFinite(tplDim.height)) height = tplDim.height;
  }
  if ((!width || !height) && targetEl?.getBoundingClientRect) {
    const rect = targetEl.getBoundingClientRect();
    width = width ?? Math.round(rect.width);
    height = height ?? Math.round(rect.height);
  }
  width = width ?? 120;
  height = height ?? 40;
  return { width, height, targetEl };
}

export function createGhostContainer(
  width: number,
  height: number
): HTMLElement {
  const ghost = document.createElement("div");
  ghost.style.width = `${width}px`;
  ghost.style.height = `${height}px`;
  ghost.style.boxSizing = "border-box";
  ghost.style.padding = "0";
  ghost.style.margin = "0";
  ghost.style.position = "absolute";
  ghost.style.left = "-9999px";
  ghost.style.top = "-9999px";
  ghost.style.pointerEvents = "none";
  ghost.style.background = "transparent";
  ghost.style.filter = "blur(2px)";
  ghost.style.opacity = "0.9";
  return ghost;
}

export function renderTemplatePreview(
  ghost: HTMLElement,
  template: any,
  width: number,
  height: number
) {
  if (!template || typeof template !== "object") return;
  const tag = template?.tag || "div";
  const isSvg = String(tag).toLowerCase() === "svg";
  const child: any = isSvg
    ? document.createElementNS("http://www.w3.org/2000/svg", "svg")
    : document.createElement(tag);
  try {
    const classes: string[] = Array.isArray(template?.classes)
      ? (template.classes as string[])
      : [];
    classes.forEach((cls) => child.classList.add(cls));
  } catch {}
  if (!isSvg && typeof template?.text === "string")
    child.textContent = template.text;
  // Size ghost visual
  child.style.width = `${width}px`;
  child.style.height = `${height}px`;
  child.style.display = "inline-block";
  if (isSvg) {
    // Ensure svg sizing and a visible line segment
    child.setAttribute("width", "100%");
    child.setAttribute("height", "100%");
    child.setAttribute("viewBox", "0 0 100 100");
    child.setAttribute("preserveAspectRatio", "none");
    const ns = "http://www.w3.org/2000/svg";
    const seg = document.createElementNS(ns, "line");
    seg.setAttribute("class", "segment");
    seg.setAttribute("x1", "0");
    seg.setAttribute("y1", "50");
    seg.setAttribute("x2", "100");
    seg.setAttribute("y2", "50");
    seg.setAttribute("vector-effect", "non-scaling-stroke");
    child.appendChild(seg);
  }
  ghost.appendChild(child);
}

export function applyTemplateStyles(ghost: HTMLElement, template: any) {
  if (!template || typeof template !== "object") return;
  if (typeof template?.css === "string") {
    const styleEl = document.createElement("style");
    styleEl.textContent = template.css;
    ghost.appendChild(styleEl);
  }
  const vars = template?.cssVariables;
  if (vars && typeof vars === "object") {
    for (const [k, v] of Object.entries(vars)) {
      try {
        const name = String(k).startsWith("--") ? String(k) : `--${k}`;
        ghost.style.setProperty(name, String(v));
      } catch {}
    }
  }
}

export function computeCursorOffsets(
  e: any,
  targetEl: HTMLElement | null,
  width: number,
  height: number
): { offsetX: number; offsetY: number } {
  let offsetX = Math.round(width / 2);
  let offsetY = Math.round(height / 2);
  if (
    targetEl &&
    typeof e?.clientX === "number" &&
    typeof e?.clientY === "number"
  ) {
    try {
      const rect = targetEl.getBoundingClientRect();
      offsetX = Math.max(0, Math.round(e.clientX - rect.left));
      offsetY = Math.max(0, Math.round(e.clientY - rect.top));
    } catch {}
  }
  return { offsetX, offsetY };
}

export function installDragImage(
  dt: DataTransfer,
  ghost: HTMLElement,
  offsetX: number,
  offsetY: number
) {
  document.body.appendChild(ghost);
  try {
    dt.setDragImage(ghost, offsetX, offsetY);
  } finally {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => ghost.remove());
    } else {
      setTimeout(() => ghost.remove(), 0);
    }
  }
}
