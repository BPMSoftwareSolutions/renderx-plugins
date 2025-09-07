import React from "react";

// Pure presentational button. No conductor, no side-effects here.
export default React.forwardRef<HTMLButtonElement, {
  theme: "light" | "dark" | null;
  onToggle: () => void;
}>(({ theme, onToggle }, ref) => {
  return (
    <button
      ref={ref}
      onClick={onToggle}
      className="header-theme-button"
      title="Toggle Theme"
    >
      {theme === "light" ? "🌙 Dark" : "🌞 Light"}
    </button>
  );
});

