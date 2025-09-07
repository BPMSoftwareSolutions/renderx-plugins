
export const startLineResize = (data: any) => {
  const { id, handle, onLineResizeStart } = data || {};
  if (typeof onLineResizeStart === "function") {
    try { onLineResizeStart({ id, handle }); } catch {}
  }
};

export const updateLine = (data: any) => {
  const { id, handle, dx, dy, onLineResize } = data || {};
  if (!id) throw new Error("Missing id for line resize");
  const el = typeof document !== "undefined" ? (document.getElementById(String(id)) as HTMLElement | null) : null;
  if (!el) throw new Error(`Canvas component with id ${id} not found`);

  // Base from existing CSS vars (defaults to 0)
  const baseX = parseFloat(el.style.getPropertyValue(handle === "a" ? "--x1" : "--x2") || "0");
  const baseY = parseFloat(el.style.getPropertyValue(handle === "a" ? "--y1" : "--y2") || "0");
  const nx = Math.round(baseX + Number(dx || 0));
  const ny = Math.round(baseY + Number(dy || 0));
  el.style.setProperty(handle === "a" ? "--x1" : "--x2", `${nx}`);
  el.style.setProperty(handle === "a" ? "--y1" : "--y2", `${ny}`);

  if (typeof onLineResize === "function") {
    try { onLineResize({ id, handle, x: nx, y: ny }); } catch {}
  }
  return { id, handle, x: nx, y: ny };
};

export const endLineResize = (data: any) => {
  const { id, onLineResizeEnd } = data || {};
  if (typeof onLineResizeEnd === "function") {
    try { onLineResizeEnd({ id }); } catch {}
  }
};

