/**
 * Canvas UI Plugin (Scaffold) for RenderX
 * - CIA-compliant sequence/handlers for validator
 * - Exports a minimal React UI component (CanvasPage) using window.React
 * - Safe placeholder that mirrors Canvas DOM structure and classnames
 *
 * Note: Not yet registered in manifest; enabling will replace legacy Canvas via PanelSlot(slot="center").
 */

import { handleCanvasDrop } from "./handlers/drop.js";
import { makeRxCompClass } from "./utils/idUtils.js";
import { parseTemplateShape, resolveTemplateTokens } from "./utils/template.js";
import { injectRawCSS, injectInstanceCSS } from "./utils/styles.js";
import { updateInstancePositionCSS as __updateInstancePositionCSS } from "./styles/instanceCss.js";
import { ensureCursorStylesInjected as __ensureCursorStylesInjected } from "./styles/cursors.js";
import { attachDragHandlers as __attachDragHandlers } from "./handlers/drag.js";
import { buildOverlayForNode as __buildOverlayForNode } from "./ui/overlay.js";
import { renderCanvasNode as __renderCanvasNode } from "./core/renderCanvasNode.js";
const _renderCanvasNode =
  typeof __renderCanvasNode === "function"
    ? __renderCanvasNode
    : function () {
        return null;
      };
import { CanvasPage as __CanvasPage } from "./core/CanvasPage.js";
const _CanvasPage = typeof __CanvasPage === "function" ? __CanvasPage : null;
import {
  sequence as __sequence,
  handlers as __handlers,
} from "./core/sequence.js";
const sequence =
  typeof __sequence === "object"
    ? __sequence
    : {
        id: "Canvas.ui-symphony",
        name: "Canvas UI (Scaffold)",
        description: "Scaffold for Canvas UI plugin (center slot)",
        version: "0.1.0",
        key: "G Major",
        tempo: 120,
        timeSignature: "4/4",
        category: "ui",
        movements: [
          {
            id: "ui",
            name: "UI Lifecycle",
            description: "Minimal UI lifecycle",
            beats: [
              {
                beat: 1,
                event: "canvas-ui:init",
                title: "Init UI",
                handler: "noop",
                dynamics: "p",
                timing: "immediate",
              },
            ],
          },
        ],
        events: { triggers: ["canvas-ui:init"], emits: ["canvas-ui:init"] },
        configuration: {},
      };
const handlers =
  typeof __handlers === "object" ? __handlers : { noop: () => ({}) };

const _buildOverlayForNode =
  typeof __buildOverlayForNode === "function"
    ? __buildOverlayForNode
    : function (React, n, key, selectedId) {
        try {
          const defaults =
            (n.component &&
              n.component.integration &&
              n.component.integration.canvasIntegration) ||
            {};
          try {
            // Delegate to canonical overlay CSS builders
            const { buildOverlayGlobalCssText, buildOverlayInstanceCssText } =
              (function () {
                try {
                  return require && require("./constants/overlayCss.js");
                } catch {}
                try {
                  return window && window.renderxOverlayCssBuilders;
                } catch {}
                return {};
              })();
            // Global CSS
            try {
              const gid = "overlay-css-global";
              if (!document.getElementById(gid)) {
                const css =
                  typeof buildOverlayGlobalCssText === "function"
                    ? buildOverlayGlobalCssText()
                    : [
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
                tag.id = gid;
                tag.textContent = css;
                document.head.appendChild(tag);
              }
            } catch {}
            // Instance CSS
            try {
              const id = "overlay-css-" + String(n.id || n.elementId || "");
              if (!document.getElementById(id)) {
                const defaults =
                  (n.component &&
                    n.component.integration &&
                    n.component.integration.canvasIntegration) ||
                  {};
                const css =
                  typeof buildOverlayInstanceCssText === "function"
                    ? buildOverlayInstanceCssText(
                        n,
                        defaults.defaultWidth,
                        defaults.defaultHeight
                      )
                    : (function () {
                        const left =
                          (n.position && n.position.x) != null
                            ? n.position.x
                            : 0;
                        const top =
                          (n.position && n.position.y) != null
                            ? n.position.y
                            : 0;
                        const w =
                          typeof defaults.defaultWidth === "number"
                            ? defaults.defaultWidth + "px"
                            : defaults.defaultWidth || "auto";
                        const h =
                          typeof defaults.defaultHeight === "number"
                            ? defaults.defaultHeight + "px"
                            : defaults.defaultHeight || "auto";
                        const cls =
                          "rx-overlay-" + String(n.id || n.elementId || "");
                        return `.${cls}{position:absolute;left:${left}px;top:${top}px;width:${w};height:${h};z-index:10;}`;
                      })();
                const tag = document.createElement("style");
                tag.id = id;
                tag.textContent = css;
                document.head.appendChild(tag);
              }
            } catch {}
          } catch {}
        } catch {}
        const overlayClass = `rx-resize-overlay rx-overlay-${
          n.id || n.elementId
        }`;
        const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
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
                  const system =
                    (window && window.renderxCommunicationSystem) || null;
                  const conductor = system && system.conductor;
                  if (conductor && typeof conductor.play === "function") {
                    conductor.play(
                      "Canvas.component-resize-symphony",
                      "Canvas.component-resize-symphony",
                      {
                        elementId: n.id || n.elementId,
                        handle: h,
                        start: { x: e.clientX, y: e.clientY },
                      }
                    );
                  }
                } catch {}
              },
            })
          )
        );
      };

