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
  const pluginPath = "RenderX/public/plugins/canvas-ui-plugin/index.js";

  test("overlayEnsureGlobalCSS handles missing stageCrew gracefully", () => {
    const mod: any = loadRenderXPlugin(pluginPath);
    // Should not throw, but should not perform any operations either
    expect(() => mod.overlayEnsureGlobalCSS(null as any)).not.toThrow();
    expect(() => mod.overlayEnsureGlobalCSS({})).not.toThrow();
  });

  test("overlayEnsureGlobalCSS uses StageCrew create/update operations", () => {
    const mod: any = loadRenderXPlugin(pluginPath);
    const ops: any[] = [];
    const beginBeat = jest.fn((corrId: string, meta: any) => {
      const txn: any = {
        create: jest.fn((tagName: string, options: any) => {
          ops.push({ type: "create", tagName, options });
          return { appendTo: jest.fn((parent: string) => ops.push({ type: "appendTo", parent })) };
        }),
        update: jest.fn((selector: string, options: any) => {
          ops.push({ type: "update", selector, options });
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

    mod.overlayEnsureGlobalCSS({ beginBeat });

    const creates = ops.filter((o) => o.type === "create");
    expect(creates.length).toBe(1);
    expect(creates[0].tagName).toBe("style");
    expect(creates[0].options.attrs.id).toBe("overlay-css-global");

    const updates = ops.filter((o) => o.type === "update");
    expect(updates.length).toBe(1);
    expect(updates[0].selector).toBe("#overlay-css-global");
    expect(typeof updates[0].options.text).toBe("string");
    expect(updates[0].options.text.length).toBeGreaterThan(0);

    expect(ops.some((o) => o.type === "commit")).toBe(true);
  });

  test("overlayEnsureInstanceCSS handles missing stageCrew gracefully", () => {
    const mod: any = loadRenderXPlugin(pluginPath);
    // Should not throw, but should not perform any operations either
    expect(() => mod.overlayEnsureInstanceCSS(null as any, { id: "x" }, 10, 20)).not.toThrow();
    expect(() => mod.overlayEnsureInstanceCSS({}, { id: "x" }, 10, 20)).not.toThrow();
  });

  test("overlayEnsureInstanceCSS uses StageCrew create/remove operations per instance", () => {
    const mod: any = loadRenderXPlugin(pluginPath);
    const ops: any[] = [];
    const beginBeat = jest.fn((corrId: string, meta: any) => {
      const txn: any = {
        remove: jest.fn((selector: string) => {
          ops.push({ type: "remove", selector });
          return txn;
        }),
        create: jest.fn((tagName: string, options: any) => {
          ops.push({ type: "create", tagName, options });
          return { appendTo: jest.fn((parent: string) => ops.push({ type: "appendTo", parent })) };
        }),
        commit: jest.fn((options?: any) => {
          ops.push({ type: "commit", options });
          return undefined;
        }),
      };
      ops.push({ type: "beginBeat", corrId, meta });
      return txn;
    });

    mod.overlayEnsureInstanceCSS({ stageCrew: { beginBeat } }, { id: "abc", position: { x: 5, y: 7 } }, 100, 80);

    const removes = ops.filter((o) => o.type === "remove");
    expect(removes.length).toBe(1);
    expect(removes[0].selector).toBe("#overlay-css-abc");

    const creates = ops.filter((o) => o.type === "create");
    expect(creates.length).toBe(1);
    expect(creates[0].tagName).toBe("link");
    expect(creates[0].options.attrs.id).toBe("overlay-css-abc");
    expect(creates[0].options.attrs.rel).toBe("stylesheet");
    expect(creates[0].options.attrs.href).toMatch(/^data:text\/css/);

    expect(ops.some((o) => o.type === "commit")).toBe(true);
  });
});

