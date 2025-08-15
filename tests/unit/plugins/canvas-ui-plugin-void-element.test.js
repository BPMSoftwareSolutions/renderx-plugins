const { loadRenderXPlugin } = require("../../utils/renderx-plugin-loader");

describe("Canvas UI: render void elements (e.g., input) without children", () => {
  test("input template renders with no children to avoid React invariant 137", () => {
    global.window = global.window || {};

    let lastArgs = null;
    window.React = {
      createElement: (...args) => {
        lastArgs = args;
        const [type, props, ...children] = args;
        return { type, props, children };
      },
      useEffect: (fn) => fn(),
      useState: (init) => [init, () => {}],
      cloneElement: (el, p) => ({ ...el, props: { ...(el.props||{}), ...(p||{}) } }),
    };

    const plugin = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    const node = {
      id: "rx-input-void",
      cssClass: "rx-input-void",
      type: "input",
      position: { x: 0, y: 0 },
      component: {
        metadata: { name: "Input", type: "input" },
        ui: { template: '<input class="rx-input" />', styles: { css: '.rx-input{color:#000}' }},
        integration: { canvasIntegration: { defaultWidth: 100, defaultHeight: 20 }},
      },
    };

    const el = plugin.renderCanvasNode(node);
    expect(el).toBeTruthy();
    expect(lastArgs).toBeTruthy();
    // Ensure we only passed (type, props) and no children for input
    expect(lastArgs.length).toBe(2);
    expect(el.children.length).toBe(0);
  });
});

