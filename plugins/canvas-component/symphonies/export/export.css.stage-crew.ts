import { cssRegistry } from "../../../control-panel/state/css-registry.store";

// Stage-crew collector that uses the front-end CSS registry store.
// No IO fallbacks or browser stylesheet parsing; clean and deterministic.
export function collectCssClasses(_data: any, ctx: any) {
  try {
    // Ensure we have components to derive classes from. If KV was empty, fall back to DOM discovery here.
    let components = ctx?.payload?.components || [];
    if (!components || components.length === 0) {
      if (typeof document !== "undefined") {
        const canvasEl = document.getElementById("rx-canvas");
        if (canvasEl) {
          const found: any[] = [];
          const els = canvasEl.querySelectorAll(".rx-comp");
          for (const el of Array.from(els)) {
            const htmlEl = el as HTMLElement;
            const classes = Array.from(htmlEl.classList);
            const typeClass = classes.find(
              (cls) => cls.startsWith("rx-") && cls !== "rx-comp"
            );
            const type = typeClass
              ? typeClass.replace("rx-", "")
              : htmlEl.tagName.toLowerCase();

            found.push({
              id: htmlEl.id,
              type,
              classes,
              createdAt: Date.now(),
            });
          }
          if (found.length > 0) {
            components = found;
            ctx.payload.components = found;
            ctx.payload.source = "dom-discovery";
            ctx.logger?.info?.(
              `DOM discovery (CSS step) found ${found.length} components`
            );
          }
        }
      }
    }

    const unique = new Set<string>();
    for (const comp of components) {
      // Support both comp.classes (legacy) and comp.template.classRefs (current export format)
      const classes: string[] = Array.isArray(comp.classes)
        ? comp.classes
        : Array.isArray(comp.template?.classRefs)
        ? comp.template.classRefs
        : [];
      for (const c of classes) unique.add(c);
    }

    const cssClasses: Record<string, any> = {};
    unique.forEach((name) => {
      const def = cssRegistry.getClass(name);
      if (def) cssClasses[name] = def;
    });

    ctx.payload.cssClasses = cssClasses;
    ctx.payload.cssClassCount = Object.keys(cssClasses).length;
    ctx.logger?.info?.(
      `Stage-crew collected ${ctx.payload.cssClassCount} CSS class definitions from registry`
    );
  } catch (error) {
    ctx.logger?.error?.("Stage-crew CSS collection failed:", error);
    ctx.payload.cssClasses = {};
    ctx.payload.cssClassCount = 0;
    ctx.payload.error = String(error);
  }
}
