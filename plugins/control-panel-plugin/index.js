/**
 * Minimal CIA exports to satisfy plugin registration
 */
export const sequence = {
  id: "ControlPanel.ui-symphony",
  name: "Control Panel UI (No-Op)",
  description: "UI-only plugin for right panel; no orchestration",
  version: "1.0.0",
  key: "F Major",
  tempo: 120,
  timeSignature: "4/4",
  category: "ui",
  movements: [
    {
      id: "ui",
      name: "UI Lifecycle",
      description: "Minimal movement to satisfy plugin validator",
      beats: [
        {
          beat: 1,
          event: "control-panel:init",
          title: "Initialize Control Panel UI",
          handler: "noop",
          dynamics: "p",
          timing: "immediate",
        },
      ],
    },
  ],
  events: { triggers: ["control-panel:init"], emits: ["control-panel:init"] },
  configuration: {},
};

export const handlers = {
  noop: () => ({}),
};

/**
 * Control Panel UI Plugin for RenderX (right slot)
 * Provides a basic properties panel driven by Conductor selection state
 */

export function ControlPanelPanel(props = {}) {
  const React = (window && window.React) || null;
  if (!React) return null;
  const { useEffect, useState } = React;

  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const onSelection = (e) => {
      try {
        const id = (e && e.detail && e.detail.id) || null;
        setSelectedId(id);
      } catch {}
    };
    window.addEventListener("renderx:selection:update", onSelection);
    return () =>
      window.removeEventListener("renderx:selection:update", onSelection);
  }, []);

  return React.createElement(
    "div",
    { className: "control-panel" },
    React.createElement(
      "div",
      { className: "control-panel-header" },
      React.createElement("h3", null, "Properties")
    ),
    React.createElement(
      "div",
      { className: "control-panel-content" },
      selectedId
        ? React.createElement(
            React.Fragment,
            null,
            React.createElement(
              "div",
              { className: "property-section" },
              React.createElement("h4", null, "Selection"),
              React.createElement(
                "div",
                { className: "property-group" },
                React.createElement(
                  "div",
                  { className: "property-row" },
                  React.createElement("label", null, "Selected Id:"),
                  React.createElement("input", {
                    type: "text",
                    value: selectedId,
                    readOnly: true,
                  })
                )
              )
            ),
            React.createElement(
              "div",
              { className: "property-section" },
              React.createElement("h4", null, "Position"),
              React.createElement(
                "div",
                { className: "property-group" },
                React.createElement(
                  "label",
                  null,
                  "X: ",
                  React.createElement("input", {
                    type: "number",
                    placeholder: "0",
                    disabled: true,
                  })
                ),
                React.createElement(
                  "label",
                  null,
                  "Y: ",
                  React.createElement("input", {
                    type: "number",
                    placeholder: "0",
                    disabled: true,
                  })
                )
              )
            ),
            React.createElement(
              "div",
              { className: "property-section" },
              React.createElement("h4", null, "Size"),
              React.createElement(
                "div",
                { className: "property-group" },
                React.createElement(
                  "label",
                  null,
                  "Width: ",
                  React.createElement("input", {
                    type: "number",
                    placeholder: "100",
                    disabled: true,
                  })
                ),
                React.createElement(
                  "label",
                  null,
                  "Height: ",
                  React.createElement("input", {
                    type: "number",
                    placeholder: "50",
                    disabled: true,
                  })
                )
              )
            )
          )
        : React.createElement(
            "div",
            { className: "property-section" },
            React.createElement("p", null, "No selection")
          )
    )
  );
}
