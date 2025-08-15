/**
 * Header Left Plugin - Branding / Status
 */

export function HeaderLeft(props = {}) {
  const React = (typeof window !== "undefined" && window.React) || null;
  if (!React) return null;
  const { hasUnsavedChanges } = props || {};

  return React.createElement(
    "div",
    { className: "rx-comp-header-brand__ijkl" },
    // Scoped styles for brand block
    React.createElement(
      "style",
      null,
      [
        ".rx-comp-header-brand__ijkl{display:flex;flex-direction:column;line-height:1;}",
        ".rx-comp-header-brand__ijkl h1{margin:0 0 2px 0;font-size:16px;font-weight:600;color:var(--rx-primary,#0d6efd);}",
        ".rx-comp-header-brand__ijkl p{margin:0;font-size:11px;color:var(--rx-muted,#6c757d);}",
        ".rx-comp-unsaved__dot1{margin-top:4px;color:#cc3300;font-size:12px;}",
      ].join("\n")
    ),
    React.createElement("h1", null, "RenderX Evolution"),
    React.createElement("p", null, "Lightweight Visual Shell"),
    hasUnsavedChanges
      ? React.createElement(
          "span",
          { className: "rx-comp-unsaved__dot1" },
          "\u25CF Unsaved changes"
        )
      : null
  );
}
