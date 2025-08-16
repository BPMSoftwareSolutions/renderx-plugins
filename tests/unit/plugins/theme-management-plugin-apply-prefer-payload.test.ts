import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

describe("Theme Management Plugin - applyTheme prefers payload.theme over targetTheme", () => {
  const pluginPath = "RenderX/public/plugins/theme-management-plugin/index.js";

  test("when payload.theme is provided and differs from targetTheme, applyTheme uses payload.theme", () => {
    const plugin: any = loadRenderXPlugin(pluginPath);

    // Reset DOM theme markers
    document.documentElement.setAttribute("data-theme", "");
    document.body.className = "";

    // Context where targetTheme is 'auto' but payload.theme has been validated/resolved to 'dark'
    const ctx: any = {
      payload: { theme: "dark" },
      targetTheme: "auto",
      sequence: plugin.sequence,
    };

    const res = plugin.handlers.applyTheme({}, ctx);

    // Expect the applied theme to follow payload.theme ("dark"), not targetTheme ("auto")
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.body.className).toBe("theme-dark");
    expect(res).toEqual({ applied: true, theme: "dark" });
  });
});

