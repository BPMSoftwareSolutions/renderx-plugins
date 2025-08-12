/**
 * Component Library Plugin for MusicalConductor (RenderX)
 */

export const sequence = {
  id: "load-components-symphony",
  name: "Component Library Loading Symphony No. 2",
  description:
    "Orchestrates loading and validation of component definitions from JSON sources",
  version: "1.0.0",
  key: "D Major",
  tempo: 140,
  timeSignature: "4/4",
  category: "data-operations",
  movements: [
    {
      id: "component-loading",
      name: "Component Loading Moderato",
      description: "Load, validate, and prepare component definitions",
      beats: [
        {
          beat: 1,
          event: "components:fetch:start",
          title: "Component Fetch",
          handler: "fetchComponentDefinitions",
          dynamics: "forte",
          timing: "immediate",
        },
        {
          beat: 2,
          event: "components:validation:start",
          title: "Component Validation",
          handler: "validateComponents",
          dynamics: "mezzo-forte",
          timing: "synchronized",
        },
        {
          beat: 3,
          event: "components:preparation:start",
          title: "Component Preparation",
          handler: "prepareComponents",
          dynamics: "mezzo-forte",
          timing: "synchronized",
        },
        {
          beat: 4,
          event: "components:notification:start",
          title: "Component Notification",
          handler: "notifyComponentsLoaded",
          dynamics: "forte",
          timing: "delayed",
        },
      ],
    },
  ],
  events: {
    triggers: ["components:load:request"],
    emits: [
      "components:fetch:start",
      "components:validation:start",
      "components:preparation:start",
      "components:notification:start",
      "components:load:complete",
    ],
  },
  configuration: {
    // Relax required fields to align with RenderX JSON structure
    // RenderX json-components have metadata.{name,type,icon?} and no top-level id
    requiredFields: ["metadata.name", "metadata.type"],
    maxComponents: 100,
    enableValidation: true,
    sortBy: "name",
    filterCategories: ["basic", "ui-components", "layout", "forms"],
  },
};

export const handlers = {
  fetchComponentDefinitions: async (data, context) => {
    // Load from RenderX public JSON components
    try {
      const response = await fetch("/json-components/index.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const index = await response.json();
      const components = [];
      for (const filename of index.components || []) {
        const res = await fetch(`/json-components/${filename}`);
        if (res.ok) components.push(await res.json());
      }
      context.logger.info(
        `📥 Component Library Plugin: fetched ${components.length} components from index.json`
      );
      return { components, loaded: true };
    } catch (e) {
      context.logger.warn(
        "⚠️ Falling back to empty component set:",
        e?.message
      );
      return { components: [], loaded: true };
    }
  },

  validateComponents: (data, context) => {
    const { components } = context.payload;
    // Support both direct access and context-provided configuration
    const cfg =
      (context && context.sequence && context.sequence.configuration) ||
      (data && data.sequence && data.sequence.configuration) ||
      {};
    const {
      requiredFields = ["metadata.name", "metadata.type"],
      maxComponents = 100,
      enableValidation = true,
    } = cfg;

    if (!enableValidation) {
      return {
        validComponents: components,
        validationPassed: true,
        skipped: true,
      };
    }
    const hasField = (obj, path) => {
      try {
        return (
          path
            .split(".")
            .reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj) !=
          null
        );
      } catch {
        return false;
      }
    };

    const validComponents = (components || [])
      .filter((c) => requiredFields.every((f) => hasField(c, f)))
      .slice(0, maxComponents);
    context.logger.info(
      `🧪 Component Library Plugin: validation passed for ${
        validComponents.length
      }/${(components || []).length}`
    );
    return {
      validComponents,
      validationPassed: true,
      filtered: (components || []).length - validComponents.length,
    };
  },

  prepareComponents: (data, context) => {
    const { validComponents } = context.payload;
    const { sortBy } = context.sequence.configuration;
    const pickName = (c) => c?.metadata?.name || c?.name || "";
    const pickType = (c) => c?.metadata?.type || c?.type || "";
    const preparedComponents = [...(validComponents || [])].sort((a, b) => {
      if (sortBy === "name") return pickName(a).localeCompare(pickName(b));
      if (sortBy === "type") return pickType(a).localeCompare(pickType(b));
      return 0;
    });
    context.logger.info(
      `📦 Component Library Plugin: prepared ${preparedComponents.length} components`
    );
    return { preparedComponents, prepared: true };
  },

  notifyComponentsLoaded: (data, context) => {
    const { preparedComponents } = context.payload;
    if (context.onComponentsLoaded) {
      try {
        context.onComponentsLoaded(preparedComponents);
      } catch {}
    }
    return { notified: true, count: (preparedComponents || []).length };
  },
};

