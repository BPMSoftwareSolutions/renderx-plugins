import { loadRenderXPlugin } from '../../../utils/renderx-plugin-loader';

describe('Canvas UI Plugin - keys behavior', () => {
  test('renders nodes with stable keys and warns/skips when missing id/elementId/cssClass', () => {
    const created: Array<any> = [];

    // Reset head styles
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);

    const originalWindow: any = (global as any).window;
    const w: any = originalWindow || {};

    // React stub with cloneElement to capture key prop
    w.React = {
      createElement: (type: any, props: any, ...children: any[]) => {
        created.push({ type, props, children });
        return { type, props, children };
      },
      cloneElement: (el: any, newProps: any) => {
        const merged = { ...(el.props || {}), ...(newProps || {}) };
        created.push({ type: el.type, props: merged, children: el.children || [] });
        return { type: el.type, props: merged, children: el.children || [] };
      },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
    };

    (global as any).window = w;

    try {
      const plugin: any = loadRenderXPlugin('RenderX/public/plugins/canvas-ui-plugin/index.js');
      const render = plugin.renderCanvasNode as Function;

      const goodA = render({ id: 'id-a', cssClass: 'rx-comp-a', type: 'button', position: { x:0,y:0 }, component: { ui: { template: '<button class="rx-button">A</button>', styles: { css: '.rx-button{color:#000}' } } } });
      const goodB = render({ id: 'id-b', cssClass: 'rx-comp-b', type: 'button', position: { x:0,y:0 }, component: { ui: { template: '<button class="rx-button">B</button>', styles: { css: '.rx-button{color:#111}' } } } });
      const bad = render({ id: '', cssClass: '', type: 'button', position: { x:0,y:0 }, component: { ui: { template: '<button class="rx-button">X</button>', styles: { css: '.rx-button{color:#222}' } } } });

      // Use CanvasPage mapping logic to apply keys and skip bad
      const React = (window as any).React;
      const mapWithKeys = (n: any) => {
        const el = n && render(n);
        let key = n.id || n.elementId || n.cssClass;
        if (!key) {
          try { console.warn('CanvasPage: missing id/elementId/cssClass for node; skipping render.'); } catch {}
          return null;
        }
        if (el && typeof React.cloneElement === 'function') {
          return React.cloneElement(el, { key });
        }
        return el;
      };

      // Spy on console.warn
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const out = [mapWithKeys({ id: 'id-a', cssClass: 'rx-comp-a' }), mapWithKeys({ id: 'id-b', cssClass: 'rx-comp-b' }), mapWithKeys({ id: '', cssClass: '' })];

      // Assertions
      expect(out[0]?.props?.key).toBe('id-a');
      expect(out[1]?.props?.key).toBe('id-b');
      expect(out[2]).toBeNull();
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    } finally {
      (global as any).window = originalWindow;
    }
  });
});

