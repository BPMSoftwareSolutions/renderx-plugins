import { loadRenderXPlugin } from "../../../utils/renderx-plugin-loader";

const pluginPath = "RenderX/public/plugins/canvas-ui-plugin/index.js";

describe("RenderX Canvas UI Plugin (canvas.ui-symphony)", () => {
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  test("exports sequence and handlers", () => {
    expect(plugin.sequence).toBeTruthy();
    expect(plugin.handlers).toBeTruthy();
    expect(typeof plugin.handlers.noop).toBe("function");
    expect(plugin.sequence.id).toBe("Canvas.ui-symphony");
  });

  test("sequence registers in SequenceRegistry", async () => {
    const { SequenceRegistry } = await import(
      "../../../../modules/communication/sequences/core/SequenceRegistry"
    );
    const { EventBus } = await import(
      "../../../../modules/communication/EventBus"
    );
    const registry = new SequenceRegistry(new EventBus());
    expect(() => registry.register(plugin.sequence)).not.toThrow();
  });

  describe("UI export", () => {
    test("CanvasPage is exported as a function", () => {
      expect(typeof plugin.CanvasPage).toBe("function");
    });

    test("CanvasPage returns null when window.React is not available", () => {
      const original = (global as any).window?.React;
      try {
        (global as any).window.React = undefined;
        const result = plugin.CanvasPage({});
        expect(result).toBeNull();
      } finally {
        (global as any).window.React = original;
      }
    });
  });
});

test("CanvasPage calls play(pluginName, sequenceId) after plugin is mounted", () => {
  const originalWindow: any = (global as any).window;
  const play = jest.fn();

  const w: any = (global as any).window || {};
  w.React = { useEffect: (fn: any) => fn(), createElement: () => ({}) };
  w.renderxCommunicationSystem = {
    conductor: {
      getMountedPluginIds: () => ["Canvas.ui-symphony"],
      play,
    },
  };
  delete w.__rx_canvas_ui_played__;
  (global as any).window = w;

  try {
    const pluginLocal = loadRenderXPlugin(pluginPath);
    pluginLocal.CanvasPage({});
    expect(play).toHaveBeenCalledWith(
      "Canvas.ui-symphony",
      "Canvas.ui-symphony",
      expect.any(Object)
    );
  } finally {
    (global as any).window = originalWindow;
  }
});

test("CanvasPage waits until plugin is mounted before calling play", () => {
  jest.useFakeTimers();
  const originalWindow: any = (global as any).window;
  const play = jest.fn();

  let mounted = false;
  const getMountedPlugins = jest.fn(() =>
    mounted ? ["Canvas.ui-symphony"] : []
  );

  const w: any = (global as any).window || {};
  w.React = { useEffect: (fn: any) => fn(), createElement: () => ({}) };
  w.renderxCommunicationSystem = {
    conductor: {
      getMountedPluginIds: getMountedPlugins,
      play,
    },
  };
  delete w.__rx_canvas_ui_played__;
  (global as any).window = w;

  try {
    const pluginLocal = loadRenderXPlugin(pluginPath);
    pluginLocal.CanvasPage({});
    // Initially not mounted, should schedule retry
    expect(play).not.toHaveBeenCalled();
    expect(getMountedPlugins).toHaveBeenCalled();

    // Now simulate plugin becomes mounted
    mounted = true;
    jest.advanceTimersByTime(200);
    jest.runOnlyPendingTimers();

    expect(play).toHaveBeenCalledWith(
      "Canvas.ui-symphony",
      "Canvas.ui-symphony",
      expect.any(Object)
    );
  } finally {
    jest.useRealTimers();
    (global as any).window = originalWindow;
  }
});
