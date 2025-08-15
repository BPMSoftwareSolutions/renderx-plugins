/**
 * Header Center Plugin - Panel Toggles
 */

export function HeaderCenter(props = {}) {
  const React = (typeof window !== "undefined" && window.React) || null;
  if (!React) return null;
  const {
    onToggleElementLibrary,
    onToggleControlPanel,
    showElementLibrary,
    showControlPanel,
  } = props || {};

  return React.createElement(
    "div",
    { className: "rx-comp-header-toggles__efgh" },
    React.createElement(
      "style",
      null,
      [
        ".rx-comp-header-toggles__efgh{display:flex;align-items:center;gap:8px;}",
        ".rx-comp-toggle__lib1,.rx-comp-toggle__ctl1{background:var(--rx-primary,#0d6efd);color:var(--rx-on-primary,#fff);border:none;border-radius:6px;padding:4px 8px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:12px;}",
        ".rx-comp-toggle__lib1.active,.rx-comp-toggle__ctl1.active{filter:brightness(0.95);box-shadow:0 0 0 2px rgba(13,110,253,.15) inset;}",
        ".rx-comp-toggle__lib1:disabled,.rx-comp-toggle__ctl1:disabled{opacity:.5;cursor:default;}",
      ].join("\n")
    ),
    React.createElement(
      "button",
      {
        className: `rx-comp-toggle__lib1 ${showElementLibrary ? "active" : ""}`,
        onClick: onToggleElementLibrary,
        title: `${showElementLibrary ? "Hide" : "Show"} Element Library`,
        disabled: !onToggleElementLibrary,
      },
      "\uD83D\uDCDa Library"
    ),
    React.createElement(
      "button",
      {
        className: `rx-comp-toggle__ctl1 ${showControlPanel ? "active" : ""}`,
        onClick: onToggleControlPanel,
        title: `${showControlPanel ? "Hide" : "Show"} Control Panel`,
        disabled: !onToggleControlPanel,
      },
      "\uD83C\uDF9B️ Properties"
    )
  );
}
