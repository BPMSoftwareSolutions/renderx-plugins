/**
 * Header Right Plugin - Actions (Preview, Fullscreen, Theme)
 */

export function HeaderRight(_props = {}) {
  const React = (typeof window !== "undefined" && window.React) || null;
  if (!React) return null;
  const conductor =
    (typeof window !== "undefined" &&
      window.renderxCommunicationSystem &&
      window.renderxCommunicationSystem.conductor) ||
    null;

  const onPreview = () =>
    conductor?.play("layout-mode-symphony", "onModeChange", {
      previousMode: "editor",
      currentMode: "preview",
      options: { animated: true, preserveState: true },
      timestamp: Date.now(),
    });

  const onFullscreen = () =>
    conductor?.play("layout-mode-symphony", "onModeChange", {
      previousMode: "editor",
      currentMode: "fullscreen-preview",
      options: { animated: true, preserveState: false },
      timestamp: Date.now(),
    });

  const next = (t) =>
    t === "light" ? "dark" : t === "dark" ? "auto" : "light";
  const onToggleTheme = () => {
    const current =
      (typeof localStorage !== "undefined" &&
        localStorage.getItem("app-theme")) ||
      "auto";
    conductor?.play("theme-symphony", "theme-symphony", {
      targetTheme: next(current),
    });
  };

  return React.createElement(
    "div",
    { className: "rx-comp-header-actions__abcd" },
    // Scoped styles to match expected UI
    React.createElement(
      "style",
      null,
      [
        ".rx-comp-header-actions__abcd{display:flex;align-items:center;gap:8px;}",
        ".rx-comp-button__prev1,.rx-comp-button__full1,.rx-comp-button__theme1{background:var(--rx-primary,#0d6efd);color:var(--rx-on-primary,#fff);border:none;border-radius:6px;padding:4px 8px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:12px;}",
        ".rx-comp-button__prev1:hover,.rx-comp-button__full1:hover,.rx-comp-button__theme1:hover{filter:brightness(0.95);}",
        ".rx-comp-button__prev1:active,.rx-comp-button__full1:active,.rx-comp-button__theme1:active{transform:translateY(0.5px);}",
      ].join("\n")
    ),
    React.createElement(
      "button",
      {
        className: "rx-comp-button__prev1",
        onClick: onPreview,
        title: "Enter Preview Mode",
      },
      "\uD83D\uDC41️ Preview"
    ),
    React.createElement(
      "button",
      {
        className: "rx-comp-button__full1",
        onClick: onFullscreen,
        title: "Enter Fullscreen Preview",
      },
      "⛶ Fullscreen"
    ),
    React.createElement(
      "button",
      {
        className: "rx-comp-button__theme1",
        onClick: onToggleTheme,
        title: "Theme",
      },
      "\uD83C\uDFA8"
    )
  );
}
