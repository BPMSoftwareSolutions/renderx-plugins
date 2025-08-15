import { loadRenderXPlugin, createTestLogger } from "../../utils/renderx-plugin-loader";

const pluginPath = "RenderX/public/plugins/theme-management-plugin/index.js";

describe("Theme Management: tolerant validation with fallback", () => {
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  function base(overrides: any = {}) {
    return {
      payload: {},
      logger: createTestLogger(),
      targetTheme: "invalid", // deliberately invalid
      sequence: plugin.sequence,
      ...overrides,
    } as any;
  }

  test("validateTheme throws; consumer can catch and apply fallback without crashing", () => {
    const ctx: any = base();
    // Contract: validateTheme currently throws for invalid themes
    expect(() => plugin.handlers.validateTheme({}, ctx)).toThrow("Invalid theme");

    // Simulate consumer fallback policy (ThemeProvider)
    const logWarn = jest.spyOn(ctx.logger, "warn").mockImplementation(() => {});
    let applied = "";
    try {
      plugin.handlers.validateTheme({}, ctx);
    } catch {
      // Consumer chooses fallback
      ctx.targetTheme = "auto";
      plugin.handlers.applyTheme({}, ctx);
      applied = document.body.className;
      ctx.logger.warn?.("Applied fallback theme 'auto'");
    }
    expect(applied).toBe("theme-auto");
    expect(logWarn).toHaveBeenCalled();
    logWarn.mockRestore();
  });
});

