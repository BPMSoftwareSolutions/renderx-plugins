// Per-instance CSS manager: update position while preserving width/height
export function updateInstancePositionCSS(id, cls, x, y) {
  try {
    if (!id || !cls) return;
    const tagId = "component-instance-css-" + String(id || "");
    let tag = document.getElementById(tagId);
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
      `.${cls}{position:absolute;left:${Math.round(x)}px;top:${Math.round(
        y
      )}px;box-sizing:border-box;display:block;}`,
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
}
