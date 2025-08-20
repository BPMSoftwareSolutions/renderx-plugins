import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

describe("Overlay edge handles use transform centering (N/E/S/W)", () => {
  test("global CSS contains translate for edges and no fixed -4px offsets", () => {
    const overlayCss: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/constants/overlayCss.js"
    );
    const css = overlayCss.buildOverlayGlobalCssText().replace(/\s+/g, " ");

    // Expect transform translate on edges
    expect(css).toMatch(/\.rx-n[^}]*transform:\s*translate\(-50%\s*,\s*-50%\)/);
    expect(css).toMatch(/\.rx-e[^}]*transform:\s*translate\(50%\s*,\s*-50%\)/);
    expect(css).toMatch(/\.rx-s[^}]*transform:\s*translate\(-50%\s*,\s*50%\)/);
    expect(css).toMatch(/\.rx-w[^}]*transform:\s*translate\(-50%\s*,\s*-50%\)/);

    // And no hard-coded -4px offsets on edges
    expect(css).not.toMatch(/\.rx-n[^}]*top:\s*-4px/);
    expect(css).not.toMatch(/\.rx-e[^}]*right:\s*-4px/);
    expect(css).not.toMatch(/\.rx-s[^}]*bottom:\s*-4px/);
    expect(css).not.toMatch(/\.rx-w[^}]*left:\s*-4px/);
  });
});

