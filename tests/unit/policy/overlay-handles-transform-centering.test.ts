import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

/**
 * Red: Global overlay CSS must use transform-based centering for corner handles
 * (robust to themed handle size/border), not fixed pixel offsets like -4px.
 */

describe("Overlay handles use transform centering for corners", () => {
  test("global CSS contains translate for corners and no fixed -4px offsets", () => {
    const overlayCss: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/constants/overlayCss.js"
    );
    const css = overlayCss.buildOverlayGlobalCssText().replace(/\s+/g, " ");

    // Expect transform translate on corners
    expect(css).toMatch(/\.rx-nw[^}]*transform:\s*translate\(-50%\s*,\s*-50%\)/);
    expect(css).toMatch(/\.rx-ne[^}]*transform:\s*translate\(50%\s*,\s*-50%\)/);
    expect(css).toMatch(/\.rx-se[^}]*transform:\s*translate\(50%\s*,\s*50%\)/);
    expect(css).toMatch(/\.rx-sw[^}]*transform:\s*translate\(-50%\s*,\s*50%\)/);

    // And no hard-coded -4px offsets on corners
    expect(css).not.toMatch(/\.rx-nw[^}]*left:\s*-4px|\.rx-nw[^}]*top:\s*-4px/);
    expect(css).not.toMatch(/\.rx-ne[^}]*right:\s*-4px|\.rx-ne[^}]*top:\s*-4px/);
    expect(css).not.toMatch(/\.rx-se[^}]*right:\s*-4px|\.rx-se[^}]*bottom:\s*-4px/);
    expect(css).not.toMatch(/\.rx-sw[^}]*left:\s*-4px|\.rx-sw[^}]*bottom:\s*-4px/);
  });
});

