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
