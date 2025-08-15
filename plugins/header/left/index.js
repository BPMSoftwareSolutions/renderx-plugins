/**
 * Header Left Plugin - Branding / Status
 */

export function HeaderLeft(props = {}) {
  const React = (typeof window !== "undefined" && (window).React) || null;
  if (!React) return null;
  const { hasUnsavedChanges } = props || {};

  return React.createElement(
    "div",
    { className: "rx-comp-header-brand__ijkl" },
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

