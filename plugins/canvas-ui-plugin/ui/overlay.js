import {
  overlayInjectGlobalCSS,
  overlayInjectInstanceCSS,
} from "../utils/styles.js";
import { ResizeCoordinator } from "../utils/ResizeCoordinator.js";

// Ensure global overlay CSS is available as soon as this module is loaded
try {
  overlayInjectGlobalCSS();
} catch {}

export function buildOverlayForNode(React, n, key, selectedId) {
  if (!(selectedId && (n.id === selectedId || n.elementId === selectedId)))
    return null;
  try {
    overlayInjectGlobalCSS();
    const defaults =
      (n.component &&
        n.component.integration &&
        n.component.integration.canvasIntegration) ||
      {};
    overlayInjectInstanceCSS(
      { id: n.id, position: n.position },
      defaults.defaultWidth,
      defaults.defaultHeight
    );
  } catch {}
  const overlayClass = `rx-resize-overlay rx-overlay-${n.id || n.elementId}`;
  const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
  const elementId = n.id || n.elementId;

  const play = (payload) => {
    try {
      const system = (window && window.renderxCommunicationSystem) || null;
      const conductor = system && system.conductor;
      if (conductor && typeof conductor.play === "function") {
        conductor.play(
          "Canvas.component-resize-symphony",
          "Canvas.component-resize-symphony",
          payload
        );
      }
    } catch {}
  };

  const getUI = () => {
    try {
      const w = (typeof window !== "undefined" && window) || {};
      return w.__rx_canvas_ui__ || {};
    } catch {
      return {};
    }
  };

  return React.createElement(
    "div",
    { key: `${key}__overlay`, className: overlayClass },
    ...handles.map((h) =>
      React.createElement("div", {
        key: `${key}__${h}`,
        className: `rx-resize-handle rx-${h}`,
        onPointerDown: (e) => {
          try {
            e && e.stopPropagation && e.stopPropagation();
            // Pointer capture for reliable move/up
            try {
              if (
                e &&
                e.target &&
                typeof e.target.setPointerCapture === "function" &&
                typeof e.pointerId !== "undefined"
              ) {
                e.target.setPointerCapture(e.pointerId);
              }
            } catch {}
            const origin = { x: e.clientX || 0, y: e.clientY || 0 };
            ResizeCoordinator.start({ id: elementId, origin });
            // Determine starting box from instance CSS tag (or defaults)
            let startW = 0,
              startH = 0;
            try {
              const w = (typeof window !== "undefined" && window) || {};
              const cls = String(n.cssClass || n.id || "");
              const tagId = "component-instance-css-" + String(elementId || "");
              const tag = document.getElementById(tagId);
              const text = (tag && tag.textContent) || "";
              const mw = text.match(
                new RegExp(
                  `\\.${cls}\\s*\\{[^}]*width\\s*:\\s*([0-9.-]+)px;`,
                  "i"
                )
              );
              const mh = text.match(
                new RegExp(
                  `\\.${cls}\\s*\\{[^}]*height\\s*:\\s*([0-9.-]+)px;`,
                  "i"
                )
              );
              if (mw) startW = parseFloat(mw[1]);
              if (mh) startH = parseFloat(mh[1]);
              if (!startW || !startH) {
                const defaults =
                  n?.component?.integration?.canvasIntegration || {};
                startW = startW || defaults.defaultWidth || 0;
                startH = startH || defaults.defaultHeight || 0;
              }
              w.__rx_canvas_ui__ = w.__rx_canvas_ui__ || {};
              w.__rx_canvas_ui__.__lastW = startW;
              w.__rx_canvas_ui__.__lastH = startH;
              w.__rx_canvas_ui__.__lastBox = {
                x: 0,
                y: 0,
                w: startW,
                h: startH,
              };
              // Keep a fixed baseline for this gesture
              w.__rx_canvas_ui__.__resizeBaseline =
                w.__rx_canvas_ui__.__resizeBaseline || {};
              w.__rx_canvas_ui__.__resizeBaseline[elementId] = {
                x: 0,
                y: 0,
                w: startW,
                h: startH,
              };
              // Also pass callbacks + startBox so plugin can compute/rehydrate
              const ui = getUI();
              play({
                elementId,
                handle: h,
                start: origin,
                startBox: { x: 0, y: 0, w: startW, h: startH },
                onResizeUpdate: ui.onResizeUpdate,
                onResizeEnd: ui.onResizeEnd,
              });
              return; // We already played with proper payload
            } catch {}
            play({ elementId, handle: h, start: origin });
          } catch {}
        },
        onPointerMove: (e) => {
          try {
            // Ignore hover after pointerup or non-primary moves
            if (!e || e.buttons !== 1) return;
            const cursor = { x: e.clientX || 0, y: e.clientY || 0 };
            ResizeCoordinator.move({
              id: elementId,
              cursor,
              onFrame: ({ dx, dy }) => {
                const ui = getUI();
                try {
                  const base = (ui.__resizeBaseline &&
                    ui.__resizeBaseline[elementId]) || {
                    w: Number(ui.__lastW || 0),
                    h: Number(ui.__lastH || 0),
                  };
                  const wNew = Math.max(0, Math.round((base.w || 0) + dx));
                  const hNew = Math.max(0, Math.round((base.h || 0) + dy));
                  ui.onResizeUpdate?.({
                    elementId,
                    box: { x: 0, y: 0, w: wNew, h: hNew },
                  });
                } catch {}
                try {
                  // Also play to plugin, and include baseline + onResizeUpdate to satisfy contract
                  const base =
                    (ui.__resizeBaseline && ui.__resizeBaseline[elementId]) ||
                    null;
                  play({
                    elementId,
                    handle: h,
                    delta: { dx, dy },
                    startBox: base || undefined,
                    onResizeUpdate: ui.onResizeUpdate,
                  });
                } catch {}
              },
            });
          } catch {}
        },
        onPointerUp: (e) => {
          try {
            const up = { x: e.clientX || 0, y: e.clientY || 0 };
            ResizeCoordinator.end({ id: elementId, upClient: up });
            // Release pointer capture
            try {
              if (
                e &&
                e.target &&
                typeof e.target.releasePointerCapture === "function" &&
                typeof e.pointerId !== "undefined"
              ) {
                e.target.releasePointerCapture(e.pointerId);
              }
            } catch {}
            const ui = getUI();
            try {
              if (ui && typeof ui.onResizeEnd === "function" && ui.__lastBox) {
                ui.onResizeEnd({ elementId, box: ui.__lastBox });
              }
              // Clear baseline for element
              if (ui && ui.__resizeBaseline && ui.__resizeBaseline[elementId]) {
                delete ui.__resizeBaseline[elementId];
              }
            } catch {}
            // Also notify plugin end (constraints/persistence as needed)
            play({
              elementId,
              handle: h,
              end: true,
              onResizeEnd: ui.onResizeEnd,
            });
          } catch {}
        },
      })
    )
  );
}
