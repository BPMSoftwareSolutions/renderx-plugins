import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

describe("Overlay handle rules have sufficient specificity", () => {
  test("corner and edge selectors include .rx-resize-overlay .rx-resize-handle", () => {
    const overlayCss: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/constants/overlayCss.js"
    );
    const css = overlayCss.buildOverlayGlobalCssText().replace(/\s+/g, " ");

    ["nw","ne","se","sw","n","e","s","w"].forEach((p) => {
      expect(css).toMatch(new RegExp(`\\.rx-resize-overlay \\.rx-resize-handle\\.rx-${p}\\b`));
    });
  });
});

