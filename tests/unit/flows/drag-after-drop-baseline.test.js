const { loadRenderXPlugin } = require("../../utils/renderx-plugin-loader");
const { TestEnvironment } = require("../../utils/test-helpers");

// This test guards against stale baselines after a dynamic node is added (drop -> then drag)
// Red: should fail before CanvasPage syncs Prompt Book on prop changes

describe("Canvas UI: baseline after drop persists for subsequent drag (dynamic node add)", () => {
  function makeButton() {
    return {
      id: "rx-btn-1",
      cssClass: "rx-btn-1",
      type: "button",
      position: { x: 400, y: 300 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#000}" } },
        integration: { canvasIntegration: { defaultWidth: 100, defaultHeight: 30 } },
      },
    };
  }
  function makeInput(pos) {
    return {
      id: "rx-input-1",
      cssClass: "rx-input-1",
      type: "input",
      position: pos || { x: 200, y: 200 },
      component: {
        metadata: { name: "Input", type: "input" },
        ui: { template: '<input class="rx-input" />', styles: { css: ".rx-input{color:#000}" } },
        integration: { canvasIntegration: { defaultWidth: 160, defaultHeight: 28 } },
      },
    };
  }

  test("after drop (node add), dragging the new node keeps baseline and does not snap back", async () => {
    // Arrange
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);
    global.window = global.window || {};

    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus);
    window.renderxCommunicationSystem = { conductor };

    const { registerCanvasConcertmasters } = require("../../../plugins/canvas-ui-plugin/bootstrap/concertmasters.bootstrap");
    const cx = {
      play: conductor.play.bind(conductor),
      on: (chan, act, cb) => eventBus.subscribe(`${chan}:${act}`, cb),
      off: (chan, act, cb) => eventBus.unsubscribe(`${chan}:${act}`, cb),
    };
    registerCanvasConcertmasters(cx);

    // Minimal React stub
    window.React = {
      createElement: (type, props, ...children) => ({ type, props, children }),
      useEffect: (fn) => fn(),
      useState: (init) => [init, () => {}],
      cloneElement: (el, p) => ({ ...el, props: { ...(el.props || {}), ...(p || {}) } }),
    };

    const plugin = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    // Initial render with only button
    const btn = makeButton();
    plugin.CanvasPage({ nodes: [btn], selectedId: btn.id });

    // Simulate drop of input by re-rendering with new nodes including input
    const input = makeInput({ x: 500, y: 320 }); // dropped near the button
    plugin.CanvasPage({ nodes: [btn, input], selectedId: input.id });

    // Act: get drag handlers for the input and drag by small delta
    const el = plugin.renderCanvasNode(input);
    const domEl = document.createElement("div");

    el.props.onPointerDown({ currentTarget: domEl, clientX: 0, clientY: 0, pointerId: 1, target: { setPointerCapture() {} }, stopPropagation() {} });
    el.props.onPointerMove({ currentTarget: domEl, clientX: 10, clientY: 5 });
    await new Promise((r) => setTimeout(r, 25));
    el.props.onPointerUp({ currentTarget: domEl, clientX: 10, clientY: 5, pointerId: 1, target: { releasePointerCapture() {} } });

    // Assert: per-instance CSS should reflect baseline (500,320) + delta (10,5) = (510,325)
    const tag = document.getElementById(`component-instance-css-${input.id}`);
    const css = (tag?.textContent || "").replace(/\s+/g, "");
    expect(css).toContain(`.${input.cssClass}{position:absolute;left:510px;top:325px;`.replace(/\s+/g, ""));
  });
});

