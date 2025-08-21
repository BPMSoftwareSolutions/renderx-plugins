// Style utilities: inject component/global CSS and per-instance layout CSS
export function injectRawCSS(css) {
  try {
    if (!css) return;
    const id = "component-css-" + btoa(css).substring(0, 10);
    if (document.getElementById(id)) return;
    const tag = document.createElement("style");
    tag.id = id;
    tag.textContent = css;
    document.head.appendChild(tag);
  } catch {}
}

// DEPRECATED: Component geometry is now owned by sequence data + StageCrew operations.
// This function is neutralized to prevent position reset bugs.
// Only overlay CSS should be managed via StageCrew transactions.
export function injectInstanceCSS(node, width, height) {
  // NO-OP: Geometry injection has been removed to prevent position reset regressions.
  //
  // CONTEXT: This function previously injected CSS rules like:
  // `.${cls}{position:absolute;left:${left}px;top:${top}px;...}`
  //
  // PROBLEM: This caused components to jump to (0,0) or stale positions when:
  // - node.position was missing or stale
  // - Multiple components shared the same class
  // - CSS injection happened during selection/overlay operations
  //
  // SOLUTION: Component geometry is now managed exclusively through:
  // - Sequence data (node.position)
  // - StageCrew transactions for overlay CSS only
  // - No direct CSS injection for component positioning
  //
  // This function is kept as a no-op for backward compatibility until all callers are removed.

  console.warn(
    "injectInstanceCSS is deprecated and neutralized. " +
    "Component geometry should be managed via sequence data and StageCrew overlay operations only. " +
    `Called with node: ${node?.id || node?.cssClass}, width: ${width}, height: ${height}`
  );

  // Early return - no CSS injection performed
  return;
}

// Overlay CSS helpers
import {
  buildOverlayGlobalCssText as __buildOverlayGlobalCssText,
  buildOverlayInstanceCssText as __buildOverlayInstanceCssText,
} from "../constants/overlayCss.js";

function fallbackOverlayGlobalCssText() {
  return [
    ".rx-resize-overlay{position:absolute;pointer-events:none;}",
    ".rx-resize-handle{position:absolute;width:8px;height:8px;border:1px solid #09f;background:#fff;box-sizing:border-box;pointer-events:auto;}",
    ".rx-nw{left:-4px;top:-4px;cursor:nwse-resize;}",
    ".rx-n{left:50%;top:-4px;transform:translateX(-50%);cursor:ns-resize;}",
    ".rx-ne{right:-4px;top:-4px;cursor:nesw-resize;}",
    ".rx-e{right:-4px;top:50%;transform:translateY(-50%);cursor:ew-resize;}",
    ".rx-se{right:-4px;bottom:-4px;cursor:nwse-resize;}",
    ".rx-s{left:50%;bottom:-4px;transform:translateX(-50%);cursor:ns-resize;}",
    ".rx-sw{left:-4px;bottom:-4px;cursor:nesw-resize;}",
    ".rx-w{left:-4px;top:50%;transform:translateY(-50%);cursor:ew-resize;}",
  ].join("\n");
}

function buildOverlayGlobalCssTextSafe() {
  try {
    if (typeof __buildOverlayGlobalCssText === "function") {
      return __buildOverlayGlobalCssText();
    }
  } catch {}
  return fallbackOverlayGlobalCssText();
}

function buildOverlayInstanceCssTextSafe(node, width, height) {
  try {
    if (typeof __buildOverlayInstanceCssText === "function") {
      return __buildOverlayInstanceCssText(node, width, height);
    }
  } catch {}
  const left = node?.position?.x ?? 0;
  const top = node?.position?.y ?? 0;
  const w = typeof width === "number" ? width + "px" : width;
  const h = typeof height === "number" ? height + "px" : height;
  const cls = `rx-overlay-${String(node?.id ?? "")}`;
  return `.${cls}{position:absolute;left:${left}px;top:${top}px;width:${w};height:${h};z-index:10;}`;
}

export function overlayInjectGlobalCSS(ctx) {
  try {
    const sc = ctx?.stageCrew || ctx; // allow passing StageCrew directly for tests
    if (!sc || typeof sc.beginBeat !== "function") throw new Error("StageCrew required");
    const id = "overlay-css-global";
    if (typeof document !== "undefined" && document.getElementById(id)) return; // insert-once semantics
    const cssText = buildOverlayGlobalCssTextSafe();
    const txn = sc.beginBeat("overlay-css-global", { handlerName: "overlayCSS" });
    txn.create("style", { attrs: { id } }).appendTo("head");
    txn.update(`#${id}`, { text: cssText });
    txn.commit();
  } catch {}
}

export function overlayInjectInstanceCSS(ctx, node, width, height) {
  try {
    if (!node) return;
    const id = "overlay-css-" + String(node.id || "");
    const cssText = buildOverlayInstanceCssTextSafe(node, width, height);
    const href = "data:text/css;charset=utf-8," + encodeURIComponent(cssText);

    const txn = ctx.stageCrew.beginBeat(`${id}`, { handlerName: "overlayCSS" });
    txn.remove(`#${id}`);
    txn.create("link", { attrs: { id, rel: "stylesheet", href } }).appendTo("head");
    txn.commit({ batch: true });
  } catch {}
}