import { onElementClick } from "./handlers/select.js";

const _attachDragHandlers =
  typeof __attachDragHandlers === "function"
    ? __attachDragHandlers
    : function (node, deps = {}) {
        const updater =
          typeof deps.updateInstancePositionCSS === "function"
            ? deps.updateInstancePositionCSS
            : function (id, cls, x, y) {
                try {
                  const tagId = "component-instance-css-" + String(id || "");
                  let tag = document.getElementById(tagId);
                  let widthDecl = "";
                  let heightDecl = "";
                  if (tag && tag.textContent) {
                    const text = tag.textContent;
                    const w = text.match(
                      new RegExp(
                        `\\.${cls}\\s*\\{[^}]*width\\s*:\\s*([^;]+);`,
                        "i"
                      )
                    );
                    const h = text.match(
                      new RegExp(
                        `\\.${cls}\\s*\\{[^}]*height\\s*:\\s*([^;]+);`,
                        "i"
                      )
                    );
                    widthDecl = w ? `.${cls}{width:${w[1].trim()};}` : "";
                    heightDecl = h ? `.${cls}{height:${h[1].trim()};}` : "";
                  }
                  const lines = [
                    `.${cls}{position:absolute;left:${Math.round(
                      x
                    )}px;top:${Math.round(
                      y
                    )}px;box-sizing:border-box;display:block;}`,
                    widthDecl,
                    heightDecl,
                  ].filter(Boolean);
                  if (!tag) {
                    tag = document.createElement("style");
                    tag.id = tagId;
                    document.head.appendChild(tag);
                  }
                  tag.textContent = lines.join("\n");
                } catch {}
              };

        const getStartPos = () => ({
          x: (node && node.position && node.position.x) || 0,
          y: (node && node.position && node.position.y) || 0,
        });

        const play = (id, payload) => {
          try {
            const system =
              (window && window.renderxCommunicationSystem) || null;
            const conductor = system && system.conductor;
            if (conductor && typeof conductor.play === "function") {
              conductor.play(id, id, payload);
            }
          } catch {}
        };

        return {
          onPointerDown: (e) => {
            try {
              e && e.stopPropagation && e.stopPropagation();
              try {
                e.currentTarget &&
                  e.currentTarget.classList &&
                  e.currentTarget.classList.add("rx-comp-grabbing");
              } catch {}
              try {
                e.target &&
                  e.target.setPointerCapture &&
                  e.target.setPointerCapture(e.pointerId);
              } catch {}
              const origin = { x: e.clientX || 0, y: e.clientY || 0 };
              try {
                const w = (typeof window !== "undefined" && window) || {};
                w.__rx_drag = w.__rx_drag || {};
                w.__rx_drag[node.id] = {
                  origin,
                  start: getStartPos(),
                  active: true,
                };
              } catch {}
              play("Canvas.component-drag-symphony", {
                elementId: node.id,
                origin,
              });
            } catch {}
          },

          onPointerMove: (e) => {
            try {
              try {
                e.currentTarget &&
                  e.currentTarget.classList &&
                  e.currentTarget.classList.add("rx-comp-grabbing");
              } catch {}
              const cur = { x: e.clientX || 0, y: e.clientY || 0 };
              let origin = { x: 0, y: 0 };
              let startPos = { x: 0, y: 0 };
              let active = false;
              try {
                const w = (typeof window !== "undefined" && window) || {};
                const rec = (w.__rx_drag && w.__rx_drag[node.id]) || null;
                if (rec) {
                  origin = rec.origin || origin;
                  startPos = rec.start || startPos;
                  active = !!rec.active;
                }
              } catch {}
              if (!active) return;
              const delta = {
                dx: (cur.x || 0) - (origin.x || 0),
                dy: (cur.y || 0) - (origin.y || 0),
              };
              const newPos = {
                x: (startPos.x || 0) + delta.dx,
                y: (startPos.y || 0) + delta.dy,
              };
              const system =
                (window && window.renderxCommunicationSystem) || null;
              const conductor = system && system.conductor;
              const onDragUpdate = ({ elementId: id }) => {
                try {
                  updater(
                    id,
                    String(node.cssClass || node.id || ""),
                    newPos.x,
                    newPos.y
                  );
                  if (typeof deps.setNodes === "function") {
                    deps.setNodes((prev) => {
                      try {
                        const arr = Array.isArray(prev) ? prev.slice() : [];
                        const idx = arr.findIndex(
                          (x) => (x.id || x.elementId) === id
                        );
                        if (idx >= 0)
                          arr[idx] = {
                            ...arr[idx],
                            position: { x: newPos.x, y: newPos.y },
                          };
                        return arr;
                      } catch {
                        return prev;
                      }
                    });
                  }
                } catch {}
              };
              if (conductor && typeof conductor.play === "function") {
                conductor.play(
                  "Canvas.component-drag-symphony",
                  "Canvas.component-drag-symphony",
                  { elementId: node.id, delta, onDragUpdate }
                );
              } else {
                updater(
                  node.id,
                  String(node.cssClass || node.id || ""),
                  newPos.x,
                  newPos.y
                );
              }
            } catch {}
          },

          onPointerUp: (e) => {
            try {
              try {
                e.currentTarget &&
                  e.currentTarget.classList &&
                  e.currentTarget.classList.remove("rx-comp-grabbing");
              } catch {}
              try {
                e.target &&
                  e.target.releasePointerCapture &&
                  e.target.releasePointerCapture(e.pointerId);
              } catch {}
              try {
                const w = (typeof window !== "undefined" && window) || {};
                if (w.__rx_drag && w.__rx_drag[node.id])
                  w.__rx_drag[node.id].active = false;
              } catch {}
              play("Canvas.component-drag-symphony", {
                elementId: node.id,
                end: true,
              });
            } catch {}
          },
        };
      };

