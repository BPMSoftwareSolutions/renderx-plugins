// Component Instance StageCrew (Adapter): applies per-instance CSS for the actual component element
// Note: self-contained (no imports) to avoid Jest ESM transform issues in mixed JS/TS modules.
export function makeInstanceStageCrew() {
  return {
    commitPosition(
      elementId: string,
      cssClass: string,
      position: { x: number; y: number }
    ) {
      try {
        if (!elementId || !cssClass) return;
        const id = String(elementId || "");
        const cls = String(cssClass || "").trim();
        const x = Math.round(position?.x ?? 0);
        const y = Math.round(position?.y ?? 0);
        const tagId = "component-instance-css-" + id;
        let tag = document.getElementById(tagId) as HTMLStyleElement | null;
        // Preserve width/height from existing tag if present
        let widthDecl = "";
        let heightDecl = "";
        if (tag && tag.textContent) {
          const text = tag.textContent;
          const w = text.match(
            new RegExp(`\\.${cls}\\s*\\{[^}]*width\\s*:\\s*([^;]+);`, "i")
          );
          const h = text.match(
            new RegExp(`\\.${cls}\\s*\\{[^}]*height\\s*:\\s*([^;]+);`, "i")
          );
          widthDecl = w ? `.${cls}{width:${w[1].trim()};}` : "";
          heightDecl = h ? `.${cls}{height:${h[1].trim()};}` : "";
        }
        const lines = [
          `.${cls}{position:absolute;left:${x}px;top:${y}px;box-sizing:border-box;display:block;}`,
          widthDecl,
          heightDecl,
        ].filter(Boolean);
        if (!tag) {
          tag = document.createElement("style");
          tag.id = tagId;
          document.head.appendChild(tag);
        }
        tag.textContent = lines.join("\n");
      } catch {}
    },
  };
}
