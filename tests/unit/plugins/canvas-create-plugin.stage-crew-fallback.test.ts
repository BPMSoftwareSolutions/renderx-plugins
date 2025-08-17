import { loadRenderXPlugin, createTestLogger } from "../../utils/renderx-plugin-loader";

describe("Canvas Create Plugin + Stage Crew fallback (no ctx.stageCrew)", () => {
  const pluginPath = "RenderX/public/plugins/canvas-create-plugin/index.js";
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  test("falls back to @communication/StageCrew.getStageCrew when ctx.stageCrew is missing", async () => {
    const component = { metadata: { type: "Button" } };
    const position = { x: 5, y: 7 };

    const calls: any[] = [];
    const txn = {
      upsertStyle: jest.fn().mockImplementation((id: string, cssText: string) => { calls.push({ op: "upsertStyle", id, cssText }); return txn; }),
      commit: jest.fn().mockReturnValue(undefined),
    };
    const sc = { beginBeat: jest.fn().mockImplementation((_cid: string, meta: any) => { calls.push({ op: "beginBeat", meta }); return txn; }) };

    const mod = await import("@communication/StageCrew");
    const spy = jest.spyOn(mod as any, "getStageCrew").mockReturnValue(sc as any);

    const ctx: any = { payload: {}, logger: createTestLogger() }; // no stageCrew
    const res = plugin.handlers.createCanvasComponent({ component, position }, ctx);

    expect(spy).toHaveBeenCalled();
    const upserts = calls.filter((c) => c.op === "upsertStyle");
    expect(upserts.length).toBeGreaterThan(0);
    expect(upserts.some((u) => u.id === `component-instance-css-${res.id}`)).toBe(true);
  });
});

