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


// Build per-instance position CSS text while preserving existing width/height, without mutating DOM
export function buildInstancePositionCssText(id, cls, x, y) {
  try {
    if (!id || !cls) return "";
    const tagId = "component-instance-css-" + String(id || "");
    const tag = document.getElementById(tagId);
    // Preserve width/height from existing tag if present
    let widthDecl = "";
    let heightDecl = "";
    if (tag && tag.textContent) {
      const text = tag.textContent;
      const w = text.match(new RegExp(`\\.${cls}\\s*\\{[^}]*width\\s*:\\s*([^;]+);`, "i"));
      const h = text.match(new RegExp(`\\.${cls}\\s*\\{[^}]*height\\s*:\\s*([^;]+);`, "i"));
      widthDecl = w ? `.${cls}{width:${w[1].trim()};}` : "";
      heightDecl = h ? `.${cls}{height:${h[1].trim()};}` : "";
    }
    const posDecl = `.${cls}{position:absolute;left:${Math.round(x || 0)}px;top:${Math.round(y || 0)}px;box-sizing:border-box;display:block;}`;
    return [posDecl, widthDecl, heightDecl].filter(Boolean).join("\n");
  } catch {
    return "";
  }
}

// Update per-instance width/height while preserving existing left/top (if present)
export function updateInstanceSizeCSS(id, cls, widthPx, heightPx, pos) {
  try {
    if (!id || !cls) return;
    const tagId = "component-instance-css-" + String(id || "");
    let tag = document.getElementById(tagId);
    let left = 0;
    let top = 0;
    if (tag && tag.textContent) {
      const text = tag.textContent;
      const lx = text.match(
        new RegExp(`\\.${cls}\\s*\\{[^}]*left\\s*:\\s*([0-9.-]+)px;`, "i")
      );
      const ty = text.match(
        new RegExp(`\\.${cls}\\s*\\{[^}]*top\\s*:\\s*([0-9.-]+)px;`, "i")
      );
      if (lx) left = parseFloat(lx[1]);
      if (ty) top = parseFloat(ty[1]);
    }
    if (pos && typeof pos.x === "number") left = pos.x;
    if (pos && typeof pos.y === "number") top = pos.y;
    const lines = [
      `.${cls}{position:absolute;left:${Math.round(left)}px;top:${Math.round(
        top
      )}px;box-sizing:border-box;display:block;}`,
      `.${cls}{width:${Math.round(widthPx)}px;}`,
      `.${cls}{height:${Math.round(heightPx)}px;}`,
    ];
    if (!tag) {
      tag = document.createElement("style");
      tag.id = tagId;
      document.head.appendChild(tag);
    }
    tag.textContent = lines.join("\n");
  } catch {}
}
