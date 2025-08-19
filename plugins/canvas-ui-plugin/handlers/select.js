// Selection handler: play selection symphony and update via callback only
export function onElementClick(node) {
  return (e) => {
    try {
      e && e.stopPropagation && e.stopPropagation();
      const system = (window && window.renderxCommunicationSystem) || null;
      const conductor = system && system.conductor;
      if (conductor && typeof conductor.play === "function") {
        conductor.play(
          "Canvas.component-select-symphony",
          "Canvas.component-select-symphony",
          {
            elementId: node.id,
            position: node?.position || { x: 0, y: 0 },
            defaults: node?.component?.integration?.canvasIntegration || {},
            onSelectionChange: (id) => {
              try {
                const ui = (window && window.__rx_canvas_ui__) || null;
                if (ui && typeof ui.setSelectedId === "function") {
                  ui.setSelectedId(id || null);
                }
              } catch {}
            },
          }
        );
      }
    } catch {}
  };
}
