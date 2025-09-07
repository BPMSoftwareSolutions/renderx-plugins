import { EventRouter } from "../../../../src/EventRouter";

export async function openUiFile(_data: any, ctx: any) {
  try {
    if (typeof document === "undefined") {
      ctx.logger?.warn?.("openUiFile: not in a browser environment");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".ui,application/json";

    const file: File | null = await new Promise((resolve) => {
      input.onchange = () => resolve(input.files?.[0] || null);
      input.click();
    });

    if (!file) return;

    const text = await file.text();
    try {
      const json = JSON.parse(text);
      ctx.payload.uiFileContent = json;
      ctx.logger?.info?.("Loaded .ui file", {
        name: file.name,
        size: file.size,
      });

      // Notify import started
      try {
        const correlationId = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;
        ctx.payload.importCorrelationId = correlationId;
        EventRouter.publish(
          "canvas.component.import.started",
          { correlationId, fileName: file.name, size: file.size },
          ctx.conductor
        );
      } catch {}
    } catch (e) {
      ctx.logger?.error?.("Invalid .ui JSON:", e);
      ctx.payload.error = "Invalid .ui JSON";
    }
  } catch (e) {
    ctx.logger?.error?.("openUiFile failed:", e);
  }
}
