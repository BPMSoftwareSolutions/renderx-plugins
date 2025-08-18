import { loadRenderXPlugin, createTestLogger } from "../../utils/renderx-plugin-loader";

describe("Canvas Drag Plugin + Stage Crew (TDD)", () => {
  const pluginPath = "RenderX/public/plugins/canvas-drag-plugin/index.js";
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  test("handleDragMove commits position/style updates via ctx.stageCrew (batched)", () => {
    const ctx: any = { payload: { drag: { origin: { x: 10, y: 20 } } }, logger: createTestLogger() };

    // Stage Crew stub
    const calls: any[] = [];
    const txn = {
      update: jest.fn().mockImplementation((selector: string, patch: any) => {
        calls.push({ op: "update", selector, patch });
        return txn;
      }),
      commit: jest.fn().mockImplementation((opts?: any) => {
        calls.push({ op: "commit", opts });
        return undefined;
      }),
    };
    ctx.stageCrew = {
      beginBeat: jest.fn().mockImplementation((_cid: string, meta: any) => {
        calls.push({ op: "beginBeat", meta });
        return txn;
      }),
    };

    // Drag by dx=5, dy=-3
    const res = plugin.handlers.handleDragMove({ elementId: "n1", delta: { dx: 5, dy: -3 } }, ctx);

    // Expect payload to carry elementId and position
    expect(res.elementId).toBe("n1");
    expect(res.position).toEqual({ x: 15, y: 17 });

    // Expect Stage Crew beat with handlerName
    const started = calls.find((c) => c.op === "beginBeat");
    expect(started?.meta?.handlerName || "").toMatch(/dragMove/i);

    // Expect update routed to element selector
    const upd = calls.find((c) => c.op === "update");
    expect(upd?.selector).toBe("#n1");
    expect(upd?.patch?.style?.left).toBe("15px");
    expect(upd?.patch?.style?.top).toBe("17px");

    // Expect batched commit
    const cmt = calls.find((c) => c.op === "commit");
    expect(cmt?.opts?.batch).toBe(true);
  });
});

