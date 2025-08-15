const { loadRenderXPlugin } = require("../../utils/renderx-plugin-loader");
const { TestEnvironment } = require("../../utils/test-helpers");

describe("Canvas UI: overlay repositions on drop and baseline persists across drags", () => {
  function makeNode() {
    return {
      id: "rx-two-drag",
      cssClass: "rx-two-drag",
      type: "button",
      position: { x: 10, y: 20 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>', styles: { css: '.rx-button{color:#000}' } },
        integration: { canvasIntegration: { defaultWidth: 100, defaultHeight: 30 } },
      },
    };
  }

  test("overlay base CSS updates to committed pos on first drop; second drag uses updated baseline", async () => {
    // Reset head and set up env
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);
    global.window = global.window || {};

    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus);
    window.renderxCommunicationSystem = { conductor };

    // React stub
    const created = [];
    window.React = {
      createElement: (type, props, ...children) => { const el = { type, props, children }; created.push(el); return el; },
      useEffect: (fn) => fn(),
      useState: (init) => [init, () => {}],
      cloneElement: (el, p) => ({ ...el, props: { ...(el.props||{}), ...(p||{}) } }),
    };

    const plugin = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    const node = makeNode();
    // Render page with selection so overlay exists
    created.length = 0;
    plugin.CanvasPage({ nodes: [node], selectedId: node.id });

    // Render element to get handlers
    const el = plugin.renderCanvasNode(node);
    const domEl = document.createElement('div');

    // First drag: move by (dx1, dy1) = (15, 12)
    el.props.onPointerDown({ currentTarget: domEl, clientX: 0, clientY: 0, pointerId: 1, target: { setPointerCapture(){} }, stopPropagation(){} });
    el.props.onPointerMove({ currentTarget: domEl, clientX: 15, clientY: 12 });
    // Allow rAF
    await new Promise(r => setTimeout(r, 25));
    el.props.onPointerUp({ currentTarget: domEl, clientX: 15, clientY: 12, pointerId: 1, target: { releasePointerCapture(){} } });

    // After first drop: instance CSS updated to (25,32)
    const inst1 = document.getElementById(`component-instance-css-${node.id}`);
    const c1 = (inst1?.textContent||'').replace(/\s+/g, '');
    expect(c1).toContain(`.${node.cssClass}{position:absolute;left:25px;top:32px;`.replace(/\s+/g, ''));

    // Overlay base CSS should now reflect (25,32)
    const ov1 = document.getElementById(`overlay-css-${node.id}`);
    const o1 = (ov1?.textContent||'').replace(/\s+/g, '');
    expect(o1).toContain(`.rx-overlay-${node.id}{position:absolute;left:25px;top:32px;`.replace(/\s+/g, ''));

    // Second drag: move by (dx2, dy2) = (5, 7)
    el.props.onPointerDown({ currentTarget: domEl, clientX: 0, clientY: 0, pointerId: 2, target: { setPointerCapture(){} }, stopPropagation(){} });
    el.props.onPointerMove({ currentTarget: domEl, clientX: 5, clientY: 7 });
    await new Promise(r => setTimeout(r, 25));
    el.props.onPointerUp({ currentTarget: domEl, clientX: 5, clientY: 7, pointerId: 2, target: { releasePointerCapture(){} } });

    // Final expected position = (25+5, 32+7) = (30, 39)
    const inst2 = document.getElementById(`component-instance-css-${node.id}`);
    const c2 = (inst2?.textContent||'').replace(/\s+/g, '');
    expect(c2).toContain(`.${node.cssClass}{position:absolute;left:30px;top:39px;`.replace(/\s+/g, ''));

    const ov2 = document.getElementById(`overlay-css-${node.id}`);
    const o2 = (ov2?.textContent||'').replace(/\s+/g, '');
    expect(o2).toContain(`.rx-overlay-${node.id}{position:absolute;left:30px;top:39px;`.replace(/\s+/g, ''));
  });
});

