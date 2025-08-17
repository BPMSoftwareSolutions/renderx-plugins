import { loadRenderXPlugin, createTestLogger } from "../../utils/renderx-plugin-loader";

describe("Canvas Drag Plugin + Stage Crew fallback (no ctx.stageCrew)", () => {
  const pluginPath = "RenderX/public/plugins/canvas-drag-plugin/index.js";
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  test("falls back to @communication/StageCrew.getStageCrew when ctx.stageCrew is missing", async () => {
    const ctx: any = { payload: { drag: { origin: { x: 1, y: 2 } } }, logger: createTestLogger() };

    const calls: any[] = [];
    const txn = {
      update: jest.fn().mockImplementation((selector: string, patch: any) => { calls.push({ op: "update", selector, patch }); return txn; }),
      commit: jest.fn().mockImplementation((opts?: any) => { calls.push({ op: "commit", opts }); return undefined; }),
    };
    const sc = { beginBeat: jest.fn().mockImplementation((_cid: string, meta: any) => { calls.push({ op: "beginBeat", meta }); return txn; }) };

    const mod = await import("@communication/StageCrew");
    const spy = jest.spyOn(mod as any, "getStageCrew").mockReturnValue(sc as any);

    const res = plugin.handlers.handleDragMove({ elementId: "n1", delta: { dx: 9, dy: 9 } }, ctx);

    expect(spy).toHaveBeenCalled();
    expect(calls.some((c) => c.op === "update" && c.selector === "#n1")).toBe(true);
    expect(calls.some((c) => c.op === "commit" && c.opts?.batch === true)).toBe(true);
    expect(res.position).toEqual({ x: 10, y: 11 });
  });
});

