/**
 * Theme Management Plugin for MusicalConductor (RenderX)
 */

export const sequence = {
  id: "theme-symphony",
  name: "Theme Management Symphony No. 1",
  description: "Orchestrates theme switching with smooth transitions and persistence",
  version: "1.0.0",
  key: "C Major",
  tempo: 120,
  timeSignature: "4/4",
  category: "ui-operations",
  movements: [
    {
      id: "theme-transition",
      name: "Theme Transition Allegro",
      description: "Handle theme switching workflow with validation and application",
      beats: [
        { beat: 1, event: "theme:validation:start", title: "Theme Validation", handler: "validateTheme", dynamics: "forte", timing: "immediate" },
        { beat: 2, event: "theme:application:start", title: "Theme Application", handler: "applyTheme", dynamics: "forte", timing: "synchronized" },
        { beat: 3, event: "theme:persistence:start", title: "Theme Persistence", handler: "persistTheme", dynamics: "mezzo-forte", timing: "delayed" },
        { beat: 4, event: "theme:notification:start", title: "Theme Notification", handler: "notifyThemeChange", dynamics: "mezzo-forte", timing: "synchronized" }
      ]
    }
  ],
  events: {
    triggers: ["theme:change:request"],
    emits: [
      "theme:validation:start",
      "theme:application:start",
      "theme:persistence:start",
      "theme:notification:start",
      "theme:change:complete"
    ]
  },
  configuration: {
    availableThemes: ["light", "dark", "auto"],
    transitionDuration: 300,
    persistToStorage: true,
    enableSystemTheme: true
  }
};

export const handlers = {
  validateTheme: (data, context) => {
    const targetTheme = (context && context.targetTheme) ?? (data && data.targetTheme) ?? "auto";
    const { availableThemes } = context.sequence.configuration;
    if (!availableThemes.includes(targetTheme)) {
      throw new Error(`Invalid theme: ${targetTheme}. Available: ${availableThemes.join(", ")}`);
    }
    return { validated: true, theme: targetTheme };
  },

  applyTheme: (data, context) => {
    const { targetTheme } = context;
    const { transitionDuration } = context.sequence.configuration;
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", targetTheme);
      document.body.className = `theme-${targetTheme}`;
      document.documentElement.style.setProperty("--theme-transition-duration", `${transitionDuration}ms`);
    }
    return { applied: true, theme: targetTheme };
  },

  persistTheme: (data, context) => {
    const { theme } = context.payload;
    const { persistToStorage } = context.sequence.configuration;
    if (!persistToStorage) return { persisted: false, reason: "disabled", theme };
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem("app-theme", theme);
      return { persisted: true, theme };
    } catch (e) {
      return { persisted: false, error: e?.message, theme };
    }
  },

  notifyThemeChange: (data, context) => {
    const { theme } = context.payload;
    if (context.onThemeChange) {
      try { context.onThemeChange(theme); } catch {}
    }
    return { notified: true, theme };
  }
};