// Wrappers to support both browser ESM (imports available) and unit tests (imports stripped)
const _injectRawCSS =
  typeof injectRawCSS === "function"
    ? injectRawCSS
    : function (css) {
        try {
          if (!css) return;
          const id = "component-css-" + btoa(css).substring(0, 10);
          if (document.getElementById(id)) return;
          const tag = document.createElement("style");
          tag.id = id;
          tag.textContent = css;
          document.head.appendChild(tag);
        } catch {}
      };

const _parseTemplateShape =
  typeof parseTemplateShape === "function"
    ? parseTemplateShape
    : function (template) {
        try {
          const tagMatch = template && template.match(/<\s*([a-zA-Z0-9-]+)/);
          const tag = (tagMatch ? tagMatch[1] : "div").toLowerCase();
          const classMatch =
            template && template.match(/class\s*=\s*"([^"]*)"/);
          const classes = classMatch
            ? classMatch[1].split(/\s+/).filter(Boolean)
            : [];
          return { tag, classes };
        } catch {
          return { tag: "div", classes: [] };
        }
      };

const _resolveTemplateTokens =
  typeof resolveTemplateTokens === "function"
    ? resolveTemplateTokens
    : function (str, vars) {
        try {
          if (!str) return str;
          return String(str).replace(
            /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
            function (_m, key) {
              return vars && vars[key] != null ? String(vars[key]) : "";
            }
          );
        } catch {
          return str;
        }
      };

const _injectInstanceCSS =
  typeof injectInstanceCSS === "function"
    ? injectInstanceCSS
    : function (node, width, height) {
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
              `.${cls}{width:${
                typeof width === "number" ? width + "px" : width
              };}`
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
      };

// Expose canonical overlay CSS builders for loader fallbacks
try {
  if (typeof window !== "undefined") {
    window.renderxOverlayCssBuilders =
      window.renderxOverlayCssBuilders ||
      (function () {
        try {
          // this will be stripped in tests, but fallback above will read from this global if provided
          const mod = require && require("./constants/overlayCss.js");
          return mod || {};
        } catch {}
        return {};
      })();
  }
} catch {}

