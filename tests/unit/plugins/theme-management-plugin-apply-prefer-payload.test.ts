import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

describe("Theme Management Plugin - applyTheme prefers payload.theme over targetTheme", () => {
  const pluginPath = "RenderX/public/plugins/theme-management-plugin/index.js";

  test("when payload.theme is provided and differs from targetTheme, applyTheme uses payload.theme via StageCrew", () => {
    const plugin: any = loadRenderXPlugin(pluginPath);

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

    // Context where targetTheme is 'auto' but payload.theme has been validated/resolved to 'dark'
    const ctx: any = {
      payload: { theme: "dark" },
      targetTheme: "auto",
      sequence: plugin.sequence,
      stageCrew: { beginBeat },
    };

    const res = plugin.handlers.applyTheme({}, ctx);

    const updateHtml = ops.find((o) => o.type === "update" && o.selector === "html");
    const updateBody = ops.find((o) => o.type === "update" && o.selector === "body");
    expect(updateHtml).toBeTruthy();
    expect(updateHtml.payload?.attrs?.["data-theme"]).toBe("dark");
    expect(updateBody.payload?.attrs?.class).toBe("theme-dark");
    expect(ops.some((o) => o.type === "commit")).toBe(true);

    // DOM not touched directly
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
    expect(document.body.className).toBe("");
    expect(res).toEqual({ applied: true, theme: "dark" });
  });
});

