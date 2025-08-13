const { loadRenderXPlugin } = require("../../utils/renderx-plugin-loader");
const { TestEnvironment } = require("../../utils/test-helpers");

/**
 * End-to-end flow: Library drop -> Conductor -> Canvas create -> UI render
 * Validates:
 * - Conductor play log for Library.component-drop-symphony
 * - EventBus forwarding log to Canvas.component-create-symphony
 * - onComponentCreated payload shape
 * - renderCanvasNode creates correct element and injects CSS (component + instance)
 */

describe("E2E: Library drop to Canvas create -> UI DOM/CSS", () => {
  test("end-to-end drop renders expected element and CSS, logs expected sequence", async () => {
    // Arrange conductor/event bus and capture logs
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus);

    const busLogs = [];
    const unsubscribe = eventBus.subscribe("musical-conductor:log", (entry) => {
      try { busLogs.push(entry?.message?.[0]); } catch {}
    });

    const logs = [];
    const orig = console.log;
    console.log = (...args) => {
      try { logs.push(String(args[0])); } catch {}
      return orig.apply(console, args);
    };

    try {
      // Load Canvas UI plugin (for renderCanvasNode) and drop helper
      const ui = loadRenderXPlugin(
        "RenderX/public/plugins/canvas-ui-plugin/index.js"
      );
      const helper = loadRenderXPlugin(
        "RenderX/public/plugins/canvas-ui-plugin/handlers/drop.js"
      );

      // Stub minimal window.React for renderCanvasNode to work and record created elements
      const created = [];
      global.window = global.window || {};
      window.React = {
        createElement: (type, props, ...children) => {
          created.push({ type, props, children });
          return { type, props, children };
        },
        useEffect: (fn) => fn(),
        useState: (init) => [init, () => {}],
        cloneElement: (el, props, ...children) => ({
          type: el.type,
          props: { ...(el.props || {}), ...(props || {}) },
          children: (children && children.length ? children : el.children) || [],
        }),
      };

      // Fake drop event with coordinates and drag payload
      const component = {
        metadata: { name: "Button", type: "button" },
        ui: {
          template:
            '<button class="rx-button rx-button--{{variant}} rx-button--{{size}}">{{content}}</button>',
          styles: { css: ".rx-button{background:#123;color:#fff;border:1px solid #123;}" },
        },
        integration: { canvasIntegration: { defaultWidth: 90, defaultHeight: 28 } },
      };
      const dragData = { component };
      const json = JSON.stringify(dragData);

      const currentTarget = {
        getBoundingClientRect: () => ({ left: 5, top: 7 }),
      };
      const e = {
        clientX: 105,
        clientY: 47,
        currentTarget,
        dataTransfer: { getData: (t) => (t === "application/json" ? json : "") },
        preventDefault: () => {},
      };

      let createdNode = null;
      const onComponentCreated = (node) => {
        createdNode = node;
        // Simulate Canvas UI rendering of the new node
        ui.renderCanvasNode({
          id: node.id,
          cssClass: node.cssClass,
          type: node.type,
          position: node.position,
          component: node.component,
          variant: "primary",
          size: "md",
          content: "Button",
          width: 90,
          height: 28,
        });
      };

      // Act: perform drop via helper (what CanvasPage wires up under the hood)
      helper.handleCanvasDrop(conductor, e, { onComponentCreated });

      // Allow microtasks in the shim
      await new Promise((r) => setTimeout(r, 10));

      // Assert: conductor logged Library drop play
      expect(
        logs.some((l) =>
          l.includes("PluginInterfaceFacade.play(): Library.component-drop-symphony")
        )
      ).toBe(true);

      // Assert: forwarding log present on event bus
      expect(
        busLogs.some((l) =>
          typeof l === "string" && l.includes("Forwarding to Canvas.component-create-symphony")
        )
      ).toBe(true);

      // Assert: onComponentCreated payload shape and coords computed correctly
      expect(createdNode).toBeTruthy();
      expect(createdNode.type).toBe("button");
      expect(createdNode.position).toEqual({ x: 100, y: 40 }); // 105-5, 47-7
      expect(createdNode.id && createdNode.cssClass).toBeTruthy();

      // Assert: UI rendered a button as first created element
      expect(created.length).toBeGreaterThan(0);
      const first = created[0];
      expect(first.type).toBe("button");
      const className = String(first?.props?.className || "");
      expect(className).toContain("rx-button");
      // Instance class equals id/cssClass
      const instanceClass = createdNode.cssClass;
      expect(className).toContain(instanceClass);

      // No inline styles used on element
      expect(
        first?.props?.style == null || Object.keys(first?.props?.style || {}).length === 0
      ).toBe(true);

      // Component CSS and instance CSS injected
      const styleTags = Array.from(document.head.querySelectorAll("style"));
      expect(styleTags.length).toBeGreaterThan(0);
      expect(styleTags.some((s) => /\.rx-button\s*\{/.test(s.textContent || ""))).toBe(
        true
      );
      const instTag = document.getElementById(
        `component-instance-css-${createdNode.id}`
      );
      expect(instTag).toBeTruthy();
      const instCss = (instTag?.textContent || "").replace(/\s+/g, "");
      expect(instCss).toContain(`.${instanceClass}{position:absolute;left:100px;top:40px;box-sizing:border-box;display:block;}`.replace(/\s+/g, ""));
      expect(instCss).toContain(`.${instanceClass}{width:90px;}`.replace(/\s+/g, ""));
      expect(instCss).toContain(`.${instanceClass}{height:28px;}`.replace(/\s+/g, ""));
    } finally {
      // Cleanup
      unsubscribe && unsubscribe();
      console.log = orig;
      // reset head styles to avoid leaks
      while (document.head.firstChild) document.head.removeChild(document.head.firstChild);
      delete window.React;
    }
  });
});