export const sequence = sequence;
export const handlers = handlers;

// New export: renderCanvasNode — produce a pure element for a created node
export function renderCanvasNode(node) {
  try {
    if (typeof __renderCanvasNode === "function") {
      const el = __renderCanvasNode(node);
      if (el) return el;
    }
  } catch {}

  const component = node.component || node.componentData || {};
  const template = (component.ui && component.ui.template) || "<div></div>";
  const stylesCss =
    component.ui && component.ui.styles && component.ui.styles.css;

  // Inject CSS once
  _injectRawCSS(stylesCss);

  // Determine tag and base classes from template
  const shape = _parseTemplateShape(template);
  const tagName = shape.tag || node.type || "div";

  // Compose className: instance cssClass + resolved template classes
  const vars = {
    variant:
      (node && node.variant) ||
      (component && component.metadata && component.metadata.variant) ||
      "primary",
    size:
      (node && node.size) ||
      (component && component.metadata && component.metadata.size) ||
      "md",
  };
  const resolvedTemplateClasses = shape.classes.map((c) =>
    _resolveTemplateTokens(c, vars)
  );
  const classes = [
    String(node.cssClass || node.id || ""),
    ...resolvedTemplateClasses,
  ]
    .filter(Boolean)
    .join(" ");

  // Dimensions from canvas integration
  const defaults =
    (component.integration && component.integration.canvasIntegration) || {};
  const width = defaults.defaultWidth;
  const height = defaults.defaultHeight;

  // Inject per-instance CSS for layout (no inline styles)
  _injectInstanceCSS(node, width, height);

  // Helper for drag: update instance CSS position for this element (delegated)
  const updateInstancePositionCSS = (id, cls, x, y) => {
    try {
      if (typeof __updateInstancePositionCSS === "function") {
        __updateInstancePositionCSS(id, cls, x, y);
        return;
      }
    } catch {}
    try {
      // Fallback inline implementation (should be replaced by styles/instanceCss)
      const tagId = "component-instance-css-" + String(id || "");
      let tag = document.getElementById(tagId);
      let widthDecl = "";
      let heightDecl = "";
      if (tag && tag.textContent) {
        const text = tag.textContent;
        const w = text.match(
          new RegExp(`\\.${cls}\\s*\\{[^}]*width\\s*:\\s*([^;]+);`, "i")
        );
        const h = text.match(
          new RegExp(`\\.${cls}\\s*\\{[^}]*height\\s*:\\s*([^;]+);`, "i")
        );
        widthDecl = w ? `.${cls}{width:${w[1].trim()};}` : "";
        heightDecl = h ? `.${cls}{height:${h[1].trim()};}` : "";
      }
      const lines = [
        `.${cls}{position:absolute;left:${Math.round(x)}px;top:${Math.round(
          y
        )}px;box-sizing:border-box;display:block;}`,
        widthDecl,
        heightDecl,
      ].filter(Boolean);
      if (!tag) {
        tag = document.createElement("style");
        tag.id = tagId;
        document.head.appendChild(tag);
      }
      tag.textContent = lines.join("\n");
    } catch {}
  };

  // Pointer drag UX: cursor styles (delegated)
  try {
    if (typeof __ensureCursorStylesInjected === "function") {
      __ensureCursorStylesInjected();
    } else {
      // Fallback inline injector
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
    }
  } catch {}

  // Memoized transparent drag image to suppress native ghost preview
  const getTransparentDragImage = () => {
    try {
      const w = (typeof window !== "undefined" && window) || {};
      if (w.__rx_transparent_drag_img) return w.__rx_transparent_drag_img;
      const img = new Image();
      // 1x1 transparent pixel
      img.src =
        "data:image/gif;base64,R0lGODlhAQABAIABAP///wAAACwAAAAAAQABAAACAkQBADs=";
      w.__rx_transparent_drag_img = img;
      return img;
    } catch {
      return null;
    }
  };

  const dragHandlers = _attachDragHandlers(node);
  const props = {
    id: node.id,
    className: classes,
    "data-component-id": node.id,
    onPointerDown: dragHandlers.onPointerDown,
    onPointerMove: dragHandlers.onPointerMove,
    onPointerUp: dragHandlers.onPointerUp,
    onClick:
      typeof onElementClick === "function"
        ? onElementClick(node)
        : function (e) {
            try {
              e && e.stopPropagation && e.stopPropagation();
              const system =
                (window && window.renderxCommunicationSystem) || null;
              const conductor = system && system.conductor;
              if (conductor && typeof conductor.play === "function") {
                conductor.play(
                  "Canvas.component-select-symphony",
                  "Canvas.component-select-symphony",
                  {
                    elementId: node.id,
                    onSelectionChange: (id) => {
                      try {
                        const evt = new CustomEvent(
                          "renderx:selection:update",
                          {
                            detail: { id },
                          }
                        );
                        window.dispatchEvent(evt);
                      } catch {}
                    },
                  }
                );
              }
            } catch {}
          },
  };

  // Content: replace {{content}} with metadata.name if present
  const name =
    (component.metadata &&
      (component.metadata.name || component.metadata.type)) ||
    "";
  const text = String(template).includes("{{content}}")
    ? String(name || "")
    : undefined;

  // Void tags cannot have children
  const voidTags = new Set([
    "input",
    "img",
    "br",
    "hr",
    "meta",
    "link",
    "area",
    "base",
    "col",
    "embed",
    "source",
    "track",
    "wbr",
  ]);
  if (voidTags.has(tagName)) {
    return React.createElement(tagName, props);
  }
  return React.createElement(tagName, props, text);
}

