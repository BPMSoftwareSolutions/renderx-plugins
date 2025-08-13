const { loadRenderXPlugin } = require("../../utils/renderx-plugin-loader");
const { TestEnvironment } = require("../../utils/test-helpers");

/**
 * Verifies that while dragging, the component position stays mapped to the cursor
 * precisely: newPos = startPos + (cursor - origin)
 */

describe("UI Drag: component follows cursor precisely", () => {
  test("drag positions are in sync with cursor deltas from origin", async () => {
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus);
    global.window = global.window || {};
    window.renderxCommunicationSystem = { conductor };

    // Record created elements
    const created = [];
    const logs = [];
    const orig = console.log;
    window.React = {
      createElement: (type, props, ...children) => { const el = { type, props, children }; created.push(el); return el; },
      cloneElement: (el, props, ...children) => { const ne = { type: el.type, props: { ...(el.props||{}), ...(props||{}) }, children: children.length ? children : el.children }; created.push(ne); return ne; },
      useEffect: (fn) => fn(),
      useState: (init) => [init, () => {}],
    };
    console.log = (...args) => { try { logs.push(String(args[0])); } catch {} return orig.apply(console, args); };

    try {
      const ui = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");
      const node = {
        id: "rx-comp-button-xyzzz",
        cssClass: "rx-comp-button-xyzzz",
        type: "button",
        position: { x: 50, y: 60 },
        component: {
          metadata: { name: "Button", type: "button" },
          ui: {
            template: '<button class="rx-button">OK</button>',
            styles: { css: ".rx-button{background:#123;color:#fff;border:1px solid #123;}" },
          },
          integration: { canvasIntegration: { defaultWidth: 90, defaultHeight: 28 } },
        },
      };

      // Render element
      ui.renderCanvasNode(node);

      const el = created.slice().reverse().find(c => c && c.props && typeof c.props.onDragStart === 'function');
      expect(el).toBeTruthy();

      // Start drag at origin (200, 150)
      el.props.onDragStart({ clientX: 200, clientY: 150, stopPropagation(){} });

      // Move by (+30, +25)
      el.props.onDrag({ clientX: 230, clientY: 175 });
      await new Promise(r => setTimeout(r, 10));

      // Position should be startPos + delta = (50+30, 60+25) = (80, 85)
      const tag = document.getElementById(`component-instance-css-${node.id}`);
      expect(tag).toBeTruthy();
      const css = (tag.textContent || '').replace(/\s+/g, '');
      expect(css).toContain(`.${node.cssClass}{position:absolute;left:80px;top:85px;box-sizing:border-box;display:block;}`.replace(/\s+/g, ''));

      // Move again by (-10, +5) from origin -> client (190, 155)
      el.props.onDrag({ clientX: 190, clientY: 155 });
      await new Promise(r => setTimeout(r, 10));
      const css2 = (tag.textContent || '').replace(/\s+/g, '');
      // Now expected (start 50,60 + delta -10, +5) = (40, 65)
      expect(css2).toContain(`.${node.cssClass}{position:absolute;left:40px;top:65px;box-sizing:border-box;display:block;}`.replace(/\s+/g, ''));

      // End drag via mouseup
      window.dispatchEvent(new Event('mouseup'));
    } finally {
      console.log = orig;
      delete window.React;
      while (document.head.firstChild) document.head.removeChild(document.head.firstChild);
    }
  });
});

