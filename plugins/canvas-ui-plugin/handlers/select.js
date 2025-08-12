// Selection handler: play selection symphony and dispatch selection update
export function onElementClick(node) {
  return (e) => {
    try {
      e && e.stopPropagation && e.stopPropagation();
      const system = (window && window.renderxCommunicationSystem) || null;
      const conductor = system && system.conductor;
      if (conductor && typeof conductor.play === 'function') {
        conductor.play(
          'Canvas.component-select-symphony',
          'Canvas.component-select-symphony',
          {
            elementId: node.id,
            onSelectionChange: (id) => {
              try {
                const evt = new CustomEvent('renderx:selection:update', { detail: { id } });
                window.dispatchEvent(evt);
              } catch {}
            }
          }
        );
      }
    } catch {}
  };
}

