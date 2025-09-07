export function ensureOverlayCss() {
  if (typeof document === "undefined") return;
  const id = "rx-components-styles";
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  const css = `
  .rx-selection-overlay { position:absolute; border: 1px solid #3b82f6; box-shadow: 0 0 0 1px #fff inset; pointer-events: none; z-index: 10; box-sizing: border-box; }
  .rx-selection-overlay .rx-handle { position:absolute; width:8px; height:8px; background:#3b82f6; border:1px solid #fff; border-radius:50%; box-sizing:border-box; pointer-events: auto; }
  .rx-selection-overlay .rx-handle.nw { left:-4px; top:-4px; cursor: nwse-resize; }
  .rx-selection-overlay .rx-handle.n  { left:50%; top:-4px; transform: translateX(-50%); cursor: ns-resize; }
  .rx-selection-overlay .rx-handle.ne { right:-4px; top:-4px; cursor: nesw-resize; }
  .rx-selection-overlay .rx-handle.e  { right:-4px; top:50%; transform: translateY(-50%); cursor: ew-resize; }
  .rx-selection-overlay .rx-handle.se { right:-4px; bottom:-4px; cursor: nwse-resize; }
  .rx-selection-overlay .rx-handle.s  { left:50%; bottom:-4px; transform: translateX(-50%); cursor: ns-resize; }
  .rx-selection-overlay .rx-handle.sw { left:-4px; bottom:-4px; cursor: nesw-resize; }
  .rx-selection-overlay .rx-handle.w  { left:-4px; top:50%; transform: translateY(-50%); cursor: ew-resize; }
  `;
  if (!(el.textContent || "").includes("rx-selection-overlay")) {
    el.appendChild(document.createTextNode(css));
  }
}

