import { overlayInjectGlobalCSS, overlayInjectInstanceCSS } from '../utils/styles.js';

export function buildOverlayForNode(React, n, key, selectedId) {
  if (!(selectedId && (n.id === selectedId || n.elementId === selectedId))) return null;
  try {
    overlayInjectGlobalCSS();
    const defaults = (n.component && n.component.integration && n.component.integration.canvasIntegration) || {};
    overlayInjectInstanceCSS({ id: n.id, position: n.position }, defaults.defaultWidth, defaults.defaultHeight);
  } catch {}
  const overlayClass = `rx-resize-overlay rx-overlay-${n.id || n.elementId}`;
  const handles = ['nw','n','ne','e','se','s','sw','w'];
  return React.createElement(
    'div',
    { key: `${key}__overlay`, className: overlayClass },
    ...handles.map((h) =>
      React.createElement('div', {
        key: `${key}__${h}`,
        className: `rx-resize-handle rx-${h}`,
        onPointerDown: (e) => {
          try {
            e && e.stopPropagation && e.stopPropagation();
            const system = (window && window.renderxCommunicationSystem) || null;
            const conductor = system && system.conductor;
            if (conductor && typeof conductor.play === 'function') {
              conductor.play('Canvas.component-resize-symphony','Canvas.component-resize-symphony', {
                elementId: n.id || n.elementId,
                handle: h,
                start: { x: e.clientX, y: e.clientY },
              });
            }
          } catch {}
        },
      })
    )
  );
}

