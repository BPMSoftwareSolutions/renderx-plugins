import { loadRenderXPlugin, createTestLogger } from "../../utils/renderx-plugin-loader";

describe("Theme Management Plugin - StageCrew error handling", () => {
  const pluginPath = "RenderX/public/plugins/theme-management-plugin/index.js";

  test("applyTheme throws when stageCrew is missing", () => {
    const plugin: any = loadRenderXPlugin(pluginPath);
    const ctx: any = {
      sequence: plugin.sequence,
      targetTheme: "dark",
      logger: createTestLogger(),
      // stageCrew intentionally missing
    };
    expect(() => plugin.handlers.applyTheme({}, ctx)).toThrow(/StageCrew/i);
  });

  test("applyTheme logs in catch and rethrows when StageCrew transaction throws", () => {
    const plugin: any = loadRenderXPlugin(pluginPath);
    const logger = createTestLogger();
    const beginBeat = jest.fn(() => {
      throw new Error("boom");
    });
    const ctx: any = {
      sequence: plugin.sequence,
      targetTheme: "dark",
      logger,
      stageCrew: { beginBeat },
    };
    expect(() => plugin.handlers.applyTheme({}, ctx)).toThrow(/applyTheme failed|boom/i);
    expect(logger.info).toHaveBeenCalled();
  });
});

