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
      createElement: (type, props, ...children) => {
        const el = { type, props, children };
        created.push(el);
        return el;
      },
      cloneElement: (el, props, ...children) => {
        const ne = {
          type: el.type,
          props: { ...(el.props || {}), ...(props || {}) },
          children: children.length ? children : el.children,
        };
        created.push(ne);
        return ne;
      },
      useEffect: (fn) => fn(),
      useState: (init) => [init, () => {}],
    };
    console.log = (...args) => {
      try {
        logs.push(String(args[0]));
      } catch {}
      return orig.apply(console, args);
    };

    try {
      const ui = loadRenderXPlugin(
        "RenderX/public/plugins/canvas-ui-plugin/index.js"
      );
      const node = {
        id: "rx-comp-button-xyzzz",
        cssClass: "rx-comp-button-xyzzz",
        type: "button",
        position: { x: 50, y: 60 },
        component: {
          metadata: { name: "Button", type: "button" },
          ui: {
            template: '<button class="rx-button">OK</button>',
            styles: {
              css: ".rx-button{background:#123;color:#fff;border:1px solid #123;}",
            },
          },
          integration: {
            canvasIntegration: { defaultWidth: 90, defaultHeight: 28 },
          },
        },
      };

      // Stub requestAnimationFrame to run immediately
      const originalRaf = window.requestAnimationFrame;
      window.requestAnimationFrame = (cb) => {
        cb(performance.now());
        return 1;
      };

      // Render element
      ui.renderCanvasNode(node);

      const el = created
        .slice()
        .reverse()
        .find(
          (c) => c && c.props && typeof c.props.onPointerDown === "function"
        );
      expect(el).toBeTruthy();

      // Create a real DOM element to receive style transforms
      const domEl = document.createElement("div");

      // Start drag at origin (200, 150)
      el.props.onPointerDown({
        currentTarget: domEl,
        clientX: 200,
        clientY: 150,
        pointerId: 1,
        target: { setPointerCapture() {} },
        stopPropagation() {},
      });

      // Move by (+30, +25)
      el.props.onPointerMove({
        currentTarget: domEl,
        clientX: 230,
        clientY: 175,
      });
      await new Promise((r) => setTimeout(r, 10));

      // During drag, per-instance CSS remains at start; style transform reflects delta
      const tag = document.getElementById(`component-instance-css-${node.id}`);
      expect(tag).toBeTruthy();
      const cssStart = (tag.textContent || "").replace(/\s+/g, "");
      expect(cssStart).toContain(
        `.${node.cssClass}{position:absolute;left:50px;top:60px;box-sizing:border-box;display:block;}`.replace(
          /\s+/g,
          ""
        )
      );
      const style1 = domEl.getAttribute("style") || "";
      expect(style1).toContain("translate3d(30px, 25px, 0)");

      // Move again by (-10, +5) from origin -> client (190, 155)
      el.props.onPointerMove({
        currentTarget: domEl,
        clientX: 190,
        clientY: 155,
      });
      await new Promise((r) => setTimeout(r, 10));
      const style2 = domEl.getAttribute("style") || "";
      expect(style2).toContain("translate3d(-10px, 5px, 0)");

      // End drag via element pointerup -> commits final absolute CSS
      el.props.onPointerUp({
        currentTarget: domEl,
        clientX: 190,
        clientY: 155,
        pointerId: 1,
        target: { releasePointerCapture() {} },
      });
      await new Promise((r) => setTimeout(r, 10));
      const cssCommit = (tag.textContent || "").replace(/\s+/g, "");
      // Now expected (start 50,60 + delta -10, +5) = (40, 65)
      expect(cssCommit).toContain(
        `.${node.cssClass}{position:absolute;left:40px;top:65px;box-sizing:border-box;display:block;}`.replace(
          /\s+/g,
          ""
        )
      );
    } finally {
      console.log = orig;
      delete window.React;
      while (document.head.firstChild)
        document.head.removeChild(document.head.firstChild);
    }
  });
});
