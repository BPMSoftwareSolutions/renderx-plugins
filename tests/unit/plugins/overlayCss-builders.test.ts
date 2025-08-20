import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

/**
 * Red test: overlay global CSS builder must return full rules (not undefined or minimal fallback)
 */

describe("overlayCss builders", () => {
  test("buildOverlayGlobalCssText returns full rules with .rx-resize-overlay and handles", async () => {
    const uiPlugin: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/constants/overlayCss.js"
    );
    const css = uiPlugin.buildOverlayGlobalCssText();
    expect(css).toMatch(/\.rx-resize-overlay\b/);
    expect(css).toMatch(/\.rx-nw\b/);
    expect(css).toMatch(/\.rx-se\b/);
  });
});

