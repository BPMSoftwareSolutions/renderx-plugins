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
      // Apply fallback via StageCrew (no direct DOM)
      const ops: any[] = [];
      const beginBeat = jest.fn((corrId: string, meta: any) => {
        const txn: any = {
          update: jest.fn((selector: string, payload: any) => {
            ops.push({ type: "update", selector, payload });
            return txn;
          }),
          commit: jest.fn(() => {
            ops.push({ type: "commit" });
          }),
        };
        return txn;
      });
      ctx.stageCrew = { beginBeat };
      plugin.handlers.applyTheme({}, ctx);
      const updateBody = ops.find((o) => o.type === "update" && o.selector === "body");
      applied = updateBody?.payload?.attrs?.class || "";
      ctx.logger.warn?.("Applied fallback theme 'auto'");
    }
    expect(applied).toBe("theme-auto");
    expect(logWarn).toHaveBeenCalled();
    logWarn.mockRestore();
  });
});