// UI export: CanvasPage
// Uses window.React to remain decoupled from app build
export function CanvasPage(props = {}) {
  if (_CanvasPage) return _CanvasPage(props);
  const providedNodes = Array.isArray(props.nodes) ? props.nodes : null;
  const providedSelected = props.selectedId ?? undefined;
  const React = (window && window.React) || null;
  if (!React) return null;
  const { useEffect, useState } = React;

  // Dev hint via logger when mounted; wait until the plugin is mounted before calling play
  useEffect(() => {
    const pluginName = "Canvas UI Plugin";
    try {
      const sys = (window && window.renderxCommunicationSystem) || null;
      sys?.logger?.info?.("🎨 Canvas UI Plugin (Scaffold): mounted UI");
    } catch {}
    const tryStart = () => {
      try {
        const system = (window && window.renderxCommunicationSystem) || null;
        const conductor = system && system.conductor;
        if (!conductor) return setTimeout(tryStart, 120);
        // Avoid duplicate runs under StrictMode
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

  // Render a safe placeholder that mirrors existing Canvas DOM structure
  // Local state for created nodes (scaffold render)
  const [nodes, setNodes] =
    window.React && typeof window.React.useState === "function"
      ? window.React.useState(providedNodes || [])
      : [providedNodes || [], function noop() {}];

  // Selection state for overlay
  const [selectedId, setSelectedId] =
    window.React && typeof window.React.useState === "function"
      ? window.React.useState(providedSelected ?? null)
      : [providedSelected ?? null, function noop() {}];

  // Listen for selection updates from renderCanvasNode onClick handler
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

  // While dragging, keep the selection overlay visually in sync by applying a temporary transform.
  // On drag end, clear the transform so overlay re-anchors to absolute left/top.
  useEffect(() => {
    // Helper: apply or update transform style tag for current selectedId
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
        const styleId = `overlay-transform-${selectedId}`;
        const tag = document.getElementById(styleId);
        if (tag && tag.parentNode) tag.parentNode.removeChild(tag);
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

  // On mouseup: signal drag end via drag symphony; also dispatch a UI event
  useEffect(() => {
    const onUp = (e) => {
      try {
        // Immediately notify UI listeners that drag ended
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
                typeof renderCanvasNode === "function"
                  ? renderCanvasNode({
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
              // Ensure a stable key to satisfy React list rendering
              let key = n.id || n.elementId || n.cssClass;
              if (!key) {
                // Skip rendering nodes without a stable key (id/elementId/cssClass)
                return null;
              }
              // Augment element with drag handlers and stable key
              const elementId = n.id || n.elementId;
              const instanceClass =
                n.cssClass ||
                (n.type ? makeRxCompClass(String(n.type).toLowerCase()) : "");

              const augmentedProps = {
                key,
                ..._attachDragHandlers({
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

              // If selected, render overlay sibling after the element
              const children = [elementWithKey];
              if (
                selectedId &&
                (n.id === selectedId || n.elementId === selectedId)
              ) {
                const overlayEl = _buildOverlayForNode(
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
