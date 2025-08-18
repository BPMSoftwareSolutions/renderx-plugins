import { handleCanvasDrop } from "../handlers/drop.js";
import { makeRxCompClass } from "../utils/idUtils.js";
import {
  overlayEnsureGlobalCSS,
  overlayEnsureInstanceCSS,
} from "../utils/styles.js";
import { attachDragHandlers } from "../handlers/drag.js";
import { buildOverlayForNode } from "../ui/overlay.js";
import { renderCanvasNode } from "./renderCanvasNode.js";
import { updateInstanceSizeCSS, updateInstancePositionCSS } from "../styles/instanceCss.js";

export function CanvasPage(props = {}) {
  const providedNodes = Array.isArray(props.nodes) ? props.nodes : null;
  const providedSelected = props.selectedId ?? undefined;
  const React = (typeof window !== "undefined" && window.React) || null;
  if (!React) return null;
  // Ensure overlay global CSS is present synchronously for tests that check head styles immediately
  try {
    overlayInjectGlobalCSS();
  } catch {}
  const { useEffect, useState } = React;

  useEffect(() => {
    try {
      const sys = (window && window.renderxCommunicationSystem) || null;
      sys?.logger?.info?.("🎨 Canvas UI Plugin (Scaffold): mounted UI");
    } catch {}
    try {
      // Ensure overlay global CSS is present
      overlayInjectGlobalCSS();
    } catch {}
    const tryStart = () => {
      try {
        const system = (window && window.renderxCommunicationSystem) || null;
        const conductor = system && system.conductor;
        if (!conductor) return setTimeout(tryStart, 120);
        if ((window && window.__rx_canvas_ui_played__) === true) return;
        const getIds =
          conductor.getMountedPluginIds && conductor.getMountedPluginIds();
        const ids = Array.isArray(getIds) ? getIds : [];
        if (ids.includes && ids.includes("Canvas.ui-symphony")) {
          window.__rx_canvas_ui_played__ = true;
          conductor.play("Canvas.ui-symphony", "Canvas.ui-symphony", {
            source: "canvas-ui-plugin",
          });
        } else {
          setTimeout(tryStart, 120);
        }
      } catch {
        setTimeout(tryStart, 150);
      }
    };
    tryStart();
  }, []);

  const [nodes, setNodes] =
    window.React && typeof window.React.useState === "function"
      ? window.React.useState(providedNodes || [])
      : [providedNodes || [], function noop() {}];

  // Helper to get a node by id
  const getNodeById = (id) => {
    const arr = Array.isArray(nodes) ? nodes : [];
    return arr.find((n) => n && (n.id === id || n.elementId === id)) || null;
  };

  const [selectedId, setSelectedId] =
    window.React && typeof window.React.useState === "function"
      ? window.React.useState(providedSelected ?? null)
      : [providedSelected ?? null, function noop() {}];

  useEffect(() => {
    // Expose UI setters for conductor callback wiring; not a global listener
    try {
      const w = (typeof window !== "undefined" && window) || {};
      w.__rx_canvas_ui__ = w.__rx_canvas_ui__ || {};
      w.__rx_canvas_ui__.setSelectedId = (id) => setSelectedId(id || null);
      // Allow drag handlers to persist final position for future drags and overlay sync
      w.__rx_canvas_ui__.positions = w.__rx_canvas_ui__.positions || {};
      w.__rx_canvas_ui__.commitNodePosition = ({ elementId, position }) => {
        try {
          if (!elementId || !position) return;
          // Persist for subsequent drag baselines
          w.__rx_canvas_ui__.positions[elementId] = {
            x: position.x,
            y: position.y,
          };
        } catch {}
        try {
          // Update CanvasPage local state so any re-rendered overlays/nodes use new position
          setNodes((prev) => {
            const next = Array.isArray(prev) ? prev.slice() : [];
            for (let i = 0; i < next.length; i++) {
              const n = next[i];
              if (n && (n.id === elementId || n.elementId === elementId)) {
                next[i] = { ...n, position: { x: position.x, y: position.y } };
                break;
              }
            }
            return next;
          });
        } catch {}
      };
    } catch {}
    return () => {
      try {
        const w = (typeof window !== "undefined" && window) || {};
        if (w.__rx_canvas_ui__) {
          delete w.__rx_canvas_ui__.setSelectedId;
          delete w.__rx_canvas_ui__.commitNodePosition;
        }
      } catch {}
    };
  }, []);

  useEffect(() => {
    const applyOverlayTransform = (dx, dy) => {
      try {
        if (!selectedId) return;
        const styleId = `overlay-transform-${selectedId}`;
        let tag = document.getElementById(styleId);
        if (!tag) {
          tag = document.createElement("style");
          tag.id = styleId;
          document.head.appendChild(tag);
        }
        const cls = `.rx-overlay-${selectedId}{transform:translate(${
          Math.round(dx) || 0
        }px,${Math.round(dy) || 0}px);}`;
        tag.textContent = cls;
      } catch {}
    };
    const clearOverlayTransform = () => {
      try {
        if (!selectedId) return;
        const id = `overlay-transform-${selectedId}`;
        const t = document.getElementById(id);
        if (t && t.parentNode) t.parentNode.removeChild(t);
      } catch {}
    };
    const setOverlayHidden = (hidden) => {
      try {
        if (!selectedId) return;
        const id = `overlay-visibility-${selectedId}`;
        let tag = document.getElementById(id);
        if (hidden) {
          if (!tag) {
            tag = document.createElement("style");
            tag.id = id;
            document.head.appendChild(tag);
          }
          tag.textContent = `.rx-overlay-${selectedId}{display:none;}`;
        } else if (tag && tag.parentNode) {
          tag.parentNode.removeChild(tag);
        }
      } catch {}
    };
    const onDragStart = ({ elementId }) => {
      try {
        if (!elementId || elementId !== selectedId) return;
        setOverlayHidden(true);
      } catch {}
    };
    const onDragUpdate = ({ elementId, delta }) => {
      try {
        if (!elementId || elementId !== selectedId) return;
        const dx = delta && typeof delta.dx === "number" ? delta.dx : 0;
        const dy = delta && typeof delta.dy === "number" ? delta.dy : 0;
        applyOverlayTransform(dx, dy);
      } catch {}
    };
    const onDragEnd = ({ elementId, position }) => {
      try {
        if (!elementId || elementId !== selectedId) return;
        // Update overlay base CSS to new position (keeps overlay aligned after drop)
        const n = getNodeById(elementId);
        const defaults = n?.component?.integration?.canvasIntegration || {};
        const nextNode = {
          id: elementId,
          position: {
            x: position?.x ?? n?.position?.x ?? 0,
            y: position?.y ?? n?.position?.y ?? 0,
          },
        };
        try {
          const system = (typeof window !== "undefined" && window.renderxCommunicationSystem) || null;
          const stageCrew = system?.stageCrew;
          overlayEnsureGlobalCSS(stageCrew);
          overlayEnsureInstanceCSS(stageCrew, nextNode, defaults.defaultWidth, defaults.defaultHeight);
        } catch {}
        try {
          // Also update the instance CSS tag immediately to reflect committed left/top
          const cls = String(n?.cssClass || n?.id || "").trim();
          if (cls) updateInstancePositionCSS(elementId, cls, nextNode.position.x, nextNode.position.y);
        } catch {}

        clearOverlayTransform();
        setOverlayHidden(false);
      } catch {}
    };

    // Resize overlay live updates and commit hooks
    const onResizeUpdate = ({ elementId, box }) => {
      try {
        if (!elementId || elementId !== selectedId) return;
        const n = getNodeById(elementId);
        const defaults = n?.component?.integration?.canvasIntegration || {};
        const posX = typeof box?.x === "number" ? box.x : n?.position?.x ?? 0;
        const posY = typeof box?.y === "number" ? box.y : n?.position?.y ?? 0;
        const nextNode = {
          id: elementId,
          position: { x: posX, y: posY },
        };
        // Track last box/size for UI computations if needed
        try {
          const w = (typeof window !== "undefined" && window) || {};
          w.__rx_canvas_ui__ = w.__rx_canvas_ui__ || {};
          if (box && typeof box.w === "number" && typeof box.h === "number") {
            w.__rx_canvas_ui__.__lastBox = {
              x: posX,
              y: posY,
              w: box.w,
              h: box.h,
            };
            w.__rx_canvas_ui__.__lastW = box.w;
            w.__rx_canvas_ui__.__lastH = box.h;
          }
        } catch {}
        try {
          const system = (typeof window !== "undefined" && window.renderxCommunicationSystem) || null;
          const stageCrew = system?.stageCrew;
          overlayEnsureInstanceCSS(
            stageCrew,
            nextNode,
            box?.w ?? defaults.defaultWidth,
            box?.h ?? defaults.defaultHeight
          );
        } catch {}
        // Also live-update the actual component instance CSS so the element resizes during drag
        try {
          const cls = String(n?.cssClass || n?.id || "").trim();
          if (cls) {
            updateInstanceSizeCSS(
              elementId,
              cls,
              box?.w ?? defaults.defaultWidth ?? 0,
              box?.h ?? defaults.defaultHeight ?? 0,
              { x: posX, y: posY }
            );
          }
        } catch {}
      } catch {}
    };
    const onResizeEnd = ({ elementId, box }) => {
      try {
        if (!elementId || elementId !== selectedId) return;
        const n = getNodeById(elementId);
        const cls = String(n?.cssClass || n?.id || "");
        if (!cls) return;
        let finalBox = box;
        try {
          if (!finalBox) {
            const w = (typeof window !== "undefined" && window) || {};
            const ui = w.__rx_canvas_ui__ || {};
            if (
              ui.__lastBox &&
              typeof ui.__lastBox.w === "number" &&
              typeof ui.__lastBox.h === "number"
            ) {
              finalBox = ui.__lastBox;
            }
          }
        } catch {}
        if (!finalBox) return;
        updateInstanceSizeCSS(
          elementId,
          cls,
          finalBox.w ?? 0,
          finalBox.h ?? 0,
          {
            x:
              typeof finalBox.x === "number" ? finalBox.x : n?.position?.x ?? 0,
            y:
              typeof finalBox.y === "number" ? finalBox.y : n?.position?.y ?? 0,
          }
        );
        try {
          const system = (typeof window !== "undefined" && window.renderxCommunicationSystem) || null;
          const stageCrew = system?.stageCrew;
          overlayEnsureInstanceCSS(
            stageCrew,
            {
              id: elementId,
              position: {
                x: typeof finalBox.x === "number" ? finalBox.x : n?.position?.x ?? 0,
                y: typeof finalBox.y === "number" ? finalBox.y : n?.position?.y ?? 0,
              },
            },
            finalBox.w,
            finalBox.h
          );
        } catch {}
      } catch {}
    };
    try {
      const w = (typeof window !== "undefined" && window) || {};
      w.__rx_canvas_ui__ = w.__rx_canvas_ui__ || {};
      w.__rx_canvas_ui__.onDragStart = onDragStart;
      w.__rx_canvas_ui__.onDragUpdate = onDragUpdate;
      w.__rx_canvas_ui__.onDragEnd = onDragEnd;
      // Wire resize callbacks for UI-driven overlay and instance CSS updates
      w.__rx_canvas_ui__.onResizeUpdate = onResizeUpdate;
      w.__rx_canvas_ui__.onResizeEnd = onResizeEnd;
    } catch {}
    return () => {
      try {
        const w = (typeof window !== "undefined" && window) || {};
        if (w.__rx_canvas_ui__) {
          delete w.__rx_canvas_ui__.onDragStart;
          delete w.__rx_canvas_ui__.onDragUpdate;
          delete w.__rx_canvas_ui__.onDragEnd;
          delete w.__rx_canvas_ui__.onResizeUpdate;
          delete w.__rx_canvas_ui__.onResizeEnd;
        }
      } catch {}
      clearOverlayTransform();
      setOverlayHidden(false);
    };
  }, [selectedId]);

  useEffect(() => {
    const onUp = () => {
      try {
        const system = (window && window.renderxCommunicationSystem) || null;
        const conductor = system && system.conductor;
        if (conductor && typeof conductor.play === "function") {
          const w = (typeof window !== "undefined" && window) || {};
          const onDragEnd = w.__rx_canvas_ui__ && w.__rx_canvas_ui__.onDragEnd;
          conductor.play(
            "Canvas.component-drag-symphony",
            "Canvas.component-drag-symphony",
            {
              source: "canvas-ui-plugin:mouseup",
              onDragEnd,
            }
          );
        }
      } catch {}
    };
    // Use React onPointerUp on workspace instead of global window mouseup
    const w = (typeof window !== "undefined" && window) || {};
    w.__rx_canvas_ui__ = w.__rx_canvas_ui__ || {};
    w.__rx_canvas_ui__.onWindowMouseUp = onUp;
    return () => {
      try {
        const w = (typeof window !== "undefined" && window) || {};
        if (w.__rx_canvas_ui__) delete w.__rx_canvas_ui__.onWindowMouseUp;
      } catch {}
    };
  }, []);

  return React.createElement(
    "div",
    { className: "canvas-container canvas-container--editor" },
    React.createElement(
      "div",
      { className: "canvas-toolbar" },
      React.createElement(
        "div",
        { className: "canvas-toolbar-left" },
        React.createElement(
          "button",
          { className: "toolbar-button", disabled: true },
          "💾 Save"
        ),
        React.createElement(
          "button",
          { className: "toolbar-button", disabled: true },
          "📁 Load"
        ),
        React.createElement(
          "button",
          { className: "toolbar-button", disabled: true },
          "↩️ Undo"
        ),
        React.createElement(
          "button",
          { className: "toolbar-button", disabled: true },
          "↪️ Redo"
        )
      ),
      React.createElement(
        "div",
        { className: "canvas-toolbar-center" },
        React.createElement(
          "span",
          { className: "canvas-title" },
          "Canvas (Plugin UI - scaffold)"
        )
      ),
      React.createElement(
        "div",
        { className: "canvas-toolbar-right" },
        React.createElement(
          "button",
          { className: "toolbar-button", disabled: true },
          "🔍 Zoom"
        ),
        React.createElement(
          "button",
          { className: "toolbar-button", disabled: true },
          "⚙️ Settings"
        )
      )
    ),
    React.createElement(
      "div",
      {
        className: "canvas-workspace",
        onPointerUp: () => {
          try {
            const w = (typeof window !== "undefined" && window) || {};
            if (
              w.__rx_canvas_ui__ &&
              typeof w.__rx_canvas_ui__.onWindowMouseUp === "function"
            ) {
              w.__rx_canvas_ui__.onWindowMouseUp();
            }
          } catch {}
        },
        onDragOver: (e) => {
          try {
            e && e.preventDefault && e.preventDefault();
          } catch {}
        },
        onDrop: (e) => {
          try {
            e && e.preventDefault && e.preventDefault();
            const system =
              (window && window.renderxCommunicationSystem) || null;
            const conductor = system && system.conductor;
            if (typeof handleCanvasDrop === "function") {
              handleCanvasDrop(conductor, e, {
                onComponentCreated: (node) => {
                  try {
                    if (!node) return;
                    setNodes((prev) => {
                      const next = Array.isArray(prev) ? prev.slice() : [];
                      next.push(node);
                      return next;
                    });
                  } catch {}
                },
              });
            }
          } catch {}
        },
      },
      React.createElement("div", { className: "canvas-grid" }),
      React.createElement(
        "div",
        { className: "canvas-content" },
        nodes && nodes.length > 0
          ? nodes.map((n) => {
              const el = renderCanvasNode({
                id: n.id || n.elementId,
                cssClass:
                  n.cssClass ||
                  (n.type ? makeRxCompClass(String(n.type).toLowerCase()) : ""),
                type: n.type,
                position: n.position || { x: 0, y: 0 },
                component: n.component || n.componentData,
              });
              let key = n.id || n.elementId || n.cssClass;
              if (!key) return null;
              const elementId = n.id || n.elementId;
              const instanceClass =
                n.cssClass ||
                (n.type ? makeRxCompClass(String(n.type).toLowerCase()) : "");

              const augmentedProps = {
                key,
                ...attachDragHandlers({
                  id: elementId,
                  position: n.position,
                  cssClass: instanceClass,
                }),
              };

              const elementWithKey =
                el && React && typeof React.cloneElement === "function"
                  ? React.cloneElement(el, {
                      ...(el.props || {}),
                      ...augmentedProps,
                    })
                  : el && React && typeof React.createElement === "function"
                  ? (function () {
                      const rawChildren =
                        (el.props && el.props.children) || el.children || [];
                      const childArray = Array.isArray(rawChildren)
                        ? rawChildren
                        : rawChildren != null
                        ? [rawChildren]
                        : [];
                      return React.createElement(
                        el.type,
                        { ...(el.props || {}), ...augmentedProps },
                        ...childArray
                      );
                    })()
                  : el;

              const children = [elementWithKey];
              if (
                selectedId &&
                (n.id === selectedId || n.elementId === selectedId)
              ) {
                const overlayEl = buildOverlayForNode(
                  React,
                  n,
                  key,
                  selectedId
                );
                if (overlayEl) children.push(overlayEl);
              }
              return children;
            })
          : React.createElement(
              "div",
              { className: "canvas-placeholder" },
              React.createElement("h3", null, "Canvas Workspace (Plugin UI)"),
              React.createElement(
                "p",
                null,
                "Drag components from Element Library to add them"
              ),
              React.createElement(
                "p",
                null,
                "This is a scaffold; drop/selection will be added next."
              )
            )
      )
    )
  );
}
