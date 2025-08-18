import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

function makeStageCrewRecorder() {
  const ops: any[] = [];
  const beginBeat = jest.fn((corrId: string, meta: any) => {
    const txn: any = {
      upsertStyleTag: jest.fn((id: string, cssText: string) => {
        ops.push({ type: "upsertStyleTag", id, cssText });
        return txn;
      }),
      commit: jest.fn((options?: any) => {
        ops.push({ type: "commit", options });
        return undefined;
      }),
    };
    ops.push({ type: "beginBeat", corrId, meta });
    return txn;
  });
  return { ops, beginBeat };
}

describe("Canvas UI styles - StageCrew-only", () => {
  const pluginPath = "RenderX/public/plugins/canvas-ui-plugin/utils/styles.js";

  test("overlayEnsureGlobalCSS throws without stageCrew", () => {
    const mod: any = loadRenderXPlugin(pluginPath);
    expect(() => mod.overlayEnsureGlobalCSS(null as any)).toThrow(/StageCrew/i);
  });

  test("overlayEnsureGlobalCSS uses StageCrew upsertStyleTag + commit", () => {
    const mod: any = loadRenderXPlugin(pluginPath);
    const { ops, beginBeat } = makeStageCrewRecorder();

    mod.overlayEnsureGlobalCSS({ beginBeat });

    const upserts = ops.filter((o) => o.type === "upsertStyleTag");
    expect(upserts.length).toBe(1);
    expect(upserts[0].id).toBe("overlay-css-global");
    expect(typeof upserts[0].cssText).toBe("string");
    expect(upserts[0].cssText.length).toBeGreaterThan(0);
    expect(ops.some((o) => o.type === "commit")).toBe(true);
  });

  test("overlayEnsureInstanceCSS throws without stageCrew", () => {
    const mod: any = loadRenderXPlugin(pluginPath);
    expect(() => mod.overlayEnsureInstanceCSS(null as any, { id: "x" }, 10, 20)).toThrow(/StageCrew/i);
  });

  test("overlayEnsureInstanceCSS uses StageCrew upsertStyleTag + commit per instance", () => {
    const mod: any = loadRenderXPlugin(pluginPath);
    const { ops, beginBeat } = makeStageCrewRecorder();

    mod.overlayEnsureInstanceCSS({ beginBeat }, { id: "abc", position: { x: 5, y: 7 } }, 100, 80);

    const upserts = ops.filter((o) => o.type === "upsertStyleTag");
    expect(upserts.length).toBe(1);
    expect(upserts[0].id).toBe("overlay-css-abc");
    expect(upserts[0].cssText).toMatch(/rx-overlay-abc/);
    expect(ops.some((o) => o.type === "commit")).toBe(true);
  });
});

