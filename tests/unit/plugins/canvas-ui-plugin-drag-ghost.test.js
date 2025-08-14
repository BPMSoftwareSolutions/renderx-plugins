const { loadRenderXPlugin } = require("../../utils/renderx-plugin-loader");

/**
 * Ensures native drag ghost is suppressed by setting a transparent drag image
 */

describe("Canvas UI drag ghost suppression", () => {
  test("pointer-driven drag does not use native drag preview", () => {
    const plugin = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    // Stub React
    global.window = global.window || {};
    const created = [];
    window.React = {
      createElement: (type, props, ...children) => { const el = { type, props, children }; created.push(el); return el; },
      useEffect: (fn) => fn(),
      useState: (init) => [init, () => {}],
    };

    const node = {
      id: "rx-comp-ghost-1",
      cssClass: "rx-comp-ghost-1",
      type: "button",
      position: { x: 0, y: 0 },
      component: { metadata: { name: "Button", type: "button" }, ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#fff;}" } }, integration: { canvasIntegration: { defaultWidth: 10, defaultHeight: 10 } } },
    };

    plugin.renderCanvasNode(node);
    const el = created.find(c => c.props && typeof c.props.onPointerDown === 'function');
    expect(el).toBeTruthy();

    const setDragImage = jest.fn();
    // Pointer-driven path no longer uses native drag; ensure we do NOT call setDragImage here
    el.props.onPointerDown({ clientX: 1, clientY: 2, pointerId: 1, target: { setPointerCapture(){} }, stopPropagation(){}, dataTransfer: { setDragImage } });

    expect(setDragImage).not.toHaveBeenCalled();
  });
});

