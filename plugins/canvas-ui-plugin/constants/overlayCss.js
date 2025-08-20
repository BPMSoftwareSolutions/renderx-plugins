// Canonical overlay CSS constants
const OVERLAY_GLOBAL_RULES_LOCAL = [
  ".rx-resize-overlay{position:absolute;pointer-events:none;}",
  ".rx-resize-handle{position:absolute;width:8px;height:8px;border:1px solid #09f;background:#fff;box-sizing:border-box;pointer-events:auto;}",
  // Corner handles: transform-based centering (robust to themed sizes/borders)
  ".rx-nw{left:0;top:0;transform:translate(-50%,-50%);cursor:nwse-resize;}",
  ".rx-ne{right:0;top:0;transform:translate(50%,-50%);cursor:nesw-resize;}",
  ".rx-se{right:0;bottom:0;transform:translate(50%,50%);cursor:nwse-resize;}",
  ".rx-sw{left:0;bottom:0;transform:translate(-50%,50%);cursor:nesw-resize;}",
  // Edge handles: transform-based centering on one axis, anchored on the box edge
  ".rx-n{left:50%;top:0;transform:translate(-50%,-50%);cursor:ns-resize;}",
  ".rx-e{right:0;top:50%;transform:translate(50%,-50%);cursor:ew-resize;}",
  ".rx-s{left:50%;bottom:0;transform:translate(-50%,50%);cursor:ns-resize;}",
  ".rx-w{left:0;top:50%;transform:translate(-50%,-50%);cursor:ew-resize;}",
];
export const OVERLAY_GLOBAL_RULES = OVERLAY_GLOBAL_RULES_LOCAL;

export function buildOverlayGlobalCssText() {
  return OVERLAY_GLOBAL_RULES_LOCAL.join("\n");
}

export function buildOverlayInstanceCssText(node, width, height) {
  const left = node?.position?.x ?? 0;
  const top = node?.position?.y ?? 0;
  const w = typeof width === "number" ? width + "px" : width;
  const h = typeof height === "number" ? height + "px" : height;
  const cls = `rx-overlay-${String(node?.id ?? "")}`;
  return `.${cls}{position:absolute;left:${left}px;top:${top}px;width:${w};height:${h};z-index:10;}`;
}
