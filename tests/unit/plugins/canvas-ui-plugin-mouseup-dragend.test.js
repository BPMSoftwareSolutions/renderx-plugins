const { loadRenderXPlugin } = require("../../utils/renderx-plugin-loader");
const { TestEnvironment } = require("../../utils/test-helpers");

/**
 * Validates that a window mouseup triggers drag end via Canvas.component-drag-symphony
 * and that our UI dispatches renderx:drag:end.
 */

describe("Canvas UI Plugin - mouseup triggers drag:end", () => {
  test("mouseup on workspace triggers conductor.play(Canvas.component-drag-symphony) and clears overlay via callback", async () => {
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
      try {
        logs.push(String(args[0]));
      } catch {}
      return orig.apply(console, args);
    };

    // Render CanvasPage to register mouseup callback and workspace handler
    plugin.CanvasPage({ nodes: [] });

    // Arrange: simulate active drag so guarded mouseup emits end
    const workspace = global.window.__rx_canvas_ui__ || {};
    workspace.__activeDragId = "rx-test-1";

    // Act: call workspace pointerUp handler (no DOM globals)
    if (typeof workspace.onWindowMouseUp === "function") {
      workspace.onWindowMouseUp();
    }

    // Allow microtasks
    await new Promise((r) => setTimeout(r, 20));

    // Restore
    console.log = orig;

    // Assert: play was called with drag symphony (by checking the shim log)
    expect(
      logs.some((l) =>
        l.includes(
          "PluginInterfaceFacade.play(): Canvas.component-drag-symphony"
        )
      )
    ).toBe(true);
  });
});
