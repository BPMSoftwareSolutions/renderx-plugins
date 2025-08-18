import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

describe("Theme Management Plugin - applyTheme uses StageCrew when provided", () => {
  const pluginPath = "RenderX/public/plugins/theme-management-plugin/index.js";

  test("applyTheme calls stageCrew.beginBeat/update/commit and does not touch DOM directly", () => {
    const plugin: any = loadRenderXPlugin(pluginPath);

    // Reset DOM theme markers so we can detect changes
    document.documentElement.setAttribute("data-theme", "");
    document.body.className = "";

    const ops: any[] = [];
    const beginBeat = jest.fn((corrId: string, meta: any) => {
      const txn: any = {
        update: jest.fn((selector: string, payload: any) => {
          ops.push({ type: "update", selector, payload });
          return txn;
        }),
        commit: jest.fn((options?: any) => {
          ops.push({ type: "commit", options });
          return undefined;
        }),
      };
      return txn;
    });

    const ctx: any = {
      sequence: plugin.sequence,
      targetTheme: "dark",
      stageCrew: { beginBeat },
      correlationId: "test-corr-1",
    };

    const res = plugin.handlers.applyTheme({}, ctx);

    // StageCrew path used
    expect(beginBeat).toHaveBeenCalled();
    const updateHtml = ops.find((o) => o.type === "update" && o.selector === "html");
    const updateBody = ops.find((o) => o.type === "update" && o.selector === "body");
    expect(updateHtml).toBeTruthy();
    expect(updateHtml.payload?.attrs?.["data-theme"]).toBe("dark");
    expect(updateHtml.payload?.style?.["--theme-transition-duration"]).toMatch(/ms$/);
    expect(updateBody).toBeTruthy();
    expect(updateBody.payload?.attrs?.class).toBe("theme-dark");
    expect(ops.some((o) => o.type === "commit")).toBe(true);

    // DOM not directly mutated when StageCrew present
    expect(document.documentElement.getAttribute("data-theme")).toBe("");
    expect(document.body.className).toBe("");

    expect(res).toEqual({ applied: true, theme: "dark" });
  });
});

