function safeGetStoredTheme(): "light" | "dark" | null {
  try {
    if (typeof localStorage !== "undefined") {
      const v = localStorage.getItem("theme");
      return v === "dark" || v === "light" ? v : null;
    }
  } catch {}
  return null;
}

function safeSetStoredTheme(theme: "light" | "dark") {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  } catch {}
}

function coerceTheme(v: any): "light" | "dark" | null {
  return v === "dark" || v === "light" ? v : null;
}

export function getCurrentTheme(data: any, ctx: any) {
  try {
    // Determine theme preference order: DOM attr -> storage -> default (dark)
    let currentTheme: "light" | "dark" = "dark";

    if (typeof document !== "undefined") {
      const domAttr = document.documentElement.getAttribute("data-theme");
      const domTheme = coerceTheme(domAttr);
      if (domTheme) currentTheme = domTheme;
      else {
        const stored = safeGetStoredTheme();
        if (stored) currentTheme = stored;
      }

      // Apply to DOM to ensure consistency and avoid flicker
      document.documentElement.setAttribute("data-theme", currentTheme);
    } else {
      const stored = safeGetStoredTheme();
      if (stored) currentTheme = stored;
    }

    // Persist to storage so the default is remembered across sessions
    safeSetStoredTheme(currentTheme);

    ctx.payload.currentTheme = currentTheme;
    return { theme: currentTheme };
  } catch (e) {
    ctx.logger?.warn?.("getCurrentTheme failed", e);
    ctx.payload.currentTheme = "dark";
    return { theme: "dark" };
  }
}

export function toggleTheme(data: any, ctx: any) {
  try {
    const next: "light" | "dark" = coerceTheme(data?.theme) || "light";

    // Direct DOM manipulation in stage-crew handler (StageCrew API deprecated)
    try {
      if (typeof document !== "undefined") {
        const el = document.documentElement;
        const raf =
          (typeof window !== "undefined" &&
            (window as any).requestAnimationFrame) ||
          null;
        const apply = () => el.setAttribute("data-theme", next);
        if (raf) raf(() => apply());
        else apply();
      }
    } catch {}

    // Persist preference marker on ctx (no direct globals)
    try {
      ctx.payload.theme = next;
    } catch {}

    // Persist to storage for cross-session retention
    safeSetStoredTheme(next);

    // Return the updated theme for DataBaton tracking
    return { theme: next };
  } catch (e) {
    ctx.logger?.warn?.("toggleTheme failed", e);
    return { error: e };
  }
}
