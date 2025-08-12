import { loadRenderXPlugin } from "../../../utils/renderx-plugin-loader";

const utilPath = "RenderX/public/plugins/canvas-ui-plugin/utils/idUtils.js";

describe("idUtils - rx-comp naming", () => {
  test('makeRxCompClass("button") matches rx-comp-button-xxxxx', () => {
    const u: any = loadRenderXPlugin(utilPath);
    const cls = u.makeRxCompClass("button");
    expect(/^(rx-comp-button-[a-z0-9]{5})$/.test(cls)).toBe(true);
  });

  test('makeRxCompId("text") matches rx-comp-text-xxxxx', () => {
    const u: any = loadRenderXPlugin(utilPath);
    const id = u.makeRxCompId("text");
    expect(/^(rx-comp-text-[a-z0-9]{5})$/.test(id)).toBe(true);
  });
});
