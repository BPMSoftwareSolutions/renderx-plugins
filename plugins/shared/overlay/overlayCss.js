// Shared overlay CSS builders (ESM-only), safe for browser usage

const OVERLAY_GLOBAL_RULES_LOCAL = [
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
];

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

