const { loadRenderXPlugin } = require("../../utils/renderx-plugin-loader");

describe("Cursor policy: open hand on hover, closed fist on grab", () => {
  test("hover adds rx-comp-draggable; mousedown swaps to rx-comp-grabbing; mouseup restores", () => {
    // Reset head styles
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);

    // Stub React
    global.window = global.window || {};
    const created = [];
    window.React = {
      createElement: (type, props, ...children) => ({ type, props, children }),
      useEffect: (fn) => fn(),
      useState: (init) => [init, () => {}],
      cloneElement: (el, p) => ({ ...el, props: { ...(el.props||{}), ...(p||{}) } }),
    };

    const plugin = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");
    const node = { id: "rx-cursor-1", cssClass: "rx-cursor-1", type: "button", position: { x: 0, y: 0 }, component: { metadata: { name: "Button", type: "button"}, ui: { template: '<button class="rx-button">OK</button>', styles: { css: '.rx-button{color:#000}' } }, integration: { canvasIntegration: { defaultWidth: 100, defaultHeight: 30 } } } };
    const el = plugin.renderCanvasNode(node);

    const domEl = document.createElement('div');
    // Hover enter
    el.props.onPointerEnter({ currentTarget: domEl });
    expect(domEl.classList.contains('rx-comp-draggable')).toBe(true);
    expect(domEl.classList.contains('rx-comp-grabbing')).toBe(false);

    // Grab (pointerdown)
    el.props.onPointerDown({ currentTarget: domEl, clientX: 0, clientY: 0, pointerId: 1, target: { setPointerCapture(){} }, stopPropagation(){} });
    expect(domEl.classList.contains('rx-comp-grabbing')).toBe(true);
    expect(domEl.classList.contains('rx-comp-draggable')).toBe(false);

    // Release (pointerup)
    el.props.onPointerUp({ currentTarget: domEl, clientX: 0, clientY: 0, pointerId: 1, target: { releasePointerCapture(){} } });
    expect(domEl.classList.contains('rx-comp-grabbing')).toBe(false);
    // Draggable class is re-added on hover or maintained if still hovered
    // Ensure styles injected exist
    const cursorGlobal = document.getElementById('rx-canvas-ui-cursors');
    expect(cursorGlobal).not.toBeNull();
  });
});

