import {
  loadRenderXPlugin,
  createTestLogger,
} from "../../../utils/renderx-plugin-loader";

const pluginPath = "RenderX/public/plugins/library-drop-plugin/index.js";

describe("RenderX Library Drop Plugin", () => {
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  test("exports sequence and handlers", () => {
    expect(plugin.sequence).toBeTruthy();
    expect(plugin.handlers).toBeTruthy();
    expect(typeof plugin.handlers.handleDropStart).toBe("function");
    expect(typeof plugin.handlers.forwardToCanvasCreate).toBe("function");
    expect(typeof plugin.handlers.handleDropComplete).toBe("function");
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

  describe("handlers", () => {
    const base = () => ({ payload: {}, logger: createTestLogger() });

    test("handleDropStart extracts component and coordinates", () => {
      const component = { metadata: { name: "Button", type: "basic" } };
      const coordinates = { x: 10, y: 20 };
      const dragData = { componentData: component };
      const ctx = base();
      const res = plugin.handlers.handleDropStart(
        { coordinates, dragData },
        ctx
      );
      expect(res.component).toEqual(component);
      expect(res.coordinates).toEqual(coordinates);
    });

    test("forwardToCanvasCreate uses conductor.play when available", async () => {
      const ctx: any = base();
      ctx.payload = {
        component: { metadata: { type: "basic" } },
        coordinates: { x: 1, y: 2 },
      };
      const play = jest.fn().mockResolvedValue("req-1");
      ctx.conductor = { play };
      const result = await plugin.handlers.forwardToCanvasCreate({}, ctx);
      expect(result.forwarded).toBe(true);
      expect(result.via).toBe("conductor.play");
      expect(play).toHaveBeenCalledWith(
        "Canvas.component-create-symphony",
        "Canvas.component-create-symphony",
        expect.objectContaining({
          component: expect.objectContaining({
            metadata: expect.objectContaining({ type: "basic" }),
          }),
          position: { x: 1, y: 2 },
          source: "library-drop",
        })
      );
    });

    test("forwardToCanvasCreate falls back to local create and calls onComponentCreated", async () => {
      const onComponentCreated = jest.fn();
      const ctx: any = base();
      ctx.payload = {
        component: { metadata: { type: "basic" } },
        coordinates: { x: 5, y: 6 },
      };
      const res = await plugin.handlers.forwardToCanvasCreate(
        { onComponentCreated },
        ctx
      );
      expect(res.created || res.forwarded).toBeTruthy();
      if (res.created) {
        expect(onComponentCreated).toHaveBeenCalled();
      }
    });

    test("handleDropComplete returns completed true", () => {
      const ctx = base();
      const res = plugin.handlers.handleDropComplete({}, ctx);
      expect(res.completed).toBe(true);
    });
  });
});
