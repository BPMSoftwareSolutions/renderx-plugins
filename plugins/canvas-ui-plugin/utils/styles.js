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
    const id = "component-instance-css-" + String(node.id || node.cssClass || "");
    if (document.getElementById(id)) return;
    const cls = String(node.cssClass || node.id || "").trim();
    if (!cls) return;
    const left = (node.position && node.position.x) != null ? node.position.x : 0;
    const top = (node.position && node.position.y) != null ? node.position.y : 0;
    const lines = [
      `.${cls}{position:absolute;left:${left}px;top:${top}px;box-sizing:border-box;display:block;}`,
    ];
    if (width != null) lines.push(`.${cls}{width:${typeof width === 'number' ? width + 'px' : width};}`);
    if (height != null) lines.push(`.${cls}{height:${typeof height === 'number' ? height + 'px' : height};}`);
    const tag = document.createElement("style");
    tag.id = id;
    tag.textContent = lines.join("\n");
    document.head.appendChild(tag);
  } catch {}
}

// Overlay CSS helpers
export function overlayInjectGlobalCSS() {
  try {
    const id = "overlay-css-global";
    if (document.getElementById(id)) return;
    const css = [
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
    const tag = document.createElement("style");
    tag.id = id;
    tag.textContent = css;
    document.head.appendChild(tag);
  } catch {}
}

export function overlayInjectInstanceCSS(node, width, height) {
  try {
    if (!node) return;
    const id = "overlay-css-" + String(node.id || "");
    if (document.getElementById(id)) return;
    const left = (node.position && node.position.x) != null ? node.position.x : 0;
    const top = (node.position && node.position.y) != null ? node.position.y : 0;
    const w = typeof width === 'number' ? width + 'px' : width;
    const h = typeof height === 'number' ? height + 'px' : height;
    const cls = "rx-overlay-" + String(node.id || "");
    const lines = [`.${cls}{position:absolute;left:${left}px;top:${top}px;width:${w};height:${h};z-index:10;}`];
    const tag = document.createElement("style");
    tag.id = id;
    tag.textContent = lines.join("\n");
    document.head.appendChild(tag);
  } catch {}
}

