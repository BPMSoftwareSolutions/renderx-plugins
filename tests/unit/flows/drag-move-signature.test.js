const { loadRenderXPlugin, createTestLogger } = require("../../utils/renderx-plugin-loader");
const { TestEnvironment } = require("../../utils/test-helpers");

/**
 * Drag Flow: Canvas.component-drag-symphony
 * - Verifies sequence signature (events order)
 * - Verifies baton updates (origin -> move position -> end callback)
 * - Verifies play() logs the expected sequence id
 */

describe("Integration Flow: Canvas.component-drag-symphony signature and baton", () => {
  test("start -> move -> end signature; updates and logs", async () => {
    const plugin = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-drag-plugin/index.js"
    );

    // 1) Sequence signature (beats order)
    const beats = plugin.sequence.movements[0].beats;
    const signature = beats.map((b) => b.event).join(" -> ");
    expect(signature).toBe(
      "canvas:element:drag:start -> canvas:element:moved -> canvas:element:drag:end"
    );

    // 2) Baton updates through handlers
    const ctx = { payload: {}, logger: createTestLogger() };

    const origin = { x: 10, y: 20 };
    const startRes = plugin.handlers.handleDragStart(
      { elementId: "id1", origin },
      ctx
    );
    if (startRes !== undefined)
      ctx.payload = { ...ctx.payload, ...startRes };

    const onDragUpdate = jest.fn();
    const moveRes = plugin.handlers.handleDragMove(
      { elementId: "id1", delta: { dx: 5, dy: -3 }, onDragUpdate },
      ctx
    );
    if (moveRes !== undefined) ctx.payload = { ...ctx.payload, ...moveRes };

    expect(onDragUpdate).toHaveBeenCalledWith({
      elementId: "id1",
      position: { x: 15, y: 17 },
    });

    const onDragEnd = jest.fn();
    plugin.handlers.handleDragEnd({ onDragEnd }, ctx);
    expect(onDragEnd).toHaveBeenCalled();

    // 3) Conductor play logs the sequence id
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus);

    const logs = [];
    const orig = console.log;
    console.log = (...args) => {
      try {
        logs.push(String(args[0]));
      } catch {}
      return orig.apply(console, args);
    };

    await conductor.play(
      plugin.sequence.id,
      plugin.sequence.id,
      { elementId: "id1", origin }
    );

    // small delay for async logging in shim (very short)
    await new Promise((r) => setTimeout(r, 10));

    // Restore console
    console.log = orig;

    expect(
      logs.some((l) =>
        l.includes("PluginInterfaceFacade.play(): Canvas.component-drag-symphony")
      )
    ).toBe(true);
  });
});

