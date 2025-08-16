/**
 * Theme Management Plugin for MusicalConductor (RenderX)
 */

export const sequence = {
  id: "theme-symphony",
  name: "Theme Management Symphony No. 1",
  description:
    "Orchestrates theme switching with smooth transitions and persistence",
  version: "1.0.0",
  key: "C Major",
  tempo: 120,
  timeSignature: "4/4",
  category: "ui-operations",
  movements: [
    {
      id: "theme-transition",
      name: "Theme Transition Allegro",
      description:
        "Handle theme switching workflow with validation and application",
      beats: [
        {
          beat: 1,
          event: "theme:validation:start",
          title: "Theme Validation",
          handler: "validateTheme",
          dynamics: "forte",
          timing: "immediate",
        },
        {
          beat: 2,
          event: "theme:application:start",
          title: "Theme Application",
          handler: "applyTheme",
          dynamics: "forte",
          timing: "synchronized",
        },
        {
          beat: 3,
          event: "theme:persistence:start",
          title: "Theme Persistence",
          handler: "persistTheme",
          dynamics: "mezzo-forte",
          timing: "delayed",
        },
        {
          beat: 4,
          event: "theme:notification:start",
          title: "Theme Notification",
          handler: "notifyThemeChange",
          dynamics: "mezzo-forte",
          timing: "synchronized",
        },
      ],
    },
  ],
  events: {
    triggers: ["theme:change:request"],
    emits: [
      "theme:validation:start",
      "theme:application:start",
      "theme:persistence:start",
      "theme:notification:start",
      "theme:change:complete",
    ],
  },
  configuration: {
    availableThemes: ["light", "dark", "auto"],
    transitionDuration: 300,
    persistToStorage: true,
    enableSystemTheme: true,
  },
};

export const handlers = {
  validateTheme: (data, context) => {
    const requested =
      (context && context.targetTheme) ?? (data && data.targetTheme);
    const { availableThemes } = context.sequence.configuration;
    const isValid = availableThemes.includes(requested);
    if (!isValid) {
      // Preserve logging for diagnostics if provided
      context.logger?.warn?.(
        `Invalid or missing theme: ${requested}; defaulting to 'auto'`
      );
      // Throw to satisfy validation contract used by tests
      throw new Error("Invalid theme");
    }
    return { validated: true, theme: requested };
  },

  applyTheme: (data, context) => {
    const { transitionDuration } = context.sequence.configuration;
    const t =
      (context && context.payload && context.payload.theme) ??
      (context && context.targetTheme) ??
      (data && data.targetTheme) ??
      "auto";
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", t);
      document.body.className = `theme-${t}`;
      try {
        document.documentElement.style.setProperty(
          "--theme-transition-duration",
          `${transitionDuration}ms`
        );
      } catch {}
    }
    return { applied: true, theme: t };
  },

  persistTheme: (data, context) => {
    const { persistToStorage } = context.sequence.configuration;
    const t =
      (context && context.payload && context.payload.theme) ??
      (context && context.targetTheme) ??
      (data && data.targetTheme) ??
      "auto";
    if (!persistToStorage) return { persisted: false, reason: "disabled", theme: t };
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem("app-theme", t);
      return { persisted: true, theme: t };
    } catch (e) {
      return { persisted: false, error: e?.message, theme: t };
    }
  },

  notifyThemeChange: (data, context) => {
    const t =
      (context && context.payload && context.payload.theme) ??
      (context && context.targetTheme) ??
      (data && data.targetTheme) ??
      "auto";
    if (context.onThemeChange) {
      try {
        context.onThemeChange(t);
      } catch {}
    }
    return { notified: true, theme: t };
  },
};
