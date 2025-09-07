// Stage-crew download handler: performs DOM-based download in browser
export const downloadUiFile = async (data: any, ctx: any) => {
  try {
    if (!ctx.payload.uiFileContent) {
      throw new Error("No UI file content to download");
    }

    if (typeof document === "undefined") {
      throw new Error("Browser environment required for file download");
    }

    const uiData = ctx.payload.uiFileContent;
    const jsonString = JSON.stringify(uiData, null, 2);

    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `canvas-design-${Date.now()}.ui`;
    a.click();

    URL.revokeObjectURL(url);

    ctx.payload.downloadTriggered = true;
    ctx.logger?.info?.("UI file download triggered successfully (stage-crew)");
  } catch (error) {
    ctx.logger?.error?.("Failed to download UI file:", error);
    ctx.payload.error = String(error);
    ctx.payload.downloadTriggered = false;
  }
};

