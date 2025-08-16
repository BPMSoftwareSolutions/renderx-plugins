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
            const origin = { x: e.clientX || 0, y: e.clientY || 0 };
            ResizeCoordinator.start({ id: elementId, origin });
            play({ elementId, handle: h, start: origin });
          } catch {}
        },
        onPointerMove: (e) => {
          try {
            const cursor = { x: e.clientX || 0, y: e.clientY || 0 };
            ResizeCoordinator.move({
              id: elementId,
              cursor,
              onFrame: ({ dx, dy }) => {
                const ui = getUI();
                // Drive overlay live via UI callback
                try {
                  ui.onResizeUpdate?.({
                    elementId,
                    box: {
                      x: 0,
                      y: 0,
                      w: (ui.__lastW || 0) + dx,
                      h: (ui.__lastH || 0) + dy,
                    },
                  });
                } catch {}
                // Also play resized beat for plugin-driven constraints/logic
                play({ elementId, handle: h, delta: { dx, dy } });
              },
            });
          } catch {}
        },
        onPointerUp: (e) => {
          try {
            const up = { x: e.clientX || 0, y: e.clientY || 0 };
            const { dx, dy } = ResizeCoordinator.end({
              id: elementId,
              upClient: up,
            }) || { dx: 0, dy: 0 };
            // Let plugin finalize and UI commit via callback rehydration
            const ui = getUI();
            try {
              // We do not know startBox; let plugin compute final box and call onResizeEnd via conductor callbacks if wired.
              // As a safety, also invoke UI commit if plugin callbacks are not used.
              ui.onResizeEnd?.({ elementId, box: ui.__lastBox || null });
            } catch {}
            play({ elementId, handle: h, end: true });
          } catch {}
        },
      })
    )
  );
}
