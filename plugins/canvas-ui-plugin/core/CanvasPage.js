import { handleCanvasDrop } from "../handlers/drop.js";
import { makeRxCompClass } from "../utils/idUtils.js";
import {
  overlayInjectGlobalCSS,
  overlayInjectInstanceCSS,
} from "../utils/styles.js";
import { attachDragHandlers } from "../handlers/drag.js";
import { buildOverlayForNode } from "../ui/overlay.js";

export function CanvasPage(props = {}) {
  const providedNodes = Array.isArray(props.nodes) ? props.nodes : null;
  const providedSelected = props.selectedId ?? undefined;
  const React = (typeof window !== "undefined" && window.React) || null;
  if (!React) return null;
  const { useEffect, useState } = React;

  useEffect(() => {
    try {
      const sys = (window && window.renderxCommunicationSystem) || null;
      sys?.logger?.info?.("🎨 Canvas UI Plugin (Scaffold): mounted UI");
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

  const [selectedId, setSelectedId] =
    window.React && typeof window.React.useState === "function"
      ? window.React.useState(providedSelected ?? null)
      : [providedSelected ?? null, function noop() {}];

  useEffect(() => {
    const onSel = (e) => {
      try {
        const id = e && e.detail && e.detail.id;
        setSelectedId(id || null);
      } catch {}
    };
    try {
      window.addEventListener("renderx:selection:update", onSel);
    } catch {}
    return () => {
      try {
        window.removeEventListener("renderx:selection:update", onSel);
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
    const onDragUpdate = (e) => {
      try {
        const d = (e && e.detail) || {};
        if (!d || d.elementId !== selectedId) return;
        const dx = d.delta && typeof d.delta.dx === "number" ? d.delta.dx : 0;
        const dy = d.delta && typeof d.delta.dy === "number" ? d.delta.dy : 0;
        applyOverlayTransform(dx, dy);
      } catch {}
    };
    const onDragEnd = (e) => {
      try {
        const d = (e && e.detail) || {};
        if (!d || d.elementId !== selectedId) return;
        clearOverlayTransform();
      } catch {}
    };
    try {
      window.addEventListener("renderx:drag:update", onDragUpdate);
      window.addEventListener("renderx:drag:end", onDragEnd);
    } catch {}
    return () => {
      try {
        window.removeEventListener("renderx:drag:update", onDragUpdate);
        window.removeEventListener("renderx:drag:end", onDragEnd);
      } catch {}
      clearOverlayTransform();
    };
  }, [selectedId]);

  useEffect(() => {
    const onUp = () => {
      try {
        try {
          const evt = new CustomEvent("renderx:drag:end", { detail: {} });
          window.dispatchEvent(evt);
        } catch {}
        const system = (window && window.renderxCommunicationSystem) || null;
        const conductor = system && system.conductor;
        if (conductor && typeof conductor.play === "function") {
          conductor.play(
            "Canvas.component-drag-symphony",
            "Canvas.component-drag-symphony",
            {
              source: "canvas-ui-plugin:mouseup",
              onDragEnd: () => {
                try {
                  const evt = new CustomEvent("renderx:drag:end", {
                    detail: {},
                  });
                  window.dispatchEvent(evt);
                } catch {}
              },
            }
          );
        }
      } catch {}
    };
    try {
      window.addEventListener("mouseup", onUp);
    } catch {}
    return () => {
      try {
        window.removeEventListener("mouseup", onUp);
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
                    const next = Array.isArray(nodes) ? nodes.slice() : [];
                    next.push(node);
                    setNodes(next);
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
              const el =
                typeof (window && window.renderCanvasNode) === "function"
                  ? window.renderCanvasNode({
                      id: n.id || n.elementId,
                      cssClass:
                        n.cssClass ||
                        (n.type
                          ? makeRxCompClass(String(n.type).toLowerCase())
                          : ""),
                      type: n.type,
                      position: n.position || { x: 0, y: 0 },
                      component: n.component || n.componentData,
                    })
                  : null;
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
