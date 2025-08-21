import {
  loadRenderXPlugin,
  createTestLogger,
} from "../../utils/renderx-plugin-loader";

const pluginPath = "RenderX/public/plugins/canvas-drag-plugin/index.js";

describe("RenderX Canvas Drag Plugin", () => {
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  test("exports sequence and handlers", () => {
    expect(plugin.sequence).toBeTruthy();
    expect(plugin.handlers).toBeTruthy();
    expect(typeof plugin.handlers.handleDragStart).toBe("function");
    expect(typeof plugin.handlers.handleDragMove).toBe("function");
    expect(typeof plugin.handlers.handleDragEnd).toBe("function");
  });

  test("sequence registers in SequenceRegistry", async () => {
    const { SequenceRegistry } = await import(
      "@communication/sequences/core/SequenceRegistry"
    );
    const { EventBus } = await import("@communication/EventBus");
    const registry = new SequenceRegistry(new EventBus());
    expect(() => registry.register(plugin.sequence)).not.toThrow();
  });

  describe("handlers", () => {
    const base = () => ({ payload: {}, logger: createTestLogger() });

    test("handleDragStart persists origin", () => {
      const origin = { x: 100, y: 50 };
      const ctx: any = base();
      const res = plugin.handlers.handleDragStart(
        { elementId: "id1", origin },
        ctx
      );
      expect(res.drag.origin).toEqual(origin);
    });

    test("handleDragMove computes position and invokes onDragUpdate", () => {
      const origin = { x: 10, y: 20 };
      const delta = { dx: 5, dy: -3 };
      const onDragUpdate = jest.fn();
      const ctx: any = base();
      ctx.payload.drag = { origin };
      const res = plugin.handlers.handleDragMove(
        { elementId: "id1", delta, onDragUpdate },
        ctx
      );
      expect(res.position).toEqual({ x: 15, y: 17 });
      expect(onDragUpdate).toHaveBeenCalledWith({
        elementId: "id1",
        position: { x: 15, y: 17 },
      });
    });

    test("handleDragEnd calls onDragEnd if provided", () => {
      const onDragEnd = jest.fn();
      const ctx: any = base();
      const position = { x: 100, y: 200 };
      const res = plugin.handlers.handleDragEnd({
        elementId: "test-element",
        position,
        onDragEnd
      }, ctx);
      expect(onDragEnd).toHaveBeenCalledWith({ elementId: "test-element", position });
      expect(res).toEqual({});
    });
  });

    test("handleDragStart performs StageCrew beginBeat/update/commit", () => {
      const plugin: any = loadRenderXPlugin(pluginPath);
      const ops: any[] = [];
      const beginBeat = jest.fn((corrId: string, meta: any) => {
        const txn: any = {
          update: jest.fn((selector: string, payload: any) => { ops.push({ type: "update", selector, payload }); return txn; }),
          commit: jest.fn((options?: any) => { ops.push({ type: "commit", options }); return undefined; }),
        };
        ops.push({ type: "beginBeat", corrId, meta });
        return txn;
      });
      const ctx: any = { payload: {}, stageCrew: { beginBeat }, sequence: plugin.sequence };
      const origin = { x: 0, y: 0 };
      plugin.handlers.handleDragStart({ elementId: "id1", origin }, ctx);
      const startIdx = ops.findIndex((o) => o.type === "beginBeat" && /drag:start:id1/.test(o.corrId));
      expect(startIdx).toBeGreaterThanOrEqual(0);
      const update = ops.slice(startIdx + 1).find((o) => o.type === "update");
      expect(update).toBeTruthy();
      expect(update.selector).toBe("#id1");
      expect(ops.slice(startIdx + 1).some((o) => o.type === "commit")).toBe(true);
    });

    test("handleDragMove performs StageCrew beginBeat/update/commit with transform", () => {
      const plugin: any = loadRenderXPlugin(pluginPath);
      const ops: any[] = [];
      const beginBeat = jest.fn((corrId: string, meta: any) => {
        const txn: any = {
          update: jest.fn((selector: string, payload: any) => { ops.push({ type: "update", selector, payload }); return txn; }),
          commit: jest.fn((options?: any) => { ops.push({ type: "commit", options }); return undefined; }),
        };
        ops.push({ type: "beginBeat", corrId, meta });
        return txn;
      });
      const ctx: any = { payload: { drag: { origin: { x: 10, y: 20 } } }, stageCrew: { beginBeat }, sequence: plugin.sequence };
      plugin.handlers.handleDragMove({ elementId: "id1", delta: { dx: 7, dy: 9 } }, ctx);
      const frameIdx = ops.findIndex((o) => o.type === "beginBeat" && /drag:frame:id1/.test(o.corrId));
      expect(frameIdx).toBeGreaterThanOrEqual(0);
      const update = ops.slice(frameIdx + 1).find((o) => o.type === "update");
      expect(update).toBeTruthy();
      expect(update.selector).toBe("#id1");
      expect(String(update.payload?.style?.transform || "")).toMatch(/translate3d\(7px,\s*9px,\s*0\)/);
      expect(ops.slice(frameIdx + 1).some((o) => o.type === "commit")).toBe(true);
    });

    test("handleDragEnd clears transform, restores classes, and commits instance position CSS via UI helper", () => {
      const plugin: any = loadRenderXPlugin(pluginPath);
      const ops: any[] = [];
      const beginBeat = jest.fn((corrId: string, meta: any) => {
        const txn: any = {
          update: jest.fn((selector: string, payload: any) => { ops.push({ type: "update", selector, payload }); return txn; }),
          remove: jest.fn((selector: string) => { ops.push({ type: "remove", selector }); return txn; }),
          create: jest.fn((tagName: string, options: any) => {
            ops.push({ type: "create", tagName, options });
            return { appendTo: jest.fn((parent: string) => ops.push({ type: "appendTo", parent })) };
          }),
          commit: jest.fn((options?: any) => { ops.push({ type: "commit", options }); return undefined; }),
        };
        ops.push({ type: "beginBeat", corrId, meta });
        return txn;
      });
      const ctx: any = { payload: {}, stageCrew: { beginBeat }, sequence: plugin.sequence };

      plugin.handlers.handleDragEnd({ elementId: "id1", position: { x: 17, y: 29 }, instanceClass: "id1" }, ctx);

      // Ensure the StageCrew end beat committed
      const endIdx = ops.findIndex((o) => o.type === "beginBeat" && /drag:end:id1/.test(o.corrId));
      expect(endIdx).toBeGreaterThanOrEqual(0);
      expect(ops.slice(endIdx + 1).some((o) => o.type === "commit")).toBe(true);

      // Ensure instance position CSS beat was created
      const instancePosIdx = ops.findIndex((o) => o.type === "beginBeat" && /instance-position-id1/.test(o.corrId));
      expect(instancePosIdx).toBeGreaterThanOrEqual(0);

      // Ensure instance position CSS operations were performed
      const createOps = ops.filter((o) => o.type === "create" && o.tagName === "style");
      expect(createOps.length).toBeGreaterThan(0);

      const updateOps = ops.filter((o) => o.type === "update" && o.selector === "#component-instance-css-id1");
      expect(updateOps.length).toBeGreaterThan(0);
    });

});
