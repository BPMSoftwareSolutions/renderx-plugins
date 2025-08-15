/**
 * Header Right Plugin - Actions (Preview, Fullscreen, Theme)
 */

export function HeaderRight(_props = {}) {
  const React = (typeof window !== "undefined" && (window).React) || null;
  if (!React) return null;
  const conductor =
    (typeof window !== "undefined" &&
      (window).renderxCommunicationSystem &&
      (window).renderxCommunicationSystem.conductor) || null;

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

  const next = (t) => (t === "light" ? "dark" : t === "dark" ? "auto" : "light");
  const onToggleTheme = () => {
    const current =
      (typeof localStorage !== "undefined" && localStorage.getItem("app-theme")) ||
      "auto";
    conductor?.play("theme-symphony", "theme-symphony", {
      targetTheme: next(current),
    });
  };

  return React.createElement(
    "div",
    { className: "rx-comp-header-actions__abcd" },
    React.createElement(
      "button",
      { className: "rx-comp-button__prev1", onClick: onPreview, title: "Enter Preview Mode" },
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
      { className: "rx-comp-button__theme1", onClick: onToggleTheme, title: "Theme" },
      "\uD83C\uDFA8"
    )
  );
}

