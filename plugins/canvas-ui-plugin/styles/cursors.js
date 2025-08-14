// Cursor styles injector for drag UX
export function ensureCursorStylesInjected() {
  try {
    const styleId = "rx-canvas-ui-cursors";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = `
        .rx-comp-draggable { cursor: grab; cursor: -webkit-grab; }
        .rx-comp-grabbing { cursor: grabbing !important; cursor: -webkit-grabbing !important; }
      `;
      document.head.appendChild(s);
    }
  } catch {}
}

