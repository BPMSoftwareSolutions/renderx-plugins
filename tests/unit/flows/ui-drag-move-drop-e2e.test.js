const { loadRenderXPlugin } = require("../../utils/renderx-plugin-loader");
const { TestEnvironment } = require("../../utils/test-helpers");

/**
 * UI E2E: Start drag on a rendered component -> move during drag -> mouseup drop
 * Validates that UI wiring triggers Canvas.component-drag-symphony (start/move/end),
 * onDragUpdate updates position CSS and state, and drop flow still works in concert.
 */

describe("UI E2E: canvas component drag start/move/end wiring", () => {
  test("dragstart plays start, drag plays move with delta and updates CSS", async () => {
    // Arrange test conductor
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus);
    global.window = global.window || {};
    window.renderxCommunicationSystem = { conductor };

    // Record logs to ensure drag symphony runs
    const logs = [];
    const orig = console.log;
    console.log = (...args) => {
      try {
        logs.push(String(args[0]));
      } catch {}
      return orig.apply(console, args);
    };

    // Minimal React stub to render element and capture props
    const created = [];
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

    try {
      const ui = loadRenderXPlugin(
        "RenderX/public/plugins/canvas-ui-plugin/index.js"
      );

      // Seed one node and use renderCanvasNode directly (ensures element receives drag handlers)
      const node = {
        id: "rx-comp-button-abcde",
        cssClass: "rx-comp-button-abcde",
        type: "button",
        position: { x: 10, y: 20 },
        component: {
          metadata: { name: "Button", type: "button" },
          ui: {
            template:
              '<button class="rx-button rx-button--{{variant}} rx-button--{{size}}">{{content}}</button>',
            styles: {
              css: ".rx-button{background:#123;color:#fff;border:1px solid #123;}",
            },
          },
          integration: {
            canvasIntegration: { defaultWidth: 90, defaultHeight: 28 },
          },
        },
      };

      ui.renderCanvasNode({ ...node });

      // Find any element that has pointer handlers attached
      const draggableEl = created
        .slice()
        .reverse()
        .find(
          (c) => c && c.props && typeof c.props.onPointerDown === "function"
        );
      expect(draggableEl).toBeTruthy();

      // Create a real DOM element to receive style transforms
      const domEl = document.createElement("div");

      // Act 1: pointerdown at (100, 100)
      draggableEl.props.onPointerDown({
        currentTarget: domEl,
        clientX: 100,
        clientY: 100,
        pointerId: 1,
        target: { setPointerCapture() {} },
        stopPropagation() {},
      });

      // Act 2: pointer move to (120, 115) -> delta (20, 15)
      draggableEl.props.onPointerMove({
        currentTarget: domEl,
        clientX: 120,
        clientY: 115,
      });

      // Allow a frame for rAF application + conductor shim
      await new Promise((r) => setTimeout(r, 20));

      // Assert: logs include drag symphony plays
      expect(
        logs.some((l) =>
          l.includes(
            "PluginInterfaceFacade.play(): Canvas.component-drag-symphony"
          )
        )
      ).toBe(true);

      // During drag, we only apply GPU transform (not CSS left/top yet)
      const styleNow = domEl.getAttribute("style") || "";
      expect(styleNow).toContain("translate3d(20px, 15px, 0)");

      // Instance CSS should still reflect original start position before pointerup commit
      const instTag = document.getElementById(
        `component-instance-css-${node.id}`
      );
      expect(instTag).toBeTruthy();
      const cssBefore = (instTag.textContent || "").replace(/\s+/g, "");
      expect(cssBefore).toContain(
        `.${node.cssClass}{position:absolute;left:10px;top:20px;box-sizing:border-box;display:block;}`.replace(
          /\s+/g,
          ""
        )
      );

      // Act 3: element pointerup ends drag and commits absolute CSS
      draggableEl.props.onPointerUp({
        currentTarget: domEl,
        clientX: 120,
        clientY: 115,
        pointerId: 1,
        target: { releasePointerCapture() {} },
      });
      await new Promise((r) => setTimeout(r, 20));

      const cssAfter = (instTag.textContent || "").replace(/\s+/g, "");
      // With startPos (10,20), origin (100,100) and cursor (120,115): newPos = (10,20) + (20,15) => (30,35)
      expect(cssAfter).toContain(
        `.${node.cssClass}{position:absolute;left:30px;top:35px;box-sizing:border-box;display:block;}`.replace(
          /\s+/g,
          ""
        )
      );

      // Clean logs
      console.log = orig;
    } finally {
      delete window.React;
      while (document.head.firstChild)
        document.head.removeChild(document.head.firstChild);
    }
  });
});
