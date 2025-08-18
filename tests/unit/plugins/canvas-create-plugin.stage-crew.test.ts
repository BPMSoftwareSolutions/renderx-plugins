import { loadRenderXPlugin, createTestLogger } from "../../utils/renderx-plugin-loader";

describe("Canvas Create Plugin + Stage Crew (TDD)", () => {
  const pluginPath = "RenderX/public/plugins/canvas-create-plugin/index.js";
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  test("createCanvasComponent routes initial instance CSS via ctx.stageCrew (upsertStyle)", () => {
    const component = { metadata: { type: "Button", name: "Button" } };
    const position = { x: 12, y: 34 };

    // Stage Crew stub to capture calls
    const calls: any[] = [];
    const txn = {
      upsertStyle: jest.fn().mockImplementation((id: string, cssText: string) => {
        calls.push({ op: "upsertStyle", id, cssText });
        return txn;
      }),
      commit: jest.fn().mockReturnValue(undefined),
    };
    const stageCrew = {
      beginBeat: jest.fn().mockImplementation((_cid: string, meta: any) => {
        calls.push({ op: "beginBeat", meta });
        return txn;
      }),
    };

    const ctx: any = { payload: {}, logger: createTestLogger(), stageCrew };

    const res = plugin.handlers.createCanvasComponent({ component, position }, ctx);

    // Drive design: must start a Stage Crew beat and write instance CSS
    expect(stageCrew.beginBeat).toHaveBeenCalled();
    const upserts = calls.filter((c) => c.op === "upsertStyle");
    expect(upserts.length).toBeGreaterThan(0);

    // The style tag id uses the created element id
    const expectedTagId = `component-instance-css-${res.id}`;
    expect(upserts.some((u) => u.id === expectedTagId)).toBe(true);

    // CSS must include absolute position using provided coordinates
    const cssJoined = upserts.map((u) => String(u.cssText || "")).join("\n").replace(/\s+/g, "");
    expect(cssJoined).toContain(`.${res.cssClass}{position:absolute;left:${position.x}px;top:${position.y}px;`);
  });
});

