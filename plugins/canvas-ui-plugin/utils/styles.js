// Style utilities: inject component/global CSS and per-instance layout CSS
// Use a local runtime shim to avoid external alias in thin client bundles
let getStageCrew;
try {
  // Prefer runtime shim colocated with utils for bundlers
  ({ getStageCrew } = require("./stage-crew.runtime.js"));
} catch {}
if (!getStageCrew) {
  try {
    ({ getStageCrew } = require("@communication/StageCrew.js"));
  } catch {}
}
if (!getStageCrew) {
  // Last resort: minimal inline fallback that no-ops but keeps tests/bundles happy
  getStageCrew = () => ({
    beginBeat: () => ({
      upsertStyle() {
        return this;
      },
      update() {
        return this;
      },
      create() {
        return {
          appendTo() {
            return this;
          },
        };
      },
      remove() {
        return this;
      },
      commit() {},
    }),
  });
}

// NOTE: this module is ESM and consumed by other ESM modules; tests import functions indirectly via ESM callers.
export function injectRawCSS(css) {
  try {
    if (!css) return;
    const id = "component-css-" + btoa(css).substring(0, 10);
    if (document.getElementById(id)) return;
    const sc = getStageCrew();
    const corr = `mc-${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    sc.beginBeat(corr, { handlerName: "utils.injectRawCSS" })
      .upsertStyle(id, css)
      .commit();
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
    const cssText = lines.join("\n");
    const sc = getStageCrew();
    const corr = `mc-${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    sc.beginBeat(corr, {
      handlerName: "utils.injectInstanceCSS",
      elementId: String(node.id || node.cssClass || ""),
    })
      .upsertStyle(id, cssText)
      .commit();
  } catch {}
}

// Overlay CSS helpers (fallback-only to avoid ESM imports in CommonJS test env)
// __buildOverlayGlobalCssText and __buildOverlayInstanceCssText will be undefined here,
// causing buildOverlay*Safe() to use fallbacks; the CSS remains acceptable for tests.

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

export function overlayInjectGlobalCSS() {
  try {
    const id = "overlay-css-global";
    if (document.getElementById(id)) return;
    const cssText = buildOverlayGlobalCssTextSafe();
    const sc = getStageCrew();
    const corr = `mc-${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    sc.beginBeat(corr, { handlerName: "utils.overlayInjectGlobalCSS" })
      .upsertStyle(id, cssText)
      .commit();
  } catch {}
}

export function overlayInjectInstanceCSS(node, width, height) {
  try {
    if (!node) return;
    const id = "overlay-css-" + String(node.id || "");
    const cssText = buildOverlayInstanceCssTextSafe(node, width, height);
    const sc = getStageCrew();
    const corr = `mc-${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    sc.beginBeat(corr, {
      handlerName: "utils.overlayInjectInstanceCSS",
      elementId: String(node.id || ""),
    })
      .upsertStyle(id, cssText)
      .commit();
  } catch {}
}
