import React from "react";
import { useConductor, resolveInteraction } from "@renderx/host-sdk";
import "./Header.css";

// Lazy-load the presentational view (disabled in tests to avoid async teardown issues)
const isTestEnv =
  typeof import.meta !== "undefined" && !!(import.meta as any).vitest;
type HeaderButtonViewProps = {
  theme: "light" | "dark" | null;
  onToggle: () => void;
};
const HeaderThemeButtonView = isTestEnv
  ? null
  : (React.lazy(
      () => import("./HeaderThemeButtonView")
    ) as unknown as React.ComponentType<
      HeaderButtonViewProps & React.RefAttributes<HTMLButtonElement>
    >);

export function HeaderThemeToggle() {
  const conductor = useConductor();
  const [theme, setThemeState] = React.useState<"light" | "dark" | null>(null);
  const requestedRef = React.useRef(false);
  const aliveRef = React.useRef(true);
  // Track if the user has interacted (clicked) to avoid stale async "get" overwriting
  // an already toggled theme. Without this, a slow initial get could race and reset
  // the button label back to the pre-toggle value causing test flakiness.
  const userInteractedRef = React.useRef(false);
  // Synchronous baseline theme detection to avoid an initial null->click race:
  // If user clicks before async get resolves, we want a stable starting theme.
  // Removed direct DOM/localStorage access to satisfy plugin lint restrictions.
  // Initial theme now always discovered through async conductor play (get route).
  React.useEffect(() => {
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const safeSetTheme = (t: "light" | "dark") => {
    if (!aliveRef.current) return;
    setThemeState(t);
  };

  const ensureTheme = React.useCallback(
    (el: HTMLButtonElement | null) => {
      if (!el || theme !== null || requestedRef.current || !aliveRef.current)
        return;
      requestedRef.current = true;
      try {
        const route = resolveInteraction("app.ui.theme.get");
        conductor.play(
          route.pluginId,
          route.sequenceId,
          {
            onTheme: (t: "light" | "dark") => {
              if (!userInteractedRef.current) safeSetTheme(t);
            },
          },
          (result: any) => {
            const t = result?.theme;
            if (!userInteractedRef.current && (t === "light" || t === "dark"))
              safeSetTheme(t);
          }
        );
      } catch {
        // Fallback to dark theme on error
        if (!userInteractedRef.current) safeSetTheme("dark");
      }
    },
    [theme, conductor]
  );

  const toggle = async () => {
    try {
  userInteractedRef.current = true;
      const next = theme === "light" ? "dark" : "light";
      // Optimistically update UI immediately for snappy feedback
      safeSetTheme(next);
      const route = resolveInteraction("app.ui.theme.toggle");
      const result = await conductor.play(route.pluginId, route.sequenceId, {
        theme: next,
      });
      const updatedTheme =
        (result?.theme as "light" | "dark" | undefined) || next;
      // Reconcile with authoritative result
      safeSetTheme(updatedTheme);
    } catch {
      // Silently handle theme toggle failures
    }
  };

  return (
    <div className="header-container">
      <div className="header-theme-toggle">
        {isTestEnv ? (
          <button
            ref={ensureTheme}
            onClick={toggle}
            className="header-theme-button"
            title="Toggle Theme"
          >
            {theme === "light" ? "🌙 Dark" : "🌞 Light"}
          </button>
        ) : (
          <React.Suspense
            fallback={
              <button
                ref={ensureTheme}
                onClick={toggle}
                className="header-theme-button"
                title="Toggle Theme"
              >
                {theme === "light" ? "🌙 Dark" : "🌞 Light"}
              </button>
            }
          >
            <HeaderThemeButtonView
              ref={ensureTheme}
              theme={theme}
              onToggle={toggle}
            />
          </React.Suspense>
        )}
      </div>
    </div>
  );
}