// UI Component: LibraryPanel - renders the Element Library UI from the plugin
// Note: Uses window.React to avoid build-time coupling; RenderX sets it in main.tsx
export function LibraryPanel(props = {}) {
  const React = (window && window.React) || null;
  if (!React) return null;
  const { useState, useEffect, useMemo } = React;
  const { onDragStart, onDragEnd } = props;

  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Kick off plugin-driven component load and subscriptions (StrictMode + mount-order safe)
  useEffect(() => {
    let cancelled = false;

    const startWhenReady = () => {
      const system = (window && window.renderxCommunicationSystem) || null;
      if (!system || !system.conductor) {
        // Conductor not ready yet — retry shortly without surfacing an error
        if (!cancelled) setTimeout(startWhenReady, 100);
        return;
      }

      const { conductor } = system;

      // Rely exclusively on play() onComponentsLoaded callback; no event subscriptions needed here
      const tryStart = () => {
        if (cancelled) return;
        try {
          if ((window && window.__rx_library_played__) === true) return;
          const names = Array.isArray(conductor.getMountedPlugins?.())
            ? conductor.getMountedPlugins()
            : [];
          const ids = Array.isArray(conductor.getMountedPluginIds?.())
            ? conductor.getMountedPluginIds()
            : [];
          const pluginReady =
            (names.includes && names.includes("Component Library Plugin")) ||
            (ids.includes && ids.includes("load-components-symphony"));

          if (pluginReady) {
            window.__rx_library_played__ = true;
            conductor.play(
              "load-components-symphony",
              "load-components-symphony",
              {
                source: "json-components",
                onComponentsLoaded: (items) => {
                  if (cancelled) return;
                  setComponents(items || []);
                  setLoading(false);
                  setError(null);
                },
              }
            );
          } else {
            setTimeout(tryStart, 100);
          }
        } catch (e) {
          setTimeout(tryStart, 150);
        }
      };

      tryStart();
    };

    startWhenReady();

    return () => {
      cancelled = true;
    };
  }, []);

  // Helpers
  const getComponentId = (c) =>
    c.id ||
    `${(c.metadata && c.metadata.type) || "unknown"}:${
      (c.metadata && c.metadata.name) || ""
    }`;

  const createComponentPreviewHTML = (component) => {
    const ui = component && component.ui;
    const tpl = (ui && ui.template) || null;
    if (!tpl)
      return `<span class="component-preview-fallback">${
        component?.metadata?.name || "Unnamed"
      }</span>`;
    let template = String(tpl);
    // strip inline handlers
    template = template.replace(/on\w+="[^"]*"/g, "");
    // simple placeholder defaults
    const compType = (component?.metadata?.type || "").toLowerCase();
    const variantDefault = compType === "button" ? "primary" : "default";
    const contentDefault =
      component?.metadata?.name || (compType === "button" ? "Button" : "");
    template = template
      .replace(/\{\{\s*variant\s*\}\}/g, variantDefault)
      .replace(/\{\{\s*size\s*\}\}/g, "medium")
      .replace(/\{\{\s*inputType\s*\}\}/g, "text")
      .replace(/\{\{\s*placeholder\s*\}\}/g, "Enter text")
      .replace(/\{\{\s*value\s*\}\}/g, "")
      .replace(/\{\{\s*content\s*\}\}/g, contentDefault)
      .replace(/\{\{#if\s+disabled\}\}\s*disabled\s*\{\{\/if\}\}/g, "")
      .replace(/\{\{#if\s+required\}\}\s*required\s*\{\{\/if\}\}/g, "");
    return template;
  };

  const grouped = useMemo(() => {
    const cat = {};
    (components || []).forEach((c) => {
      const k = (c.metadata && c.metadata.category) || "uncategorized";
      if (!cat[k]) cat[k] = [];
      cat[k].push(c);
    });
    return cat;
  }, [components]);

  const getComponentStyles = (component) => {
    const ui = component && component.ui;
    const css = ui && ui.styles && ui.styles.css;
    if (!css) return "";
    const componentId = getComponentId(component);
    // Scope the styles to the preview container to avoid conflicts
    try {
      return css.replace(
        /(\.[a-zA-Z-_][a-zA-Z0-9-_]*)/g,
        `.element-item[data-component-id="${componentId}"] $1`
      );
    } catch {
      return css;
    }
  };

  const renderItem = (component, idx) => {
    const id = getComponentId(component);
    const onItemDragStart = (e) => {
      try {
        // Drag data expected by Canvas/Drop plugin
        const dragData = {
          type: "component",
          componentType: component?.metadata?.type,
          name: component?.metadata?.name,
          metadata: component?.metadata,
          componentData: component,
          source: "element-library",
        };
        e.dataTransfer.setData("application/json", JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = "copy";

        // Call drag start symphony
        const cs = (window && window.renderxCommunicationSystem) || null;
        cs &&
          cs.conductor &&
          cs.conductor.play(
            "Library.component-drag-symphony",
            "Library.component-drag-symphony",
            {
              event: e,
              component,
              dragData,
              timestamp: Date.now(),
              source: "element-library",
            }
          );

        // Drag image: ONLY the component preview element (no wrapper)
        const previewHTML = createComponentPreviewHTML(component);
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.top = "-10000px";
        container.style.left = "-10000px";
        container.style.pointerEvents = "none";
        container.innerHTML = previewHTML;
        const node = container.firstElementChild || container;
        document.body.appendChild(container);
        const rect = (node.getBoundingClientRect &&
          node.getBoundingClientRect()) || { width: 32, height: 20 };
        e.dataTransfer.setDragImage(
          node,
          Math.round(rect.width / 2),
          Math.round(rect.height / 2)
        );
        setTimeout(() => {
          if (container.parentNode) container.parentNode.removeChild(container);
        }, 0);

        if (typeof onDragStart === "function") onDragStart(e, component);
      } catch {}
    };

    const onItemDragEnd = (e) => {
      try {
        const cs = (window && window.renderxCommunicationSystem) || null;
        cs &&
          cs.conductor &&
          cs.conductor.play(
            "Library.component-drag-symphony",
            "Library.component-drag-symphony",
            { event: e, timestamp: Date.now(), source: "element-library" }
          );
      } catch {}
      if (typeof onDragEnd === "function") onDragEnd(e, component);
    };

    // Item element
    return React.createElement(
      "div",
      {
        key: id + ":" + idx,
        className: "element-item",
        draggable: true,
        onDragStart: onItemDragStart,
        onDragEnd: onItemDragEnd,
        title: `${component?.metadata?.description || ""}`,
        "data-component": (component?.metadata?.type || "").toLowerCase(),
        "data-component-id": id,
      },
      React.createElement(
        "div",
        { className: "element-header" },
        React.createElement("span", { className: "element-icon" }, "🧩"),
        React.createElement(
          "span",
          { className: "element-name" },
          component?.metadata?.name || "Unnamed"
        ),
        React.createElement(
          "span",
          { className: "element-type" },
          `(${component?.metadata?.type || ""})`
        )
      ),
      React.createElement("div", {
        className: "component-preview-container",
        dangerouslySetInnerHTML: {
          __html: createComponentPreviewHTML(component),
        },
      })
    );
  };

  // Render
  return React.createElement(
    "div",
    { className: "element-library" },
    React.createElement(
      "div",
      { className: "element-library-header" },
      React.createElement(
        "h3",
        null,
        "Element Library",
        React.createElement(
          "span",
          { className: "component-count", title: "Loaded components" },
          components && components.length > 0 ? ` (${components.length})` : ""
        )
      ),
      loading &&
        React.createElement(
          "div",
          { className: "loading-indicator" },
          "Loading..."
        ),
      error &&
        React.createElement(
          "div",
          { className: "error-indicator" },
          `Error: ${error}`
        )
    ),
    React.createElement(
      "div",
      { className: "element-library-content" },
      loading
        ? React.createElement(
            "div",
            { className: "element-library-loading" },
            React.createElement(
              "div",
              { className: "loading-state" },
              React.createElement("h4", null, "Loading Components..."),
              React.createElement("p", null, "Scanning json-components folder")
            )
          )
        : error
        ? React.createElement(
            "div",
            { className: "element-library-error" },
            React.createElement(
              "div",
              { className: "error-state" },
              React.createElement("h4", null, "Failed to Load Components"),
              React.createElement("p", null, String(error))
            )
          )
        : !components || components.length === 0
        ? React.createElement(
            "div",
            { className: "element-library-empty" },
            React.createElement(
              "div",
              { className: "empty-state" },
              React.createElement("h4", null, "No Components Found"),
              React.createElement(
                "p",
                null,
                "No JSON components found in public/json-components/"
              ),
              React.createElement(
                "p",
                null,
                "Add .json component files to see them here."
              )
            )
          )
        : React.createElement(
            React.Fragment,
            null,
            // Inject component styles for previews
            React.createElement(
              "style",
              null,
              [
                (components || [])
                  .map((component) => getComponentStyles(component))
                  .join("\n"),
                `
                .element-item .component-preview-container {
                  margin: 4px 0;
                  padding: 4px;
                  border: 1px solid #e0e0e0;
                  border-radius: 3px;
                  background: #f9f9f9;
                  min-height: 24px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                  overflow: hidden;
                }
                .element-item .component-preview {
                  transform: scale(0.8);
                  transform-origin: center;
                  pointer-events: none;
                }
                .element-item .component-preview-fallback {
                  color: #666;
                  font-style: italic;
                }
                `,
              ].join("\n")
            ),
            Object.entries(grouped).map(([category, items]) =>
              React.createElement(
                "div",
                { key: category, className: "element-category" },
                React.createElement(
                  "h4",
                  null,
                  category.charAt(0).toUpperCase() + category.slice(1)
                ),
                React.createElement(
                  "div",
                  { className: "element-list" },
                  items.map((c, idx) => renderItem(c, idx))
                )
              )
            )
          )
    )
  );
}
