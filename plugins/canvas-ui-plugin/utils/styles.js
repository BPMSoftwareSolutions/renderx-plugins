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

export function injectInstanceCSS(node, width, height) {
  try {
    if (!node) return;
    const id =
      "component-instance-css-" + String(node.id || node.cssClass || "");
    if (document.getElementById(id)) return;
    const cls = String(node.cssClass || node.id || "").trim();
    if (!cls) return;
    const left =
      (node.position && node.position.x) != null ? node.position.x : 0;
    const top =
      (node.position && node.position.y) != null ? node.position.y : 0;
    const lines = [
      `.${cls}{position:absolute;left:${left}px;top:${top}px;box-sizing:border-box;display:block;}`,
    ];
    if (width != null)
      lines.push(
        `.${cls}{width:${typeof width === "number" ? width + "px" : width};}`
      );
    if (height != null)
      lines.push(
        `.${cls}{height:${
          typeof height === "number" ? height + "px" : height
        };}`
      );
    const tag = document.createElement("style");
    tag.id = id;
    tag.textContent = lines.join("\n");
    document.head.appendChild(tag);
  } catch {}
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
    const id = "overlay-css-global";
    if (document.getElementById(id)) return; // insert-once semantics
    const cssText = buildOverlayGlobalCssTextSafe();
    const txn = ctx.stageCrew.beginBeat("overlay-css-global", { handlerName: "overlayCSS" });
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
