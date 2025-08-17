// Component Instance StageCrew (Adapter): applies per-instance CSS for the actual component element
// Migrated to route DOM writes through Stage Crew (ADR-0017 Option B)
import { getStageCrew } from "@communication/StageCrew";

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
        // Preserve width/height from existing tag if present (reads are allowed)
        let widthDecl = "";
        let heightDecl = "";
        try {
          const existing = document.getElementById(
            tagId
          ) as HTMLStyleElement | null;
          const text = existing?.textContent || "";
          const w = text.match(
            new RegExp(`\\.${cls}\\s*\\{[^}]*width\\s*:\\s*([^;]+);`, "i")
          );
          const h = text.match(
            new RegExp(`\\.${cls}\\s*\\{[^}]*height\\s*:\\s*([^;]+);`, "i")
          );
          widthDecl = w ? `.${cls}{width:${w[1].trim()};}` : "";
          heightDecl = h ? `.${cls}{height:${h[1].trim()};}` : "";
        } catch {}
        const cssText = [
          `.${cls}{position:absolute;left:${x}px;top:${y}px;box-sizing:border-box;display:block;}`,
          widthDecl,
          heightDecl,
        ]
          .filter(Boolean)
          .join("\n");

        // Route the DOM write via Stage Crew
        const sc = getStageCrew();
        const correlationId = `mc-${Date.now().toString(36)}${Math.random()
          .toString(36)
          .slice(2, 6)}`;
        sc.beginBeat(correlationId, { handlerName: "instance.commitPosition" })
          .upsertStyle(tagId, cssText)
          .commit();
      } catch {}
    },
  };
}
