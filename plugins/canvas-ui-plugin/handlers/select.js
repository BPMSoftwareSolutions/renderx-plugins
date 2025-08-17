// Selection handler: route via CapabilityBinder with legacy fallback
function playCapability(conductor, node, capability, payload) {
  try {
    const w = (typeof window !== "undefined" && window) || {};
    const binder = w.__rx_capability_binder__;
    if (binder && typeof binder.play === "function") {
      return binder.play(conductor, node, capability, payload);
    }
  } catch {}
  // Throw synchronously so caller catch runs
  throw new Error("CapabilityBinder not available");
}

export function onElementClick(node) {
  return (e) => {
    try {
      e && e.stopPropagation && e.stopPropagation();
      const system = (window && window.renderxCommunicationSystem) || null;
      const conductor = system && system.conductor;
      if (conductor && typeof conductor.play === "function") {
        const payload = {
          elementId: node.id,
          onSelectionChange: (id) => {
            try {
              const ui = (window && window.__rx_canvas_ui__) || null;
              if (ui && typeof ui.setSelectedId === "function") {
                ui.setSelectedId(id || null);
              }
            } catch {}
          },
        };
        try {
          playCapability(conductor, node, "select", payload);
        } catch {
          // Legacy fallback
          conductor.play(
            "Canvas.component-select-symphony",
            "Canvas.component-select-symphony",
            payload
          );
        }
      }
    } catch {}
  };
}
