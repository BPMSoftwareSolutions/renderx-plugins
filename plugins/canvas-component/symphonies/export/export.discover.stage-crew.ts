export function discoverComponentsFromDom(_data: any, ctx: any) {
  try {
    if (typeof document === "undefined") return;

    const canvasEl = document.getElementById("rx-canvas");
    if (!canvasEl) {
      ctx.logger?.warn?.("DOM discovery skipped: #rx-canvas not found");
      return;
    }

    const found: any[] = [];
    const els = canvasEl.querySelectorAll(".rx-comp");
    for (const el of Array.from(els)) {
      const htmlEl = el as HTMLElement;
      const classes = Array.from(htmlEl.classList);
      const typeClass = classes.find((cls) => cls.startsWith("rx-") && cls !== "rx-comp");
      const type = typeClass ? typeClass.replace("rx-", "") : htmlEl.tagName.toLowerCase();

      found.push({
        id: htmlEl.id,
        type,
        classes,
        createdAt: Date.now(),
      });
    }

    if (found.length > 0) {
      ctx.payload.components = found;
      ctx.payload.componentCount = found.length;
      ctx.payload.source = "dom-discovery";
      ctx.logger?.info?.(`DOM discovery found ${found.length} components`);
    } else {
      ctx.logger?.info?.("DOM discovery found 0 components");
    }
  } catch (error) {
    ctx.logger?.error?.("DOM discovery failed:", error);
    ctx.payload.error = String(error);
  }
}

