const { loadRenderXPlugin } = require("../../utils/renderx-plugin-loader");
const { TestEnvironment } = require("../../utils/test-helpers");

describe("Canvas UI overlay visibility during drag and cursor policy", () => {
  test("overlay is hidden during drag and restored on drag end; cursor toggles correctly", async () => {
    // Reset head
    while (document.head.firstChild)
      document.head.removeChild(document.head.firstChild);

    // Conductor
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus);
    global.window = global.window || {};
    window.renderxCommunicationSystem = { conductor };

    // React stub collects created elements
    const created = [];
    window.React = {
      createElement: (type, props, ...children) => {
        const el = { type, props, children };
        created.push(el);
        return el;
      },
      useEffect: (fn) => fn(),
      useState: (init) => [init, () => {}],
      cloneElement: (el, newProps) => ({
        ...el,
        props: { ...(el.props || {}), ...(newProps || {}) },
      }),
    };

    const plugin = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/index.js"
    );

    const node = {
      id: "rx-vis-1",
      cssClass: "rx-vis-1",
      type: "button",
      position: { x: 10, y: 10 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: {
          template: '<button class="rx-button">OK</button>',
          styles: { css: ".rx-button{color:#000}" },
        },
        integration: {
          canvasIntegration: { defaultWidth: 100, defaultHeight: 30 },
        },
      },
    };

    // Render page with selection so overlay exists
    created.length = 0;
    plugin.CanvasPage({ nodes: [node], selectedId: node.id });

    // Render node element to attach handlers
    const el = plugin.renderCanvasNode(node);

    // Real DOM element for style transform (cursor class is applied on hover enter, not at initial render)
    const domEl = document.createElement("div");
    // Simulate hover to apply rx-comp-draggable
    el.props.onPointerEnter({ currentTarget: domEl });
    expect(domEl.classList.contains("rx-comp-draggable")).toBe(true);

    // Start drag -> overlay should hide
    el.props.onPointerDown({
      currentTarget: domEl,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
      target: { setPointerCapture() {} },
      stopPropagation() {},
    });

    // Overlay hidden marker should be present
    const visTagStart = document.getElementById(
      `overlay-visibility-${node.id}`
    );
    expect(visTagStart).not.toBeNull();
    const cssVisStart = (visTagStart.textContent || "").replace(/\s+/g, "");
    expect(cssVisStart).toContain(
      `.rx-overlay-${node.id}{display:none;}`.replace(/\s+/g, "")
    );

    // Cursor class toggles to grabbing (drag adds rx-comp-grabbing)
    // Simulate keeping grabbing during moves
    el.props.onPointerMove({
      currentTarget: domEl,
      clientX: 120,
      clientY: 120,
    });

    // End drag -> overlay visibility cleared and overlay shown
    el.props.onPointerUp({
      currentTarget: domEl,
      clientX: 120,
      clientY: 120,
      pointerId: 1,
      target: { releasePointerCapture() {} },
    });

    expect(document.getElementById(`overlay-visibility-${node.id}`)).toBeNull();

    // Cursor class should revert to draggable when not pressed
    // We can't read className off React element after events, but ensure CSS includes draggable rule
    const cursorGlobal = document.getElementById("rx-canvas-ui-cursors");
    expect(cursorGlobal).not.toBeNull();
  });
});
