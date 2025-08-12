/**
 * Helper for Canvas UI Plugin (separate file for unit-testable ESM)
 * Calls Library.component-drop-symphony with parsed dragData and coordinates
 */

export function handleCanvasDrop(conductor, e, opts = {}) {
  try {
    const rect = (e && e.currentTarget && e.currentTarget.getBoundingClientRect && e.currentTarget.getBoundingClientRect()) || { left: 0, top: 0 };
    const coordinates = { x: Math.round((e.clientX || 0) - rect.left), y: Math.round((e.clientY || 0) - rect.top) };

    let dragData = opts.dragData || null;
    if (!dragData && e && e.dataTransfer) {
      try {
        const s = e.dataTransfer.getData('application/json');
        dragData = s ? JSON.parse(s) : null;
      } catch {}
    }

    const onComponentCreated = typeof opts.onComponentCreated === 'function' ? opts.onComponentCreated : undefined;

    if (conductor && typeof conductor.play === 'function') {
      conductor.play('Library.component-drop-symphony', 'Library.component-drop-symphony', {
        event: e,
        coordinates,
        dragData,
        timestamp: Date.now(),
        source: 'canvas-ui-plugin:drop',
        onComponentCreated,
      });
    }
  } catch (err) {
    try { console.warn('⚠️ Canvas UI Plugin: drop handling failed', err && err.message); } catch {}
  }
}

