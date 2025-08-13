const { loadRenderXPlugin } = require("../../utils/renderx-plugin-loader");
const { TestEnvironment } = require("../../utils/test-helpers");

/**
 * Validates that a window mouseup triggers drag end via Canvas.component-drag-symphony
 * and that our UI dispatches renderx:drag:end.
 */

describe("Canvas UI Plugin - mouseup triggers drag:end", () => {
  test("window mouseup -> conductor.play(Canvas.component-drag-symphony) and dispatches renderx:drag:end", async () => {
    // Arrange conductor and expose to window
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus);
    global.window = global.window || {};
    global.window.renderxCommunicationSystem = { conductor };

    // React stub for CanvasPage render (we don't need actual DOM, only effect)
    global.window.React = {
      createElement: (_t, _p, ..._c) => ({}),
      useEffect: (fn) => fn(),
      useState: (init) => [init, () => {}],
      cloneElement: (el) => el,
    };

    const plugin = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/index.js"
    );

    // Spy on play logs
    const logs = [];
    const orig = console.log;
    console.log = (...args) => {
      try { logs.push(String(args[0])); } catch {}
      return orig.apply(console, args);
    };

    // Listen for UI drag-end custom event
    const dragEnd = { count: 0 };
    const onDragEndEvt = () => { dragEnd.count++; };
    window.addEventListener("renderx:drag:end", onDragEndEvt);

    // Render CanvasPage to register mouseup listener
    plugin.CanvasPage({ nodes: [] });

    // Act: dispatch mouseup
    window.dispatchEvent(new Event("mouseup"));

    // Allow microtasks
    await new Promise((r) => setTimeout(r, 20));

    // Restore
    window.removeEventListener("renderx:drag:end", onDragEndEvt);
    console.log = orig;

    // Assert: play was called with drag symphony (by checking the shim log)
    expect(
      logs.some((l) =>
        l.includes("PluginInterfaceFacade.play(): Canvas.component-drag-symphony")
      )
    ).toBe(true);
    // Assert: UI custom event dispatched exactly once
    expect(dragEnd.count).toBe(1);
  });
});

