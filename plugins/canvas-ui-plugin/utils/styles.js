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
  buildOverlayGlobalCssText,
  buildOverlayInstanceCssText,
} from "../constants/overlayCss.js";

export function overlayInjectGlobalCSS() {
  try {
    const id = "overlay-css-global";
    if (document.getElementById(id)) return;
    const tag = document.createElement("style");
    tag.id = id;
    tag.textContent = buildOverlayGlobalCssText();
    document.head.appendChild(tag);
  } catch {}
}

export function overlayInjectInstanceCSS(node, width, height) {
  try {
    if (!node) return;
    const id = "overlay-css-" + String(node.id || "");
    if (document.getElementById(id)) return;
    const cssText = buildOverlayInstanceCssText(node, width, height);
    const tag = document.createElement("style");
    tag.id = id;
    tag.textContent = cssText;
    document.head.appendChild(tag);
  } catch {}
}
